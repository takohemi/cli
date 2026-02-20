# Takohemi CLI

Opinionated project scaffolding CLI with a plugin architecture. Generate production-ready projects with interactive prompts, then layer on extras like ESLint, Docker, and CI/CD.

## Install

```bash
npm install -g @takohemi/cli
```

Requires Node.js >= 18.

## Quick Start

```bash
takohemi create
```

The interactive wizard walks you through:

1. **Project name**
2. **Stack** — choose your technology (React + Vite, Next.js, etc.)
3. **Stack options** — styling, state management, routing, database, auth
4. **Extras** — optional layers like ESLint + Prettier, Docker, GitHub Actions CI/CD

The CLI scaffolds the project, installs dependencies, and initializes a git repo.

## Available Stacks

### React + Vite

React 19 with Vite, TypeScript, and modern tooling.

| Option | Choices |
|--------|---------|
| Styling | Tailwind CSS, CSS Modules, Styled Components, None |
| State Management | Zustand, Redux Toolkit, Jotai, None |
| Routing | React Router v7, TanStack Router, None |

### Next.js (App Router)

Next.js 15 with App Router, TypeScript, and server components.

| Option | Choices |
|--------|---------|
| Styling | Tailwind CSS, CSS Modules, None |
| Database | MongoDB (Mongoose), PostgreSQL (Prisma), SQLite (Drizzle), None |
| Authentication | NextAuth.js, Clerk, None |
| State Management | Zustand, None |

## Extras

Optional features layered on top of the base template:

| Extra | Description |
|-------|-------------|
| **ESLint + Prettier** | Opinionated linting and formatting config |
| **Docker** | Multi-stage Dockerfile + docker-compose |
| **GitHub Actions CI/CD** | Pipeline with lint, test, build stages |

## Commands

| Command | Description |
|---------|-------------|
| `takohemi create` | Scaffold a new project |
| `takohemi list` | Show available stacks and extras |
| `takohemi --help` | Show help |
| `takohemi --version` | Show version |

## What Gets Generated

```
my-project/
├── src/                  # Application source
├── package.json          # Dependencies & scripts
├── tsconfig.json         # TypeScript config
├── takohemi.json         # Takohemi project metadata
├── .gitignore
└── ...                   # Stack-specific files
```

The `takohemi.json` file records which stack, extras, and options were selected — used by future CLI commands.

## License

MIT
