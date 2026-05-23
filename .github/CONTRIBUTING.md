# Contributing to Andamio T3 App Template

> **Audience**: This guide is for people contributing back to the upstream `andamio-app-template` repo. If you've forked the template to build your own app, ignore this file — it describes Andamio's repo conventions, not yours.

Thank you for your interest in contributing! This document provides guidelines for contributing to the template.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Cardano wallet browser extension (Eternl, Nami, Flint, etc.)
- Access to Andamio Database API (local or remote)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Andamio-Platform/andamio-app-template.git
   cd andamio-app-template
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000)

### API Configuration

The template connects to the unified Andamio Gateway by default. Check your `.env` file for the correct URL:

```bash
# Default: connects to preprod gateway
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL="https://preprod.api.andamio.io"
```

No local backend setup is required - the gateway is deployed and accessible.

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Code Style

This project uses:
- **ESLint** for linting
- **Prettier** for formatting
- **TypeScript** for type safety

Run checks before committing:

```bash
npm run check       # Lint + type check
npm run format:write  # Auto-format code
```

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(auth): add wallet disconnect confirmation`
- `fix(editor): resolve save button state bug`
- `docs(readme): update installation instructions`

## Coding Guidelines

### TypeScript

- **Always import types from `@andamio/db-api`** - Never define API types locally
- Use explicit return types for functions
- Avoid `any` type - use `unknown` if type is truly unknown

### React Components

- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks

### Styling

- **Use semantic colors only** - Never hardcoded Tailwind colors
- Use shadcn/ui components from `~/components/ui/`
- Use Andamio wrappers from `~/components/andamio/` for enhanced features

```typescript
// Good
<span className="text-success">Success</span>
<AndamioButton isLoading>Save</AndamioButton>

// Bad
<span className="text-green-600">Success</span>
```

### Variable Naming

- **Never use `module` as a variable name** - Use `courseModule` instead
- Be specific and descriptive
- Avoid reserved/ambiguous names (`window`, `document`, `global`)

## Testing

Currently, the project relies on:
- TypeScript type checking (`npm run typecheck`)
- ESLint for code quality (`npm run lint`)
- Manual testing with Cardano wallet on preprod network

## Documentation

When making changes:

1. **Update relevant documentation** in `docs/`
2. **Update README.md** if adding new features or changing setup
3. **Add JSDoc comments** for exported functions

## Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the guidelines above
3. **Run all checks** (`npm run check`)
4. **Update documentation** as needed
5. **Submit a PR** with a clear description

### PR Description Template

```markdown
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2

## Testing
How you tested the changes

## Screenshots (if applicable)
```

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue using the bug template
- **Features**: Open a GitHub Issue using the feature template

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
