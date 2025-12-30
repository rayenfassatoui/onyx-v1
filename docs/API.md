# Onyx Prompt Vault API Documentation

## Overview

The Onyx Prompt Vault API provides a comprehensive set of endpoints for managing prompts, tags, versions, and user authentication. All API routes are RESTful and return JSON responses.

## Base URL

```
/api
```

## Authentication

All protected routes require a valid session cookie. The session is created upon login and expires after 7 days.

### Headers

Protected endpoints require the session cookie to be sent automatically by the browser.

---

## Authentication Endpoints

### POST /api/auth/register

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "passcode": "1234"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Errors:**
- `400` - Invalid email or passcode format
- `409` - Email already registered

---

### POST /api/auth/login

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "passcode": "1234"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Errors:**
- `400` - Invalid email or passcode format
- `401` - Invalid credentials

---

### POST /api/auth/logout

End the current session.

**Response (200):**
```json
{
  "success": true
}
```

---

### PATCH /api/auth/change-passcode

Change the user's passcode.

**Request Body:**
```json
{
  "currentPasscode": "1234",
  "newPasscode": "5678"
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- `400` - Invalid passcode format
- `401` - Current passcode incorrect

---

### DELETE /api/auth/delete-account

Permanently delete the user account and all associated data.

**Request Body:**
```json
{
  "passcode": "1234"
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- `401` - Incorrect passcode

---

## Prompt Endpoints

### GET /api/prompts

List all prompts in the user's vault.

**Query Parameters:**
- `sortBy` - Sort field: `createdAt` or `updatedAt` (default: `updatedAt`)

**Response (200):**
```json
{
  "prompts": [
    {
      "id": "uuid",
      "title": "My Prompt",
      "description": "A helpful prompt",
      "content": "Hello {{name}}, welcome to {{company}}!",
      "vaultId": "uuid",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-02T00:00:00Z",
      "tags": [
        { "id": "uuid", "name": "work", "color": "#3B82F6" }
      ],
      "versionCount": 3
    }
  ]
}
```

---

### POST /api/prompts

Create a new prompt.

**Request Body:**
```json
{
  "title": "My New Prompt",
  "description": "Optional description",
  "content": "The prompt content with {{variables}}",
  "tagIds": ["tag-uuid-1", "tag-uuid-2"]
}
```

**Response (201):**
```json
{
  "prompt": {
    "id": "uuid",
    "title": "My New Prompt",
    "description": "Optional description",
    "content": "The prompt content with {{variables}}",
    "vaultId": "uuid",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `400` - Missing required fields (title, content)

---

### GET /api/prompts/:id

Get a specific prompt by ID.

**Response (200):**
```json
{
  "prompt": {
    "id": "uuid",
    "title": "My Prompt",
    "description": "Description",
    "content": "Content",
    "vaultId": "uuid",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z",
    "tags": [],
    "versionCount": 1
  }
}
```

**Errors:**
- `404` - Prompt not found

---

### PATCH /api/prompts/:id

Update an existing prompt. Creates a new version automatically.

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "content": "Updated content",
  "tagIds": ["tag-uuid-1"]
}
```

**Response (200):**
```json
{
  "prompt": {
    "id": "uuid",
    "title": "Updated Title",
    "updatedAt": "2024-01-03T00:00:00Z"
  }
}
```

**Errors:**
- `404` - Prompt not found

---

### DELETE /api/prompts/:id

Delete a prompt and all its versions.

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- `404` - Prompt not found

---

## Version Endpoints

### GET /api/prompts/:id/versions

List all versions of a prompt.

**Response (200):**
```json
{
  "versions": [
    {
      "id": "uuid",
      "promptId": "uuid",
      "content": "Version content",
      "metadata": {
        "title": "Title at this version",
        "description": "Description at this version"
      },
      "versionNumber": 3,
      "createdAt": "2024-01-03T00:00:00Z"
    }
  ]
}
```

---

### GET /api/prompts/:id/versions/:versionId

Get a specific version.

**Response (200):**
```json
{
  "version": {
    "id": "uuid",
    "promptId": "uuid",
    "content": "Version content",
    "metadata": {},
    "versionNumber": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `404` - Version not found

---

### POST /api/prompts/:id/versions/:versionId/restore

Restore a prompt to a previous version. Creates a new version with the restored content.

**Response (200):**
```json
{
  "success": true,
  "prompt": {
    "id": "uuid",
    "title": "Restored Title",
    "content": "Restored content"
  }
}
```

**Errors:**
- `404` - Version not found

---

## Tag Endpoints

### GET /api/tags

List all tags in the user's vault.

**Response (200):**
```json
{
  "tags": [
    {
      "id": "uuid",
      "name": "work",
      "color": "#3B82F6",
      "vaultId": "uuid"
    }
  ]
}
```

---

### POST /api/tags

Create a new tag.

**Request Body:**
```json
{
  "name": "new-tag",
  "color": "#22C55E"
}
```

**Response (201):**
```json
{
  "tag": {
    "id": "uuid",
    "name": "new-tag",
    "color": "#22C55E",
    "vaultId": "uuid"
  }
}
```

---

### PATCH /api/tags/:id

Update a tag.

**Request Body:**
```json
{
  "name": "updated-name",
  "color": "#EF4444"
}
```

**Response (200):**
```json
{
  "tag": {
    "id": "uuid",
    "name": "updated-name",
    "color": "#EF4444"
  }
}
```

---

### DELETE /api/tags/:id

Delete a tag.

**Response (200):**
```json
{
  "success": true
}
```

---

## Export/Import Endpoints

### GET /api/prompts/export

Export all prompts.

**Query Parameters:**
- `format` - Export format: `json` or `markdown` (default: `json`)

**Response (200):**
- For JSON: `application/json`
- For Markdown: `text/markdown`

---

### POST /api/prompts/import

Import prompts from a JSON file.

**Request Body:**
```json
{
  "prompts": [
    {
      "title": "Imported Prompt",
      "description": "Optional",
      "content": "Content here",
      "tags": ["tag-name"]
    }
  ],
  "conflictStrategy": "skip"
}
```

**Conflict Strategies:**
- `skip` - Skip prompts with conflicting titles
- `overwrite` - Replace existing prompts with same title
- `duplicate` - Create new prompts with modified titles

**Response (200):**
```json
{
  "success": true,
  "imported": 5,
  "skipped": 2,
  "updated": 0
}
```

---

## AI Endpoints

### POST /api/prompts/:id/analyze

Analyze a prompt with AI for improvements.

**Response (200):**
```json
{
  "analysis": {
    "clarity": {
      "score": 8,
      "feedback": "Clear and well-structured"
    },
    "structure": {
      "score": 7,
      "feedback": "Consider adding sections"
    },
    "suggestions": [
      "Add a specific role for the AI",
      "Include output format constraints"
    ]
  }
}
```

---

### POST /api/prompts/:id/variants

Generate AI-powered variants of a prompt.

**Response (200):**
```json
{
  "variants": [
    {
      "type": "concise",
      "content": "Shorter version of the prompt"
    },
    {
      "type": "detailed",
      "content": "More detailed version"
    },
    {
      "type": "creative",
      "content": "Creative reinterpretation"
    }
  ]
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

---

## Variable System

Prompts support dynamic variables using the `{{variableName}}` syntax.

### Variable Patterns

```
{{name}}        - Simple variable
{{user_name}}   - Underscore allowed
{{firstName}}   - CamelCase allowed
```

### Variable Resolution

When viewing a prompt, detected variables are extracted and presented as form fields. Users fill in values, and the resolved prompt is generated with variables replaced by their values.

Example:
```
Template: "Hello {{name}}, welcome to {{company}}!"
Variables: { name: "John", company: "Acme Inc" }
Result: "Hello John, welcome to Acme Inc!"
```
