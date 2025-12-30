# Implementation Tasks

## 1. Database & Infrastructure

- [x] 1.1 Set up PostgreSQL (Neon) connection and Drizzle ORM configuration
- [x] 1.2 Create User schema with id, email, passcode_hash, created_at, updated_at
- [x] 1.3 Create Vault schema with id, user_id (FK), name, created_at
- [x] 1.4 Create Tag schema with id, vault_id (FK), name, color
- [x] 1.5 Create Prompt schema with id, vault_id (FK), title, description, content, created_at, updated_at
- [x] 1.6 Create PromptVersion schema with id, prompt_id (FK), content, metadata, version_number, created_at
- [x] 1.7 Create PromptTag junction table for many-to-many relationship
- [x] 1.8 Add database indexes for search fields (title, content, tags)
- [x] 1.9 Set up database migrations

## 2. Authentication (Airlock)

- [x] 2.1 Create lock screen UI component with 4-digit passcode input
- [x] 2.2 Implement passcode validation API endpoint
- [x] 2.3 Add success animation (smooth unlock transition)
- [x] 2.4 Add failure feedback (shake animation + error state)
- [x] 2.5 Create authentication middleware for protected routes
- [x] 2.6 Implement session management with secure tokens
- [x] 2.7 Add user registration flow
- [x] 2.8 Write authentication tests

## 3. User Accounts & Vaults

- [x] 3.1 Create user registration API endpoint
- [x] 3.2 Create user login API endpoint
- [x] 3.3 Implement vault creation on user registration
- [x] 3.4 Add vault isolation middleware (ensure users only access their vault)
- [x] 3.5 Create vault settings UI component
- [x] 3.6 Write vault isolation tests

## 4. Prompt Management (CRUD)

- [x] 4.1 Create prompt creation API endpoint (POST /api/prompts)
- [x] 4.2 Create prompt read API endpoint (GET /api/prompts/:id)
- [x] 4.3 Create prompt list API endpoint (GET /api/prompts)
- [x] 4.4 Create prompt update API endpoint (PATCH /api/prompts/:id)
- [x] 4.5 Create prompt delete API endpoint (DELETE /api/prompts/:id)
- [x] 4.6 Implement prompt card component for dashboard grid
- [x] 4.7 Create prompt editor modal/panel component
- [x] 4.8 Implement delete confirmation dialog
- [x] 4.9 Add prompt metadata display (createdAt, updatedAt, version)
- [x] 4.10 Write prompt CRUD tests

## 5. Dashboard & Navigation

- [x] 5.1 Create dashboard layout with spotlight grid
- [x] 5.2 Implement sorting (creation date, last updated)
- [x] 5.3 Create real-time search component (search by title, content, tags)
- [x] 5.4 Implement tag rail component with toggle filtering
- [x] 5.5 Add keyboard navigation support (arrow keys, Enter, Escape)
- [x] 5.6 Create empty state component for new users
- [x] 5.7 Write dashboard tests

## 6. Tag Management

- [x] 6.1 Create tag CRUD API endpoints
- [x] 6.2 Implement tag assignment to prompts
- [x] 6.3 Create tag input component with autocomplete
- [x] 6.4 Add tag color picker
- [x] 6.5 Write tag management tests

## 7. Variable Injection Engine

- [x] 7.1 Create variable detection regex for `{{variable}}` pattern
- [x] 7.2 Implement variable extraction utility function
- [x] 7.3 Create dynamic form field generator based on detected variables
- [x] 7.4 Implement live preview with variable substitution
- [x] 7.5 Add validation for missing/empty variables
- [x] 7.6 Create one-click copy button for resolved prompt
- [x] 7.7 Add copy success feedback (toast notification)
- [x] 7.8 Write variable injection tests

## 8. Version History

- [x] 8.1 Implement automatic version creation on prompt update
- [x] 8.2 Create version list API endpoint (GET /api/prompts/:id/versions)
- [x] 8.3 Create version detail API endpoint (GET /api/prompts/:id/versions/:versionId)
- [x] 8.4 Implement version comparison view component
- [x] 8.5 Create version restore API endpoint (POST /api/prompts/:id/versions/:versionId/restore)
- [x] 8.6 Implement version restore UI with confirmation
- [x] 8.7 Ensure version records are immutable (no updates/deletes)
- [x] 8.8 Write version history tests

## 9. Export/Import

- [x] 9.1 Create JSON export API endpoint (GET /api/prompts/export?format=json)
- [x] 9.2 Create Markdown export API endpoint (GET /api/prompts/export?format=markdown)
- [x] 9.3 Implement export UI with format selection
- [x] 9.4 Create import API endpoint with validation (POST /api/prompts/import)
- [x] 9.5 Implement import conflict resolution (overwrite/duplicate/skip)
- [x] 9.6 Create import UI with file upload and conflict resolution
- [x] 9.7 Add import progress indicator
- [x] 9.8 Write export/import tests

## 10. AI Integration

- [x] 10.1 Set up AI service client (openrouter)
- [x] 10.2 Create prompt analysis API endpoint (POST /api/prompts/:id/analyze)
- [x] 10.3 Implement AI suggestions for clarity, structure, role, constraints
- [x] 10.4 Create AI suggestion display component
- [x] 10.5 Create variant generation API endpoint (POST /api/prompts/:id/variants)
- [x] 10.6 Implement variant selection UI
- [x] 10.7 Add manual approval flow before saving AI suggestions
- [x] 10.8 Write AI integration tests

## 11. UI/UX Polish

- [x] 11.1 Implement "Onyx" design system (dark theme, minimal aesthetic)
- [x] 11.2 Add loading states and skeleton components
- [x] 11.3 Implement toast notifications for all actions
- [x] 11.4 Add keyboard shortcuts documentation
- [x] 11.5 Ensure dashboard loads in < 500ms
- [x] 11.6 Add responsive design for mobile/tablet
- [x] 11.7 Implement accessibility (ARIA labels, focus management)

## 12. Testing & Documentation

- [x] 12.1 Write E2E tests for critical user flows
- [x] 12.2 Create API documentation
- [x] 12.3 Write user onboarding guide
- [x] 12.4 Add inline help tooltips
