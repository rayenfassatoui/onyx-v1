## ADDED Requirements

### Requirement: Create Group
The system SHALL allow users to create groups for organized prompt sharing.

#### Scenario: User creates a new group
- **WHEN** user provides a group name and optional description
- **THEN** a new group is created
- **AND** the creator is automatically added as the group admin

#### Scenario: Group name is empty
- **WHEN** user attempts to create a group without a name
- **THEN** the system rejects the request with a validation error

### Requirement: Group Admin Management
The system SHALL designate the group creator as the admin with exclusive management permissions.

#### Scenario: Admin adds a member
- **WHEN** group admin adds a user to the group
- **THEN** the user is added as a regular member
- **AND** the new member can view prompts shared with the group

#### Scenario: Admin removes a member
- **WHEN** group admin removes a member from the group
- **THEN** the member is removed from the group
- **AND** the removed member can no longer access group-shared prompts

#### Scenario: Non-admin attempts to add member
- **WHEN** a regular group member attempts to add another user
- **THEN** the system rejects the request with a permission error

### Requirement: View Group Details
The system SHALL allow group members to view group information and member list.

#### Scenario: Member views group
- **WHEN** group member opens the group detail view
- **THEN** the system displays group name, description, and member list
- **AND** admin status is indicated for the admin user

### Requirement: Update Group
The system SHALL allow group admins to update group name and description.

#### Scenario: Admin updates group
- **WHEN** admin changes group name or description
- **THEN** the changes are saved
- **AND** all members see the updated information

#### Scenario: Non-admin attempts update
- **WHEN** regular member attempts to update group info
- **THEN** the system rejects the request with a permission error

### Requirement: Delete Group
The system SHALL allow group admins to delete the group.

#### Scenario: Admin deletes group
- **WHEN** admin confirms group deletion
- **THEN** the group is deleted
- **AND** all group shares are revoked
- **AND** members can no longer access group-shared prompts

#### Scenario: Non-admin attempts deletion
- **WHEN** regular member attempts to delete group
- **THEN** the system rejects the request with a permission error

### Requirement: Leave Group
The system SHALL allow regular members to leave a group voluntarily.

#### Scenario: Member leaves group
- **WHEN** member chooses to leave the group
- **THEN** the member is removed from the group
- **AND** the member can no longer access group-shared prompts

#### Scenario: Admin attempts to leave
- **WHEN** admin attempts to leave their own group
- **THEN** the system prevents leaving and suggests deleting or transferring ownership

### Requirement: List User Groups
The system SHALL allow users to view all groups they belong to.

#### Scenario: User views their groups
- **WHEN** user navigates to groups section
- **THEN** the system displays all groups the user is a member of
- **AND** indicates which groups the user is admin of
