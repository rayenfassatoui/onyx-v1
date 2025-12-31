# Design: Prompt Sharing System

## Context

Onyx Vault currently operates as a single-user prompt management system. Each user has their own isolated vault with private prompts. This design document outlines the technical approach for adding collaborative features while maintaining the existing security model.

### Stakeholders
- End users who want to share prompts with teammates
- Team leads who need to manage group membership
- System maintainers who need to ensure security

### Constraints
- Must not expose private prompts without explicit sharing
- Must integrate with existing authentication system
- Must not impact performance of existing operations
- PostgreSQL/Drizzle ORM stack

## Goals / Non-Goals

### Goals
- Enable prompt sharing between users with read-only access
- Provide group-based sharing for team collaboration
- Notify users when content is shared with them
- Maintain clear ownership and permission boundaries

### Non-Goals
- Real-time collaboration or co-editing
- Public sharing via URLs
- Complex permission hierarchies (view/edit/admin tiers)
- External integrations (Slack, email notifications)

## Decisions

### Decision 1: Sharing Model

**What**: Use a junction table (`shared_prompts`) that can reference either a user or a group.

**Why**: This allows flexible sharing to individuals or groups with a single table. Using nullable foreign keys (`sharedWithUserId` OR `sharedWithGroupId`) keeps the model simple.

**Alternatives Considered**:
- Separate tables for user shares and group shares: More normalized but adds complexity
- JSON array of shared user IDs on prompt: Poor query performance, harder to revoke

### Decision 2: Group Roles

**What**: Two roles only - `admin` and `member`.

**Why**: Simplicity. Admin can manage membership, members can only view shared content. More complex RBAC can be added later if needed.

**Alternatives Considered**:
- Role-based with custom permissions: Over-engineering for v1
- No roles (everyone equal): No way to manage membership safely

### Decision 3: Notification Storage

**What**: Store notifications in database with `metadata` JSON field for flexibility.

**Why**: Allows different notification types with varying payloads without schema changes. Enables querying and pagination.

**Alternatives Considered**:
- Real-time only (WebSocket): Loses notifications if user offline
- External service (Firebase, Pusher): Adds dependency and cost

### Decision 4: Permission Checks

**What**: Check permissions at API layer before returning shared prompts.

**Why**: Centralized security. Every access to a shared prompt goes through a permission check that verifies:
1. User owns the prompt, OR
2. Prompt is shared directly with user, OR
3. Prompt is shared with a group the user belongs to

**Implementation**:
```typescript
async function canAccessPrompt(userId: string, promptId: string): Promise<boolean> {
  // Check ownership
  const owned = await db.query.prompts.findFirst({
    where: and(eq(prompts.id, promptId), eq(prompts.vaultId, userVaultId))
  });
  if (owned) return true;

  // Check direct share
  const directShare = await db.query.sharedPrompts.findFirst({
    where: and(
      eq(sharedPrompts.promptId, promptId),
      eq(sharedPrompts.sharedWithUserId, userId)
    )
  });
  if (directShare) return true;

  // Check group share
  const userGroups = await db.query.groupMembers.findMany({
    where: eq(groupMembers.userId, userId),
    columns: { groupId: true }
  });
  const groupIds = userGroups.map(g => g.groupId);
  
  const groupShare = await db.query.sharedPrompts.findFirst({
    where: and(
      eq(sharedPrompts.promptId, promptId),
      inArray(sharedPrompts.sharedWithGroupId, groupIds)
    )
  });
  return !!groupShare;
}
```

## Data Model

### New Tables

```sql
-- Groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group Members
CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Shared Prompts
CREATE TABLE shared_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  shared_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shared_with_group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT share_target_check CHECK (
    (shared_with_user_id IS NOT NULL AND shared_with_group_id IS NULL) OR
    (shared_with_user_id IS NULL AND shared_with_group_id IS NOT NULL)
  )
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_shared_prompts_user ON shared_prompts(shared_with_user_id);
CREATE INDEX idx_shared_prompts_group ON shared_prompts(shared_with_group_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
```

## Risks / Trade-offs

### Risk: Performance with Many Shares
- **Mitigation**: Add proper indexes, paginate results, consider caching hot data

### Risk: Notification Spam
- **Mitigation**: Batch notifications for bulk shares, add rate limiting

### Risk: Group Admin Leaving
- **Mitigation**: Creator is always admin, can transfer ownership or auto-promote oldest member

### Trade-off: Read-Only Sharing Only
- **Accepted**: Keeps permission model simple. Edit permissions add significant complexity.

## Migration Plan

1. Create new tables with migration
2. No data migration needed (new feature)
3. Deploy API endpoints
4. Deploy frontend components
5. Feature flag optional for gradual rollout

### Rollback
- Remove frontend components
- Disable API endpoints
- Tables can remain (no impact on existing functionality)

## Open Questions

1. Should group creators be able to transfer admin role?
2. Maximum group size limit?
3. Should we show who shared a prompt within a group?
4. Notification preferences per user?
