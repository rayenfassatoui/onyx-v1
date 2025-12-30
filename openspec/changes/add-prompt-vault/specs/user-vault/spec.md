# User Vault Specification

## ADDED Requirements

### Requirement: User Account
The system SHALL support multi-user accounts with unique identifiers.

#### Scenario: User has unique identity
- **WHEN** a user registers
- **THEN** a unique user ID is assigned
- **AND** the email address is verified as unique

#### Scenario: User data isolation
- **WHEN** multiple users exist in the system
- **THEN** each user can only access their own data

### Requirement: Private Vault
Each user SHALL own exactly one private vault for storing prompts.

#### Scenario: Vault creation on registration
- **WHEN** a new user account is created
- **THEN** a private vault is automatically created for that user

#### Scenario: One vault per user
- **WHEN** a user attempts to create additional vaults
- **THEN** the operation is rejected (v1 limitation)

#### Scenario: Vault ownership
- **WHEN** a vault is created
- **THEN** it is exclusively owned by the creating user

### Requirement: Vault Isolation
Vault data SHALL be isolated at the database level, ensuring users cannot access other users' prompts.

#### Scenario: Query scope enforcement
- **WHEN** a user requests prompts
- **THEN** only prompts from their vault are returned

#### Scenario: Cross-vault access prevention
- **WHEN** a user attempts to access a prompt from another vault
- **THEN** the request is rejected with a 403 Forbidden response

#### Scenario: API-level isolation
- **WHEN** any API request is made
- **THEN** the vault_id is validated against the authenticated user

### Requirement: Vault Contents
A vault SHALL contain prompts and tags as its primary content.

#### Scenario: Prompts belong to vault
- **WHEN** a prompt is created
- **THEN** it is associated with the user's vault

#### Scenario: Tags belong to vault
- **WHEN** a tag is created
- **THEN** it is scoped to the user's vault

#### Scenario: Tag uniqueness per vault
- **WHEN** a user creates a tag with an existing name
- **THEN** the creation is rejected (duplicate within vault)

### Requirement: Secure Authentication Flow
The system SHALL provide secure login and registration flows.

#### Scenario: Secure password handling
- **WHEN** a user sets or updates their passcode
- **THEN** the passcode is hashed using bcrypt before storage
- **AND** the plaintext passcode is never stored or logged

#### Scenario: Session security
- **WHEN** a user authenticates
- **THEN** a secure, httpOnly session token is created
- **AND** the token has a defined expiration time

#### Scenario: Logout
- **WHEN** a user logs out
- **THEN** the session token is invalidated
- **AND** subsequent requests with that token are rejected

### Requirement: Account Settings
Users SHALL be able to manage their account settings.

#### Scenario: Change passcode
- **WHEN** a user updates their passcode
- **THEN** the old passcode is validated first
- **AND** the new passcode is securely stored

#### Scenario: View account info
- **WHEN** a user accesses account settings
- **THEN** their email and account creation date are displayed
- **AND** sensitive information (passcode) is not displayed
