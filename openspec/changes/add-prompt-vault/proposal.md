# Change: Add Onyx Prompt Vault

## Why

Prompt engineers currently rely on fragmented tools—notes, documents, chat histories, and code repositories—to manage prompts. These methods lack centralized organization, reusability with variables, version history, security/privacy, and workflow efficiency. Existing tools focus on chat or experimentation rather than prompt lifecycle management. Onyx Prompt Vault addresses this gap by providing a secure, precision-focused prompt engineering utility inspired by Swiss industrial design.

## What Changes

### Core Capabilities

- **Airlock Authentication**: Secure passcode-based lock screen with visual feedback (smooth unlock animation on success, shake + error on failure)
- **Prompt Management (CRUD)**: Create, read, update, and delete prompt templates with title, description, content, tags, and metadata
- **Variable Injection Engine**: Detect `{{variable}}` patterns, auto-generate form fields, provide live preview, and one-click copy of resolved prompts
- **Version History**: Backend-driven versioning where every update creates an immutable version with comparison and restore capabilities
- **User Accounts & Vaults**: Multi-user support with isolated private vaults enforced at the database level
- **Export/Import**: Support JSON and Markdown export formats with import validation and conflict resolution
- **AI Integration**: AI-powered prompt analysis with suggestions for clarity, structure, role definition, and constraints; generate optimized variants

### UI/UX Features

- Dashboard with spotlight grid of prompt cards
- Sorting by creation date or last updated
- Real-time search by title, content, or tags
- Tag rail with toggle filtering
- Keyboard-first navigation
- Focused modal/panel for prompt reading
- Premium "Onyx" aesthetic with minimal, precision-focused design

### Data Model

- User, Vault, Prompt, PromptVersion, Tag entities
- PostgreSQL (Neon) with Drizzle ORM
- Relational integrity with indexed search fields

## Impact

### Affected Specs (New Capabilities)
- `airlock-auth` - Authentication layer
- `prompt-management` - CRUD operations
- `variable-injection` - Template variable handling
- `version-history` - Immutable versioning
- `user-vault` - User accounts and vault isolation
- `export-import` - Data portability
- `ai-integration` - AI-powered suggestions

### Affected Code
- Database schema (new tables: users, vaults, prompts, prompt_versions, tags, prompt_tags)
- API routes for all CRUD operations
- Authentication middleware
- Frontend components (lock screen, dashboard, prompt editor, variable form, version viewer)
- AI service integration layer

### Non-Functional Requirements
- Dashboard load < 500ms
- Instant variable preview updates
- Encrypted storage where applicable
- No prompt data loss incidents
- Zero destructive actions without confirmation

### Out of Scope (v1)
- Public prompt marketplace
- Real-time collaboration
- Prompt monetization
- Cloud sync across devices
