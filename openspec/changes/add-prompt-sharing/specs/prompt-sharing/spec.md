## ADDED Requirements

### Requirement: Share Prompt with User
The system SHALL allow a prompt owner to share their prompt with another user by user ID or email.

#### Scenario: Owner shares prompt with another user
- **WHEN** prompt owner selects "Share" and specifies a target user
- **THEN** a share record is created linking the prompt to the target user
- **AND** the target user receives a notification about the shared prompt

#### Scenario: Non-owner attempts to share prompt
- **WHEN** a user who does not own the prompt attempts to share it
- **THEN** the system rejects the request with a permission error

### Requirement: Share Prompt with Group
The system SHALL allow a prompt owner to share their prompt with a group they belong to.

#### Scenario: Owner shares prompt with group
- **WHEN** prompt owner selects "Share" and specifies a target group
- **THEN** a share record is created linking the prompt to the group
- **AND** all group members receive a notification about the shared prompt

#### Scenario: Owner not in group attempts to share
- **WHEN** prompt owner attempts to share with a group they don't belong to
- **THEN** the system rejects the request with a validation error

### Requirement: View Shared Prompts
The system SHALL provide a dedicated section where users can view all prompts shared with them.

#### Scenario: User views shared prompts list
- **WHEN** user navigates to "Shared with Me" section
- **THEN** the system displays all prompts shared directly with the user
- **AND** all prompts shared via groups the user belongs to

#### Scenario: No shared prompts
- **WHEN** user has no prompts shared with them
- **THEN** the system displays an empty state message

### Requirement: Read-Only Access to Shared Prompts
The system SHALL enforce read-only access for shared prompts, preventing recipients from editing.

#### Scenario: Recipient views shared prompt
- **WHEN** recipient opens a shared prompt
- **THEN** the prompt content is displayed in read-only mode
- **AND** edit and delete actions are hidden

#### Scenario: Recipient copies shared prompt content
- **WHEN** recipient clicks "Copy" on a shared prompt
- **THEN** the prompt content is copied to clipboard
- **AND** a success message is displayed

### Requirement: Revoke Prompt Share
The system SHALL allow prompt owners to revoke previously granted shares.

#### Scenario: Owner revokes share
- **WHEN** prompt owner removes a share from the share list
- **THEN** the share record is deleted
- **AND** the recipient can no longer access the prompt

#### Scenario: Recipient attempts to access revoked prompt
- **WHEN** recipient tries to view a prompt whose share was revoked
- **THEN** the system returns a not found or permission denied error
