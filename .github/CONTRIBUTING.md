# Contributing to YNM Purchase Portal

Thank you for considering contributing to the YNM Purchase Portal! This document provides guidelines for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report any unacceptable behavior to the maintainers

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/ynm-purchase-portal.git
   cd ynm-purchase-portal
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your values
   ```
5. **Run the development server**:
   ```bash
   npm run dev
   ```

## 💻 Development Workflow

### Creating a Feature Branch

```bash
# Update your main branch
git checkout main
git pull origin main

# Create a feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. Write clean, readable code
2. Follow the existing code style
3. Add comments for complex logic
4. Test your changes thoroughly

### Testing Your Changes

```bash
# Lint your code
npm run lint

# Build to check for errors
npm run build

# Test in development mode
npm run dev
```

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all new files
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types when needed

```typescript
// Good
interface User {
  id: number;
  username: string;
  role: 'admin' | 'employee';
}

// Avoid
const user: any = { ... };
```

### React Components

- Use functional components with hooks
- Keep components focused and small
- Use meaningful component names
- Extract reusable logic into custom hooks

```tsx
// Good
export function ProductCard({ product }: { product: Product }) {
  return <div>...</div>;
}

// Avoid huge components with multiple responsibilities
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `Header.tsx`)
- Utilities: `camelCase.ts` (e.g., `validation.ts`)
- API routes: `route.ts`
- Pages: `page.tsx`

### Code Organization

```
src/
├── app/          # Next.js pages and API routes
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── lib/          # Utility functions and configs
├── types/        # TypeScript type definitions
└── utils/        # Helper functions
```

## 📨 Commit Messages

Use clear, descriptive commit messages following this format:

```
<type>: <description>

[optional body]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
git commit -m "feat: add order filtering by date range"
git commit -m "fix: resolve authentication token expiration issue"
git commit -m "docs: update README with deployment instructions"
git commit -m "refactor: simplify product validation logic"
```

## 🔄 Pull Request Process

### Before Submitting

1. **Ensure your code builds**:
   ```bash
   npm run build
   ```

2. **Run the linter**:
   ```bash
   npm run lint
   ```

3. **Test your changes** manually

4. **Update documentation** if needed

5. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Creating the Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code builds successfully
- [ ] Linter passes
- [ ] No secrets committed
- [ ] Documentation updated
```

### PR Review Process

- A maintainer will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged

## 🔒 Security

- **NEVER commit** `.env.local` or any file with secrets
- **Review your changes** before committing:
  ```bash
  git diff
  ```
- **Use environment variables** for all sensitive data
- **Report security issues** privately to maintainers

## ❓ Questions?

If you have questions:

1. Check the [README.md](README.md)
2. Search existing issues
3. Create a new issue with the "question" label

## 🙏 Thank You!

Your contributions make this project better. We appreciate your time and effort!

---

**Happy Coding!** 🎉
