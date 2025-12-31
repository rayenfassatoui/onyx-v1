# Tasks: Add Prompt Sharing System

## 1. Database Schema

- [ ] 1.1 Create `groups` table with id, name, description, creatorId, createdAt, updatedAt
- [ ] 1.2 Create `group_members` table with groupId, userId, role (admin/member), joinedAt
- [ ] 1.3 Create `shared_prompts` table with id, promptId, sharedById, sharedWithUserId (nullable), sharedWithGroupId (nullable), createdAt
- [ ] 1.4 Create `notifications` table with id, userId, type, title, message, metadata (JSON), read, createdAt
- [ ] 1.5 Add proper foreign key constraints and cascade deletes
- [ ] 1.6 Add indexes for efficient querying (userId, groupId, read status)
- [ ] 1.7 Generate and run database migration

## 2. Groups API

- [ ] 2.1 Implement POST /api/groups - Create group (creator becomes admin)
- [ ] 2.2 Implement GET /api/groups - List groups user belongs to
- [ ] 2.3 Implement GET /api/groups/:id - Get group details with members
- [ ] 2.4 Implement PUT /api/groups/:id - Update group name/description (admin only)
- [ ] 2.5 Implement DELETE /api/groups/:id - Delete group (admin only)
- [ ] 2.6 Implement POST /api/groups/:id/members - Add member (admin only)
- [ ] 2.7 Implement DELETE /api/groups/:id/members/:userId - Remove member (admin only)
- [ ] 2.8 Add admin permission middleware for group operations

## 3. Prompt Sharing API

- [ ] 3.1 Implement POST /api/prompts/:id/share - Share prompt with user or group
- [ ] 3.2 Validate ownership before allowing share
- [ ] 3.3 Implement DELETE /api/prompts/:id/share/:shareId - Revoke share
- [ ] 3.4 Implement GET /api/shared - List prompts shared with current user
- [ ] 3.5 Include prompts shared directly and via group membership
- [ ] 3.6 Add permission check for viewing shared prompts

## 4. Notifications API

- [ ] 4.1 Implement GET /api/notifications - List user notifications (paginated)
- [ ] 4.2 Implement PUT /api/notifications/:id/read - Mark single notification read
- [ ] 4.3 Implement PUT /api/notifications/read-all - Mark all notifications read
- [ ] 4.4 Create notification service for creating notifications
- [ ] 4.5 Trigger notification when prompt is shared to user
- [ ] 4.6 Trigger notification when prompt is shared to group (notify all members)

## 5. Frontend: Shared Prompts Section

- [ ] 5.1 Add "Shared with Me" item to sidebar navigation
- [ ] 5.2 Create shared prompts page/view
- [ ] 5.3 Display shared prompts in grid format (similar to dashboard)
- [ ] 5.4 Show who shared the prompt (user name or group name)
- [ ] 5.5 Create read-only prompt viewer for shared prompts
- [ ] 5.6 Add copy to clipboard functionality for shared prompts
- [ ] 5.7 Hide edit/delete actions for shared prompts

## 6. Frontend: Share Dialog

- [ ] 6.1 Create SharePromptDialog component
- [ ] 6.2 Add share button to prompt card and prompt viewer
- [ ] 6.3 Implement user search/selection in share dialog
- [ ] 6.4 Implement group selection in share dialog
- [ ] 6.5 Show current shares with ability to revoke
- [ ] 6.6 Add loading and success/error states

## 7. Frontend: Group Management

- [ ] 7.1 Add "Groups" section to sidebar or settings
- [ ] 7.2 Create groups list view
- [ ] 7.3 Create group creation dialog
- [ ] 7.4 Create group detail view with member list
- [ ] 7.5 Implement add member functionality (admin only)
- [ ] 7.6 Implement remove member functionality (admin only)
- [ ] 7.7 Add leave group functionality for non-admin members
- [ ] 7.8 Create group edit dialog (admin only)
- [ ] 7.9 Create group delete confirmation (admin only)

## 8. Frontend: Notifications

- [ ] 8.1 Create notification bell icon component in header/sidebar
- [ ] 8.2 Show unread notification count badge
- [ ] 8.3 Create notification dropdown/panel
- [ ] 8.4 Display notification list with timestamps
- [ ] 8.5 Implement mark as read on click
- [ ] 8.6 Implement mark all as read button
- [ ] 8.7 Link notifications to relevant content (shared prompt)

## 9. Testing

- [ ] 9.1 Write API tests for group CRUD operations
- [ ] 9.2 Write API tests for sharing operations
- [ ] 9.3 Write API tests for notification operations
- [ ] 9.4 Test permission enforcement (admin vs member)
- [ ] 9.5 Test shared prompt access control
- [ ] 9.6 Test notification delivery on share

## 10. Documentation

- [ ] 10.1 Update API documentation with new endpoints
- [ ] 10.2 Update user guide with sharing instructions
- [ ] 10.3 Document group management workflow
