# Onyx Vault

A premium prompt engineering utility for managing, organizing, and optimizing AI prompts with variable injection support.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🔐 Secure Vault System
- **Passcode-protected access** - Your prompts are secured with encrypted passcodes
- **Per-user isolation** - Complete data separation between users
- **JWT-based sessions** - Secure 7-day session tokens

### 📝 Prompt Management
- **Create & organize prompts** - Full CRUD operations with rich editor
- **Variable injection** - Use `{{variable}}` syntax for dynamic prompts
- **Tag-based organization** - Color-coded tags for easy categorization
- **Full-text search** - Quickly find prompts by title, content, or tags

### 📚 Version History
- **Automatic versioning** - Every edit creates a new version
- **Side-by-side comparison** - Visual diff between versions
- **One-click restore** - Revert to any previous version

### 🤖 AI-Powered Features
- **Prompt analysis** - Get AI feedback on clarity, structure, and effectiveness
- **Variant generation** - Generate alternative versions with different approaches
- **Bring your own key** - Use your OpenRouter API key with any model

### 📦 Import & Export
- **JSON export** - Full backup of all prompts with metadata
- **Markdown export** - Human-readable format for documentation
- **JSON import** - Restore prompts from backup

### 🎨 User Experience
- **Dark/Light mode** - Toggle between themes
- **Keyboard shortcuts** - Power-user navigation
- **Responsive design** - Works on desktop and mobile
- **Real-time feedback** - Toast notifications for all actions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL database (Neon recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/onyx-vault.git
   cd onyx-vault
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secure-secret-key
   ```

4. **Push database schema**
   ```bash
   bun run db:push
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui + Radix UI |
| Animations | Motion (Framer Motion) |
| Authentication | bcryptjs + jose (JWT) |
| AI Integration | OpenRouter API |

## 📁 Project Structure

```
onyx/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── prompts/       # Prompt CRUD + AI features
│   │   ├── tags/          # Tag management
│   │   └── settings/      # User settings
│   ├── dashboard/         # Main dashboard page
│   └── page.tsx           # Login/Register page
├── components/
│   ├── ui/                # shadcn/ui components
│   └── vault/             # Vault-specific components
├── db/
│   ├── index.ts           # Database connection
│   └── schema.ts          # Drizzle schema
├── lib/
│   ├── auth/              # Authentication utilities
│   └── variables.ts       # Variable extraction logic
└── __tests__/             # Test files
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `⌘N` | Create new prompt |
| `⌘,` | Open settings |
| `?` | Show shortcuts |
| `↑↓` | Navigate prompts |
| `Enter` | Open selected prompt |
| `⌘E` | Edit selected prompt |
| `Esc` | Clear selection |

## 🔧 Available Scripts

```bash
bun run dev        # Start development server
bun run build      # Build for production
bun run start      # Start production server
bun run test       # Run tests
bun run lint       # Lint code
bun run format     # Format code
bun run db:push    # Push schema to database
bun run db:studio  # Open Drizzle Studio
```

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Drizzle ORM](https://orm.drizzle.team/) for the excellent TypeScript ORM
- [Neon](https://neon.tech/) for serverless PostgreSQL
- [OpenRouter](https://openrouter.ai/) for AI model access

---

Built with ❤️ by Rayen
