# Export/Import Specification

## ADDED Requirements

### Requirement: JSON Export
The system SHALL export prompts in structured JSON format.

#### Scenario: Export all prompts as JSON
- **WHEN** the user selects JSON export
- **THEN** all prompts in the vault are exported as a JSON file

#### Scenario: JSON schema structure
- **WHEN** prompts are exported as JSON
- **THEN** the output includes version, exportedAt timestamp, and prompts array
- **AND** each prompt includes id, title, description, content, tags, createdAt, updatedAt

#### Scenario: Export subset
- **WHEN** the user selects specific prompts for export
- **THEN** only the selected prompts are included in the export file

### Requirement: Markdown Export
The system SHALL export prompts in human-readable Markdown format.

#### Scenario: Export as Markdown
- **WHEN** the user selects Markdown export
- **THEN** prompts are exported as a .md file with formatted content

#### Scenario: Markdown structure
- **WHEN** prompts are exported as Markdown
- **THEN** each prompt is formatted with title as heading
- **AND** description as subheading
- **AND** content in code block
- **AND** tags listed with labels

### Requirement: Export User Interface
The system SHALL provide an intuitive export interface with format selection.

#### Scenario: Format selection
- **WHEN** the user opens the export dialog
- **THEN** options for JSON and Markdown formats are available

#### Scenario: Download initiation
- **WHEN** the user confirms export
- **THEN** the file is downloaded to the user's device

#### Scenario: Export filename
- **WHEN** a file is exported
- **THEN** the filename includes vault name and export timestamp

### Requirement: Import Validation
The system SHALL validate imported files before processing.

#### Scenario: Valid JSON import
- **WHEN** a valid JSON export file is uploaded
- **THEN** the file is parsed and validated
- **AND** a preview of importable prompts is shown

#### Scenario: Invalid file rejection
- **WHEN** an invalid or corrupted file is uploaded
- **THEN** an error message is displayed
- **AND** no data is imported

#### Scenario: Schema validation
- **WHEN** a JSON file is uploaded
- **THEN** the system validates it matches the expected export schema

### Requirement: Import Conflict Resolution
The system SHALL provide options for handling conflicts during import.

#### Scenario: Overwrite existing
- **WHEN** a conflict is detected and user selects "Overwrite"
- **THEN** the existing prompt is replaced with the imported version

#### Scenario: Duplicate creation
- **WHEN** a conflict is detected and user selects "Duplicate"
- **THEN** a new prompt is created with "(imported)" suffix in title

#### Scenario: Skip conflicting
- **WHEN** a conflict is detected and user selects "Skip"
- **THEN** the conflicting prompt is not imported
- **AND** other prompts continue to be processed

#### Scenario: Conflict detection
- **WHEN** an imported prompt has the same title as an existing prompt
- **THEN** a conflict is flagged for user resolution

### Requirement: Import User Interface
The system SHALL provide an intuitive import interface with progress feedback.

#### Scenario: File upload
- **WHEN** the user opens import dialog
- **THEN** a file upload zone is displayed
- **AND** drag-and-drop is supported

#### Scenario: Import preview
- **WHEN** a file is validated
- **THEN** a list of prompts to be imported is shown
- **AND** conflicts are highlighted

#### Scenario: Import progress
- **WHEN** import is in progress
- **THEN** a progress indicator shows completion status

#### Scenario: Import completion
- **WHEN** import completes
- **THEN** a summary shows imported count, skipped count, and any errors

### Requirement: Tag Import Handling
The system SHALL handle tags appropriately during import.

#### Scenario: New tag creation
- **WHEN** an imported prompt has tags that don't exist in the vault
- **THEN** the new tags are created automatically

#### Scenario: Existing tag matching
- **WHEN** an imported prompt has tags that already exist
- **THEN** the existing tags are reused (matched by name)
