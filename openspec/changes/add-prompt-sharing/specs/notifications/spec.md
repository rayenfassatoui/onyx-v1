## ADDED Requirements

### Requirement: Create Notification on Share
The system SHALL create an in-app notification when a prompt is shared with a user or group.

#### Scenario: Prompt shared with user
- **WHEN** a prompt is shared with a specific user
- **THEN** a notification is created for that user
- **AND** the notification includes the prompt title and sharer name

#### Scenario: Prompt shared with group
- **WHEN** a prompt is shared with a group
- **THEN** a notification is created for each group member (except the sharer)
- **AND** the notification includes the prompt title, sharer name, and group name

### Requirement: View Notifications
The system SHALL allow users to view their notifications.

#### Scenario: User views notification list
- **WHEN** user opens the notification panel
- **THEN** notifications are displayed in reverse chronological order
- **AND** unread notifications are visually distinguished

#### Scenario: No notifications
- **WHEN** user has no notifications
- **THEN** the system displays an empty state message

### Requirement: Unread Notification Count
The system SHALL display the count of unread notifications.

#### Scenario: User has unread notifications
- **WHEN** user has unread notifications
- **THEN** a badge with the count is displayed on the notification icon

#### Scenario: All notifications read
- **WHEN** user has no unread notifications
- **THEN** no badge is displayed on the notification icon

### Requirement: Mark Notification as Read
The system SHALL allow users to mark individual notifications as read.

#### Scenario: User clicks notification
- **WHEN** user clicks on a notification
- **THEN** the notification is marked as read
- **AND** the unread count is decremented

### Requirement: Mark All Notifications as Read
The system SHALL allow users to mark all notifications as read at once.

#### Scenario: User clicks "Mark All as Read"
- **WHEN** user clicks the mark all as read button
- **THEN** all notifications are marked as read
- **AND** the unread count becomes zero

### Requirement: Notification Navigation
The system SHALL allow users to navigate to related content from a notification.

#### Scenario: User clicks share notification
- **WHEN** user clicks a prompt share notification
- **THEN** the system navigates to the shared prompt view
