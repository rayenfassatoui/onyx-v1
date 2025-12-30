# Onyx Prompt Vault - User Guide

Welcome to **Onyx Prompt Vault**, your premium prompt engineering utility for managing, organizing, and enhancing AI prompts.

## Getting Started

### 1. Create Your Account

1. Navigate to the Onyx Vault home page
2. Enter your email address
3. Choose a secure 4-digit passcode (numbers only)
4. Click "Create Account"

Your personal vault is created automatically with your account.

### 2. Access Your Vault

1. Enter your email address
2. Input your 4-digit passcode
3. Watch the smooth unlock animation as you enter your vault

> **Tip:** If you enter the wrong passcode, you'll see a shake animation. Just try again!

---

## Managing Prompts

### Creating a Prompt

1. Click the **+ New Prompt** button (or press `Ctrl+N` / `⌘N`)
2. Fill in the details:
   - **Title**: A descriptive name for your prompt
   - **Description**: Optional context about when to use this prompt
   - **Content**: Your prompt text (supports variables!)
   - **Tags**: Organize with tags for easy filtering
3. Click **Save**

### Editing a Prompt

1. Click on any prompt card to view it
2. Click the **Edit** button (or press `Ctrl+E` / `⌘E` when selected)
3. Make your changes
4. Click **Save**

> **Note:** Every edit creates a new version automatically, so you never lose your work!

### Deleting a Prompt

1. Click the trash icon on a prompt card
2. Confirm deletion in the dialog
3. The prompt and all its versions will be permanently removed

---

## Using Variables

Variables make your prompts reusable! Use the `{{variableName}}` syntax to create dynamic placeholders.

### Example

```
Hello {{name}}, 

I'm writing to discuss {{topic}}. 
Please respond in {{format}} format.

Best regards,
{{sender}}
```

### How It Works

1. When viewing a prompt with variables, form fields appear automatically
2. Fill in each variable's value
3. See the live preview update in real-time
4. Click **Copy** to copy the resolved prompt
5. Paste it into your AI tool of choice!

### Variable Tips

- Use descriptive names: `{{customer_name}}` is better than `{{n}}`
- Variables are case-sensitive: `{{Name}}` ≠ `{{name}}`
- Empty variables are highlighted for easy identification

---

## Organizing with Tags

### Creating Tags

1. When editing a prompt, type a new tag name in the tag field
2. Press Enter or click to create it
3. Choose a color from the color picker

### Filtering by Tags

1. Use the **Tag Rail** below the search bar
2. Click tags to toggle filtering
3. Multiple tags can be selected (shows prompts matching ANY selected tag)
4. Click again to deselect

---

## Version History

Every time you save changes to a prompt, a new version is created automatically.

### Viewing History

1. Open a prompt
2. Click the **History** button
3. Browse through previous versions

### Comparing Versions

1. In the version history, select two versions
2. View them side-by-side to see what changed

### Restoring a Version

1. Find the version you want to restore
2. Click **Restore**
3. Confirm the action
4. Your prompt is updated with the old content (as a new version)

---

## Search & Sort

### Searching

- Use the search bar to find prompts by:
  - Title
  - Content
  - Description
  - Tag names
- Press `/` to focus the search bar quickly

### Sorting

Click the sort button to switch between:
- **Last Updated**: Most recently edited first
- **Created Date**: Newest prompts first

---

## Export & Import

### Exporting Your Vault

1. Click the **Export** button in the header
2. Choose format:
   - **JSON**: Machine-readable, perfect for backup or migration
   - **Markdown**: Human-readable, great for documentation
3. Your file downloads automatically

### Importing Prompts

1. Click the **Import** button
2. Select your JSON file
3. Choose conflict resolution:
   - **Skip**: Keep existing, ignore conflicts
   - **Overwrite**: Replace existing with imported
   - **Duplicate**: Keep both with renamed title
4. Click **Import** and watch the progress

---

## AI Features

### Prompt Analysis

Get AI-powered feedback on your prompts:

1. Open a prompt
2. Click **Analyze**
3. Review suggestions for:
   - Clarity improvements
   - Structure enhancements
   - Role definitions
   - Output constraints

### Generate Variants

Create alternative versions of your prompts:

1. Open a prompt
2. Click **Variants**
3. Choose from:
   - **Concise**: Shorter, focused version
   - **Detailed**: More comprehensive version
   - **Creative**: Alternative approach
4. Click **Apply** to use a variant

---

## Keyboard Shortcuts

Speed up your workflow with these shortcuts:

### Navigation
| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `↑` `↓` | Navigate prompts |
| `Enter` | Open selected prompt |
| `Escape` | Close dialogs / Clear selection |

### Actions
| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + N` | Create new prompt |
| `Ctrl/⌘ + E` | Edit selected prompt |
| `Delete` | Delete selected prompt |

### Dialogs
| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + ,` | Open settings |
| `?` | Show keyboard shortcuts |

---

## Settings

Access settings by clicking the gear icon or pressing `Ctrl+,` / `⌘,`.

### Change Passcode

1. Go to Settings
2. Enter your current passcode
3. Enter your new 4-digit passcode
4. Confirm the new passcode
5. Click **Change Passcode**

### Delete Account

> ⚠️ **Warning**: This action is irreversible!

1. Go to Settings
2. Click **Delete Account**
3. Enter your passcode to confirm
4. All your data will be permanently deleted

---

## Tips & Best Practices

### Writing Effective Prompts

1. **Be specific**: Clearly state what you want
2. **Set context**: Define the AI's role
3. **Specify format**: Describe desired output structure
4. **Use examples**: Show expected input/output when helpful
5. **Add constraints**: Define limitations and boundaries

### Organizing Your Vault

1. **Use descriptive titles**: Make prompts easy to find
2. **Add descriptions**: Note when/why to use each prompt
3. **Create logical tags**: Group by use case, project, or type
4. **Review regularly**: Archive or delete unused prompts

### Variable Best Practices

1. **Use clear names**: `{{company_name}}` vs `{{cn}}`
2. **Add default values**: Note expected values in descriptions
3. **Group related variables**: `{{user_first_name}}`, `{{user_last_name}}`
4. **Test your prompts**: Verify variables work as expected

---

## Troubleshooting

### Can't Log In?

- Verify your email address is correct
- Ensure you're entering the right 4-digit passcode
- Check that you're using numbers only (0-9)

### Prompt Not Saving?

- Ensure title and content are not empty
- Check your internet connection
- Try refreshing the page

### Variables Not Detected?

- Use exact syntax: `{{variableName}}`
- No spaces inside braces: `{{my var}}` ❌ → `{{my_var}}` ✓
- Check for typos in variable names

### Export/Import Issues?

- Ensure JSON format is valid
- Check file size isn't too large
- Try exporting/importing in smaller batches

---

## Need Help?

If you encounter issues not covered here, please:

1. Check the error message for details
2. Try refreshing the page
3. Clear browser cache and cookies
4. Contact support with:
   - Description of the issue
   - Steps to reproduce
   - Browser and OS version
   - Any error messages

---

Thank you for using **Onyx Prompt Vault**! Happy prompting! 🚀
