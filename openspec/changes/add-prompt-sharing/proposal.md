# Change: Add Prompt Sharing System

## Why

Currently, Onyx Vault is a personal prompt management tool where users can only manage prompts within their own isolated vault. There is no way to collaborate or share prompts with other users. Teams, organizations, and communities that want to build and maintain prompt libraries together have no mechanism to do so. This limits the utility of the platform for collaborative workflows, knowledge sharing, and team productivity.

## What Changes

### Core Capabilities

- **Prompt Sharing**: Users can share their prompts with other users or groups, granting read-only access
- **Shared Prompts Section**: A dedicated UI section to view all prompts shared with the current user
- **Read-Only Access**: Recipients can view and copy shared prompts but cannot edit them
- **Group System**: Users can create groups with selected members for organized prompt sharing
- **Group Administration**: Group creators become admins with ability to add/remove members
- **In-App Notifications**: Members receive notifications when new prompts are shared to their groups

### Data Model Changes

New entities:
- `shared_prompts` - Junction table linking prompts to users/groups with read-only permissions
- `groups` - Group entity with name, description, and admin reference
- `group_members` - Junction table for group membership with role (admin/member)
- `notifications` - Notification entity for in-app alerts

### API Changes

New endpoints:
- `POST /api/prompts/:id/share` - Share a prompt with users or groups
- `DELETE /api/prompts/:id/share/:shareId` - Revoke sharing
- `GET /api/shared` - List prompts shared with the current user
- `POST /api/groups` - Create a new group
- `GET /api/groups` - List groups user belongs to
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group (admin only)
- `DELETE /api/groups/:id` - Delete group (admin only)
- `POST /api/groups/:id/members` - Add member (admin only)
- `DELETE /api/groups/:id/members/:userId` - Remove member (admin only)
- `GET /api/notifications` - List user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

### UI/UX Changes

- New "Shared with Me" section in sidebar navigation
- Shared prompt viewer (read-only mode with copy functionality)
- Group management UI (create, view, edit groups)
- Member management modal (add/remove members)
- Share dialog for prompts (select users/groups)
- Notification bell icon with unread count
- Notification dropdown/panel with notification list

## Impact

### Affected Specs (New Capabilities)
- `prompt-sharing` - Sharing prompts with users and groups
- `groups` - Group creation and management
- `notifications` - In-app notification system

### Affected Code
- Database schema (new tables: shared_prompts, groups, group_members, notifications)
- API routes for sharing, groups, and notifications
- Authentication middleware (group permission checks)
- Frontend components (share dialog, group manager, notification panel, shared prompts view)
- Sidebar navigation (new menu items)

### Non-Functional Requirements
- Shared prompts list load < 500ms
- Notification delivery < 2 seconds after share action
- Permission checks on all shared content access
- No unauthorized access to private prompts

### Out of Scope (v1)
- Public link sharing (share via URL without account)
- Comment/discussion threads on shared prompts
- Edit permissions (write access sharing)
- Group roles beyond admin/member
- Email notifications (in-app only for v1)
- Nested groups or group hierarchies
