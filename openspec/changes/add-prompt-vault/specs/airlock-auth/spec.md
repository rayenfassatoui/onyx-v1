# Airlock Authentication Specification

## ADDED Requirements

### Requirement: Lock Screen Display
The system SHALL display a lock screen when the application is loaded, preventing access to vault contents until authentication is complete.

#### Scenario: App loads with lock screen
- **WHEN** a user opens the application
- **THEN** the lock screen is displayed
- **AND** the main vault content is not accessible

#### Scenario: Lock screen blocks navigation
- **WHEN** a user attempts to navigate to a protected route without authentication
- **THEN** the user is redirected to the lock screen

### Requirement: Passcode Input
The system SHALL provide a 4-digit passcode input interface on the lock screen.

#### Scenario: Passcode entry
- **WHEN** the lock screen is displayed
- **THEN** the user can enter a 4-digit numeric passcode
- **AND** each digit entry is visually confirmed (dot or filled indicator)

#### Scenario: Passcode input masking
- **WHEN** the user enters passcode digits
- **THEN** the digits are masked (not displayed in plain text)

### Requirement: Passcode Validation
The system SHALL validate the entered passcode against the user's stored passcode hash.

#### Scenario: Valid passcode
- **WHEN** the user enters a valid 4-digit passcode
- **THEN** the passcode is validated against the stored hash
- **AND** the user is granted access to the vault

#### Scenario: Invalid passcode
- **WHEN** the user enters an invalid passcode
- **THEN** the system rejects the authentication attempt
- **AND** an error state is displayed

### Requirement: Authentication Visual Feedback
The system SHALL provide distinct visual feedback for successful and failed authentication attempts.

#### Scenario: Success animation
- **WHEN** authentication succeeds
- **THEN** a smooth unlock animation is displayed
- **AND** the user is transitioned to the dashboard

#### Scenario: Failure animation
- **WHEN** authentication fails
- **THEN** a shake animation is displayed on the passcode input
- **AND** the input is cleared for retry
- **AND** an error message is shown

### Requirement: Session Management
The system SHALL create a secure session token upon successful authentication.

#### Scenario: Session token creation
- **WHEN** the user successfully authenticates
- **THEN** a secure session token is generated
- **AND** the token is stored securely (httpOnly cookie or secure storage)

#### Scenario: Session expiry
- **WHEN** a session token expires
- **THEN** the user is redirected to the lock screen
- **AND** protected routes become inaccessible

### Requirement: Rate Limiting
The system SHALL enforce rate limiting on passcode validation attempts to prevent brute-force attacks.

#### Scenario: Rate limit exceeded
- **WHEN** more than 5 failed attempts occur within 1 minute
- **THEN** further attempts are blocked for a cooldown period
- **AND** the user is notified of the lockout

#### Scenario: Rate limit reset
- **WHEN** the cooldown period expires
- **THEN** the user can attempt authentication again

### Requirement: User Registration
The system SHALL allow new users to register with an email and create a passcode.

#### Scenario: New user registration
- **WHEN** a user provides a valid email and 4-digit passcode
- **THEN** a new user account is created
- **AND** the passcode is stored as a secure hash
- **AND** a private vault is created for the user

#### Scenario: Duplicate email rejection
- **WHEN** a user attempts to register with an existing email
- **THEN** the registration is rejected
- **AND** an appropriate error message is displayed
