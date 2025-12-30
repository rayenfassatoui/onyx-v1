# Design Document: Onyx Prompt Vault

## Context

Onyx Prompt Vault is a premium prompt engineering utility targeting developers, prompt engineers, and AI professionals. The application needs to handle secure storage, organization, versioning, and deployment of prompt templates. It emphasizes a Swiss industrial design aesthetic with focus on clarity, control, and speed.

**Key Stakeholders:**
- Prompt engineers (primary)
- Software developers
- AI product builders
- Technical content creators

**Constraints:**
- Must achieve < 500ms dashboard load time
- Zero data loss tolerance
- Secure by default (encrypted storage, isolated vaults)

## Goals / Non-Goals

### Goals
- Provide secure, distraction-free prompt management
- Enable fast prompt selection → customization → deployment (< 10 seconds)
- Offer professional-grade organization and version control
- Deliver premium, minimal "Onyx" aesthetic
- Support 80%+ prompt usage with variable injection

### Non-Goals
- Not a chat interface or AI experimentation tool
- Not a public marketplace (v1)
- Not a real-time collaboration platform (v1)
- Not a prompt execution engine (prompts are exported, not run)

## Technical Decisions

### 1. Database Architecture

**Decision:** PostgreSQL (Neon) with Drizzle ORM

**Rationale:**
- Neon provides serverless PostgreSQL with auto-scaling
- Drizzle offers type-safe queries and excellent TypeScript integration
- Relational model suits the entity relationships (User → Vault → Prompt → Version)

**Schema Overview:**

```
┌─────────┐       ┌─────────┐       ┌─────────┐       ┌───────────────┐
│  User   │──1:1──│  Vault  │──1:N──│ Prompt  │──1:N──│ PromptVersion │
└─────────┘       └─────────┘       └─────────┘       └───────────────┘
                       │                 │
                       │                 │
                      1:N               N:M
                       │                 │
                       ▼                 ▼
                  ┌─────────┐       ┌─────────┐
                  │   Tag   │◄──────│PromptTag│
                  └─────────┘       └─────────┘
```

**Rationale:**
- Serverless PostgreSQL with auto-scaling
- Excellent TypeScript integration with Drizzle ORM
- Relational model suits the entity relationships

### 2. Authentication Strategy

**Decision:** Passcode-based "Airlock" with session tokens

**Rationale:**
- Simple 4-digit passcode aligns with "precision instrument" UX
- Session tokens (JWT or secure cookies) for subsequent requests
- User-defined or environment-based ACCESS_CODE support

**Flow:**
1. User opens app → Lock screen displayed
2. Enter 4-digit passcode → Validate against stored hash
3. Success → Generate session token, unlock animation, redirect to dashboard
4. Failure → Shake animation, increment attempt counter

**Security Measures:**
- Passcode stored as bcrypt hash
- Rate limiting on validation attempts
- Session expiry with configurable TTL

### 3. Version History Implementation

**Decision:** Append-only version table with full content snapshots

**Rationale:**
- Immutability ensures reliable restore capability
- Full snapshots avoid complex diff/patch logic
- Storage cost acceptable for text content

**Implementation:**
```typescript
// On prompt update
async function updatePrompt(promptId: string, newContent: PromptContent) {
  return db.transaction(async (tx) => {
    // 1. Create version snapshot
    const currentPrompt = await tx.query.prompts.findFirst({ where: eq(prompts.id, promptId) });
    const versionCount = await tx.query.promptVersions.count({ where: eq(promptVersions.promptId, promptId) });
    
    await tx.insert(promptVersions).values({
      promptId,
      content: currentPrompt.content,
      metadata: currentPrompt.metadata,
      versionNumber: versionCount + 1,
      createdAt: new Date()
    });
    
    // 2. Update current prompt
    await tx.update(prompts)
      .set({ ...newContent, updatedAt: new Date() })
      .where(eq(prompts.id, promptId));
  });
}
```

### 4. Variable Injection Engine

**Decision:** Client-side regex detection with dynamic form generation

**Rationale:**
- Instant preview without API calls
- Regex pattern `\{\{(\w+)\}\}` is simple and reliable
- Form fields auto-generated from detected variables

**Implementation:**
```typescript
const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

function extractVariables(content: string): string[] {
  const matches = content.matchAll(VARIABLE_PATTERN);
  return [...new Set([...matches].map(m => m[1]))];
}

function resolveTemplate(content: string, values: Record<string, string>): string {
  return content.replace(VARIABLE_PATTERN, (_, name) => values[name] ?? `{{${name}}}`);
}
```

### 5. Search Implementation

**Decision:** PostgreSQL full-text search with pg_trgm extension

**Rationale:**
- Native database capability, no external service
- Trigram indexes for fuzzy matching
- Combined with tag filtering for powerful queries

**Indexes:**
```sql
CREATE INDEX idx_prompts_title_trgm ON prompts USING gin (title gin_trgm_ops);
CREATE INDEX idx_prompts_content_trgm ON prompts USING gin (content gin_trgm_ops);
CREATE INDEX idx_prompts_vault_id ON prompts (vault_id);
CREATE INDEX idx_tags_vault_id ON tags (vault_id);
```

### 6. Export/Import Format

**Decision:** JSON as primary format, Markdown as human-readable option

**JSON Schema:**
```json
{
  "version": "1.0",
  "exportedAt": "2025-01-15T10:00:00Z",
  "prompts": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "content": "string with {{variables}}",
      "tags": ["tag1", "tag2"],
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ]
}
```

**Conflict Resolution:**
- `overwrite`: Replace existing prompt with same title
- `duplicate`: Create new prompt with "(imported)" suffix
- `skip`: Ignore prompts that already exist

### 7. AI Integration Architecture

**Decision:** Server-side AI calls with streaming response

**Rationale:**
- API keys kept secure on server
- Streaming provides better UX for long responses
- Manual approval prevents accidental overwrites

**Flow:**
1. User clicks "Analyze" or "Generate Variants"
2. Server sends prompt to AI service
3. Stream response to client
4. Display suggestions in review panel
5. User approves → Save as new version or variant

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Passcode security (4 digits = 10,000 combinations) | Rate limiting, account lockout after N attempts |
| Version storage growth | Implement version retention policy (keep last N versions) |
| AI API costs | Rate limiting per user, optional feature flag |
| Search performance at scale | Pagination, result limits, consider dedicated search if >100k prompts |
| Export file size | Chunked export for large vaults |

## Migration Plan

### Phase 1: Core Infrastructure
1. Set up Neon PostgreSQL instance
2. Configure Drizzle ORM and run migrations
3. Deploy authentication endpoints

### Phase 2: Core Features
1. Prompt CRUD operations
2. Dashboard and navigation
3. Variable injection engine

### Phase 3: Advanced Features
1. Version history
2. Export/Import
3. AI integration

### Rollback Strategy
- Database migrations are reversible (down migrations provided)
- Feature flags for AI integration allow disabling without deploy
- Export existing data before major migrations

## Open Questions

1. **Biometric support timeline**: Should we include fingerprint/Face ID in v1.1?
2. **AI provider selection**: OpenAI vs Anthropic vs configurable?
3. **Offline support**: Should prompts be cached locally for offline access?
4. **Team vaults**: Architecture considerations for future team feature?
