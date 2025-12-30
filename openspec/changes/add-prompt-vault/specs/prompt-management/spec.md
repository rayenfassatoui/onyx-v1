# Prompt Management Specification

## ADDED Requirements

### Requirement: Prompt Data Model
The system SHALL store prompts with the following properties: id, title, description, content, tags, createdAt, updatedAt, and version.

#### Scenario: Prompt creation stores all fields
- **WHEN** a prompt is created with title, description, content, and tags
- **THEN** all fields are persisted
- **AND** createdAt and updatedAt are set to the current timestamp
- **AND** an initial version is created

### Requirement: Create Prompt
The system SHALL allow users to create new prompt templates within their vault.

#### Scenario: Create prompt with all fields
- **WHEN** a user submits a new prompt with title, description, content, and tags
- **THEN** the prompt is created in the user's vault
- **AND** a success confirmation is displayed

#### Scenario: Create prompt with required fields only
- **WHEN** a user submits a prompt with only title and content
- **THEN** the prompt is created with empty description and no tags

#### Scenario: Create prompt validation
- **WHEN** a user attempts to create a prompt without a title
- **THEN** the creation is rejected
- **AND** a validation error is displayed

### Requirement: Read Prompt
The system SHALL display prompts in a focused modal or panel view.

#### Scenario: View prompt details
- **WHEN** a user selects a prompt from the dashboard
- **THEN** the prompt is displayed in a focused view
- **AND** all fields (title, description, content, tags, metadata) are visible

#### Scenario: Read-only mode
- **WHEN** a user views a prompt
- **THEN** the content is displayed in a read-only format by default
- **AND** an edit action is available

### Requirement: Update Prompt
The system SHALL allow users to edit any field of an existing prompt.

#### Scenario: Edit prompt content
- **WHEN** a user modifies a prompt's content and saves
- **THEN** the prompt is updated
- **AND** updatedAt is set to the current timestamp
- **AND** a new version is created automatically

#### Scenario: Edit prompt tags
- **WHEN** a user adds or removes tags from a prompt
- **THEN** the tag associations are updated

#### Scenario: Edit validation
- **WHEN** a user attempts to save a prompt with empty title
- **THEN** the update is rejected with a validation error

### Requirement: Delete Prompt
The system SHALL allow users to permanently delete prompts with confirmation.

#### Scenario: Delete with confirmation
- **WHEN** a user initiates prompt deletion
- **THEN** a confirmation dialog is displayed
- **AND** the prompt is only deleted after confirmation

#### Scenario: Delete cancellation
- **WHEN** a user cancels the deletion confirmation
- **THEN** the prompt is not deleted
- **AND** the user returns to the previous view

#### Scenario: Permanent deletion
- **WHEN** a user confirms prompt deletion
- **THEN** the prompt and all its versions are permanently removed
- **AND** a success notification is displayed

### Requirement: Prompt List Display
The system SHALL display prompts as a spotlight grid of cards on the dashboard.

#### Scenario: Grid layout
- **WHEN** the dashboard is loaded
- **THEN** prompts are displayed in a responsive grid layout
- **AND** each card shows title, description preview, and tags

#### Scenario: Empty state
- **WHEN** a user's vault has no prompts
- **THEN** an empty state is displayed with guidance to create the first prompt

### Requirement: Prompt Sorting
The system SHALL support sorting prompts by creation date or last updated date.

#### Scenario: Sort by creation date
- **WHEN** the user selects "Sort by Creation Date"
- **THEN** prompts are ordered by createdAt (newest first by default)

#### Scenario: Sort by last updated
- **WHEN** the user selects "Sort by Last Updated"
- **THEN** prompts are ordered by updatedAt (most recent first)

### Requirement: Prompt Search
The system SHALL provide real-time search across prompt title, content, and tags.

#### Scenario: Search by title
- **WHEN** the user enters a search query
- **THEN** prompts with matching titles are displayed

#### Scenario: Search by content
- **WHEN** the user enters a search query
- **THEN** prompts with matching content are included in results

#### Scenario: Search by tag
- **WHEN** the user enters a tag name as search query
- **THEN** prompts with that tag are included in results

#### Scenario: Real-time filtering
- **WHEN** the user types in the search field
- **THEN** results update in real-time without requiring form submission

### Requirement: Tag Filtering
The system SHALL provide a tag rail for toggle-based prompt filtering.

#### Scenario: Filter by single tag
- **WHEN** the user clicks a tag in the tag rail
- **THEN** only prompts with that tag are displayed

#### Scenario: Filter by multiple tags
- **WHEN** the user selects multiple tags
- **THEN** prompts matching any of the selected tags are displayed

#### Scenario: Clear tag filter
- **WHEN** the user deselects all tags
- **THEN** all prompts are displayed (no filter applied)

### Requirement: Keyboard Navigation
The system SHALL support keyboard-first navigation on the dashboard.

#### Scenario: Arrow key navigation
- **WHEN** the user presses arrow keys on the dashboard
- **THEN** focus moves between prompt cards accordingly

#### Scenario: Enter to open
- **WHEN** a prompt card is focused and Enter is pressed
- **THEN** the prompt is opened in the detail view

#### Scenario: Escape to close
- **WHEN** viewing a prompt and Escape is pressed
- **THEN** the detail view is closed
- **AND** focus returns to the dashboard

### Requirement: Copy Prompt
The system SHALL allow one-click copying of prompt content to clipboard.

#### Scenario: Copy to clipboard
- **WHEN** the user clicks the copy button on a prompt
- **THEN** the prompt content is copied to the clipboard
- **AND** a success notification is displayed

#### Scenario: Copy resolved prompt
- **WHEN** a prompt has variables filled in and the user clicks copy
- **THEN** the resolved (substituted) content is copied
