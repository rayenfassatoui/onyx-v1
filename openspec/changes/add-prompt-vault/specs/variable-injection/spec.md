# Variable Injection Specification

## ADDED Requirements

### Requirement: Variable Pattern Detection
The system SHALL detect variables in prompt content using the `{{variable}}` syntax pattern.

#### Scenario: Single variable detection
- **WHEN** a prompt contains `{{name}}`
- **THEN** the system identifies "name" as a variable

#### Scenario: Multiple variables detection
- **WHEN** a prompt contains `{{name}}`, `{{role}}`, and `{{task}}`
- **THEN** the system identifies all three as unique variables

#### Scenario: Duplicate variable handling
- **WHEN** a prompt contains `{{name}}` twice
- **THEN** the system identifies "name" as a single variable (deduplicated)

#### Scenario: Nested or invalid patterns
- **WHEN** a prompt contains `{{{invalid}}}` or `{{nested {{var}}}}`
- **THEN** the system does not recognize these as valid variables

### Requirement: Dynamic Form Generation
The system SHALL automatically generate input fields for each detected variable.

#### Scenario: Form field creation
- **WHEN** a prompt with variables is opened
- **THEN** an input field is generated for each unique variable
- **AND** field labels match variable names

#### Scenario: Form field ordering
- **WHEN** multiple variables are detected
- **THEN** input fields are displayed in the order they first appear in the content

#### Scenario: Empty state
- **WHEN** a prompt has no variables
- **THEN** no variable input form is displayed

### Requirement: Live Preview
The system SHALL display a live preview of the prompt with variable values substituted in real-time.

#### Scenario: Real-time substitution
- **WHEN** the user types a value into a variable input field
- **THEN** the preview updates immediately to show the substituted value

#### Scenario: Multiple variable preview
- **WHEN** multiple variables have values entered
- **THEN** all values are substituted in the preview simultaneously

#### Scenario: Partial substitution
- **WHEN** some variables have values and others are empty
- **THEN** filled variables show their values
- **AND** empty variables display as `{{variableName}}` in the preview

### Requirement: Variable Validation
The system SHALL validate that all required variables have values before deployment.

#### Scenario: Missing variable warning
- **WHEN** the user attempts to copy a prompt with empty variables
- **THEN** a warning is displayed indicating which variables are missing

#### Scenario: All variables filled
- **WHEN** all variables have non-empty values
- **THEN** the copy action proceeds without warning

#### Scenario: Allow copy with warning
- **WHEN** the user acknowledges the missing variable warning
- **THEN** the prompt can still be copied with unfilled variables intact

### Requirement: One-Click Copy of Resolved Prompt
The system SHALL provide a single-click action to copy the fully resolved prompt to clipboard.

#### Scenario: Copy resolved content
- **WHEN** the user clicks the copy button with all variables filled
- **THEN** the resolved prompt (with all substitutions) is copied to clipboard

#### Scenario: Copy success feedback
- **WHEN** the copy action completes
- **THEN** a toast notification confirms the copy was successful

#### Scenario: Copy failure handling
- **WHEN** clipboard access fails
- **THEN** an error notification is displayed
- **AND** the user is offered an alternative (select-all in modal)

### Requirement: Variable Value Persistence
The system SHALL optionally remember previously entered variable values for reuse.

#### Scenario: Remember last values
- **WHEN** a user fills variables and copies a prompt
- **THEN** the entered values are stored in session/local storage

#### Scenario: Pre-fill from history
- **WHEN** the user opens the same prompt again
- **THEN** previously entered values are pre-filled in the form

#### Scenario: Clear saved values
- **WHEN** the user clicks "Clear" on the variable form
- **THEN** all input fields are emptied
- **AND** saved values are removed
