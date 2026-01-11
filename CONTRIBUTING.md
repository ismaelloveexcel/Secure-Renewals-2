# Contributing to Secure Renewals HR Portal

Thank you for your interest in contributing to the Secure Renewals HR Portal! This document provides guidelines and instructions for contributors, including best practices for working with GitHub Copilot.

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [GitHub Copilot Best Practices](#github-copilot-best-practices)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+** - Backend runtime
- **Node.js 20+** - Frontend development
- **PostgreSQL 16** - Database
- **uv** - Python package manager (recommended) or pip
- **Git** - Version control

### Quick Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
   cd Secure-Renewals-2
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   uv sync  # or: pip install -r requirements.txt
   uv run alembic upgrade head  # Run database migrations
   ```

3. **Set up the frontend:**
   ```bash
   cd frontend
   npm install
   echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
   ```

4. **Start the development servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

---

## Development Setup

### Backend Setup (FastAPI)

The backend uses FastAPI with async PostgreSQL support. The architecture follows a layered pattern:

```
backend/
├── app/
│   ├── routers/       # API endpoints (HTTP handlers)
│   ├── services/      # Business logic
│   ├── repositories/  # Database access
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── auth/          # Authentication logic
│   └── core/          # Configuration and utilities
└── alembic/           # Database migrations
```

**Key Commands:**

```bash
# Install dependencies
uv sync

# Run backend server
uv run uvicorn app.main:app --reload --port 8000

# Create a new migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Check Python syntax
find app -name '*.py' -exec python -m py_compile {} +
```

### Frontend Setup (React + TypeScript)

The frontend is a React 19 single-page application built with Vite and TypeScript:

```
frontend/
├── src/
│   ├── components/    # Reusable React components
│   ├── services/      # API client and business logic
│   ├── types/         # TypeScript type definitions
│   └── App.tsx        # Main application component
├── public/            # Static assets
└── index.html         # HTML entry point
```

**Key Commands:**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint and type-check
npm run lint

# Preview production build
npm run preview
```

### Database Setup

The application uses PostgreSQL with async operations via asyncpg driver.

**Database Connection:**

Set the `DATABASE_URL` environment variable in `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/secure_renewals
```

**Initial Setup:**

```bash
# Create database
createdb secure_renewals

# Run migrations
cd backend
uv run alembic upgrade head
```

---

## GitHub Copilot Best Practices

This repository is optimized for GitHub Copilot and Copilot Agents. Follow these practices to get the best results:

### 1. Repository Context Files

We maintain these key context files for Copilot:

- **`replit.md`** - System architecture and conventions
- **`README.md`** - Project overview and quick start
- **`CONTRIBUTING.md`** - This file - setup and guidelines
- **`docs/`** - Detailed documentation for specific topics

**Best Practice:** Keep these files up-to-date as the codebase evolves.

### 2. Code Organization

Our codebase follows consistent patterns that help Copilot understand context:

**Backend Patterns:**
- Routers handle HTTP requests and validation
- Services contain business logic
- Repositories handle database operations
- Schemas define request/response models

**Frontend Patterns:**
- Components are functional with TypeScript types
- API calls go through `services/api.ts`
- Types are defined in `types/` directory

**Best Practice:** Follow existing patterns when adding new features.

### 3. Using GitHub Copilot Agents

We have specialized Copilot Agents for different tasks:

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| [HR Assistant](.github/agents/hr-assistant.md) | HR workflow planning | Feature planning, HR module ideas |
| [Portal Engineer](.github/agents/portal-engineer.md) | Technical implementation | Building features, fixing bugs |
| [Code Quality Monitor](.github/agents/code-quality-monitor.md) | Security and quality | Code reviews, security scans |

**How to Use Agents:**

1. Open the appropriate agent file (`.github/agents/*.md`)
2. Ask your question or describe the task
3. Follow the agent's recommendations

**Best Practice:** Use agents before starting major features to get architectural guidance.

### 4. Writing Copilot-Friendly Code

To help Copilot assist you effectively:

**✅ DO:**
- Write clear, descriptive comments for complex logic
- Use meaningful variable and function names
- Keep functions small and focused
- Add type annotations (Python type hints, TypeScript types)
- Document API endpoints with docstrings
- Include examples in docstrings

**❌ DON'T:**
- Use cryptic abbreviations
- Create overly complex nested logic
- Leave TODO comments without context
- Mix multiple concerns in one function

**Example - Good Python code for Copilot:**

```python
async def get_renewals_expiring_soon(
    days: int = 30,
    db: AsyncSession = Depends(get_db)
) -> List[Renewal]:
    """
    Retrieve contract renewals expiring within the specified number of days.
    
    Args:
        days: Number of days to look ahead (default: 30)
        db: Database session
        
    Returns:
        List of Renewal objects expiring soon
        
    Example:
        renewals = await get_renewals_expiring_soon(days=60)
    """
    threshold_date = datetime.now() + timedelta(days=days)
    return await renewal_repository.find_expiring_before(threshold_date, db)
```

### 5. Commit Messages and Documentation

Write commits and docs that Copilot can learn from:

**Commit Message Format:**
```
<type>: <short summary>

<detailed description if needed>

Examples: fix, feat, docs, refactor, test
```

**Good Examples:**
```
feat: Add CSV import for employee bulk upload
fix: Resolve SQL injection vulnerability in search endpoint
docs: Update API documentation with authentication flow
```

### 6. Project-Specific Conventions

**Authentication:**
- Users log in with Employee ID + password
- First-time login uses DOB (DDMMYYYY) as initial password
- JWT tokens for API authentication

**Database Conventions:**
- Use async SQLAlchemy operations
- Always use parameterized queries (never string concatenation)
- Keep repository layer separate from business logic

**API Conventions:**
- RESTful endpoints under `/api` prefix
- Use Pydantic schemas for validation
- Return appropriate HTTP status codes
- Include error messages in responses

**Frontend Conventions:**
- Functional components with TypeScript
- TailwindCSS for styling
- API calls through centralized service layer

**Security Conventions:**
- Never expose API keys in frontend code
- Sanitize all user inputs (HTML escape)
- Use environment variables for secrets
- Implement rate limiting on sensitive endpoints

### 7. Testing with Copilot

When writing tests, help Copilot by:

- Naming test files `test_*.py` or `*.test.ts`
- Using descriptive test names: `test_employee_login_with_valid_credentials`
- Including setup and teardown patterns
- Adding comments explaining test scenarios

**Note:** This repository currently has minimal test infrastructure. When adding tests, follow pytest (Python) or Vitest (JavaScript) conventions.

---

## Code Style Guidelines

### Python (Backend)

- **Style Guide:** Follow PEP 8
- **Formatting:** 4 spaces for indentation
- **Line Length:** Max 100 characters
- **Type Hints:** Use type hints for all function parameters and returns
- **Docstrings:** Use Google-style docstrings

```python
async def create_employee(
    employee_data: EmployeeCreate,
    db: AsyncSession
) -> Employee:
    """
    Create a new employee record.
    
    Args:
        employee_data: Employee data for creation
        db: Database session
        
    Returns:
        Created employee object
        
    Raises:
        ValueError: If employee ID already exists
    """
    # Implementation here
```

### TypeScript (Frontend)

- **Style Guide:** Follow standard TypeScript conventions
- **Formatting:** 2 spaces for indentation
- **Line Length:** Max 100 characters
- **Types:** Define explicit types for all props and state
- **Components:** Use functional components with hooks

```typescript
interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (id: string) => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
  employee, 
  onEdit 
}) => {
  // Component implementation
};
```

### File Naming

- **Python:** `snake_case.py` (e.g., `employee_service.py`)
- **TypeScript:** `PascalCase.tsx` for components (e.g., `EmployeeCard.tsx`)
- **TypeScript:** `camelCase.ts` for utilities (e.g., `apiClient.ts`)

---

## Testing Guidelines

### Backend Testing (Python)

When adding tests, use pytest:

```python
# tests/test_employee_service.py
import pytest
from app.services.employee_service import EmployeeService

@pytest.mark.asyncio
async def test_create_employee_success(db_session):
    """Test successful employee creation."""
    service = EmployeeService()
    employee = await service.create({
        "employee_id": "EMP001",
        "name": "John Doe",
        "department": "IT"
    }, db_session)
    
    assert employee.employee_id == "EMP001"
    assert employee.name == "John Doe"
```

### Frontend Testing (TypeScript)

When adding tests, use Vitest:

```typescript
// src/components/EmployeeCard.test.tsx
import { render, screen } from '@testing-library/react';
import { EmployeeCard } from './EmployeeCard';

describe('EmployeeCard', () => {
  it('renders employee information', () => {
    const employee = {
      id: '1',
      name: 'John Doe',
      department: 'IT'
    };
    
    render(<EmployeeCard employee={employee} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('IT')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Backend tests (when implemented)
cd backend
pytest

# Frontend tests (when implemented)
cd frontend
npm test
```

---

## Commit Message Guidelines

Follow the Conventional Commits specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, no logic changes)
- **refactor:** Code refactoring
- **test:** Adding or updating tests
- **chore:** Maintenance tasks (dependencies, build config)

### Examples

```
feat(auth): Add employee ID login with DOB initial password

Implement new authentication flow where employees log in with
their employee ID and date of birth on first login, then are
prompted to set a new password.

Closes #42
```

```
fix(renewals): Prevent SQL injection in search endpoint

Replace string concatenation with parameterized query to prevent
SQL injection vulnerability in renewal search functionality.
```

---

## Pull Request Process

### Before Submitting

1. **Test your changes:**
   ```bash
   # Backend
   cd backend
   find app -name '*.py' -exec python -m py_compile {} +
   
   # Frontend
   cd frontend
   npm run lint
   ```

2. **Review your changes:**
   ```bash
   git status
   git diff
   ```

3. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: Add new feature description"
   ```

### Submitting a Pull Request

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub:**
   - Navigate to the repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template

3. **PR Description should include:**
   - What changes were made
   - Why the changes were necessary
   - How to test the changes
   - Screenshots (for UI changes)
   - Related issue numbers

### PR Review Process

- PRs require review before merging
- CI checks must pass (linting, security scan)
- Address reviewer feedback
- Keep PRs focused and reasonably sized

---

## Troubleshooting

### Common Issues

#### Backend Issues

**Issue: Database connection error**
```
sqlalchemy.exc.OperationalError: connection refused
```

**Solution:**
1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Verify database exists: `psql -l`

---

**Issue: Import errors after adding dependencies**
```
ModuleNotFoundError: No module named 'xyz'
```

**Solution:**
```bash
cd backend
uv sync  # Reinstall all dependencies
```

---

**Issue: Alembic migration conflicts**
```
alembic.util.exc.CommandError: Multiple head revisions present
```

**Solution:**
```bash
# Check migration history
uv run alembic history

# Merge heads if needed
uv run alembic merge heads -m "Merge migrations"
```

#### Frontend Issues

**Issue: Port already in use**
```
Error: Port 5173 is already in use
```

**Solution:**
```bash
# Kill the process using the port
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 5174
```

---

**Issue: Module not found after npm install**
```
Cannot find module '@/components/Button'
```

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

**Issue: TypeScript errors in IDE**
```
Cannot find module or its corresponding type declarations
```

**Solution:**
1. Restart TypeScript server in your IDE
2. Check `tsconfig.json` paths configuration
3. Ensure all dependencies are installed

#### GitHub Codespaces Issues

**Issue: Out of monthly free usage or exceeded budget**
```
You are out of monthly free usage or have exceeded your budget for Codespaces.
Increase your budget to continue using Codespaces.
```

**Solution (Personal Accounts):**

1. Go to [GitHub Settings → Billing and plans](https://github.com/settings/billing/summary)
2. Click on **Codespaces** in the sidebar
3. Under "Spending limit", click **Manage spending limit**
4. Set a new spending limit (enter a dollar amount or select "Unlimited")
5. Click **Update** to save changes

**Solution (Organization Accounts):**

1. Go to your organization's page on GitHub
2. Click **Settings** → **Billing and plans**
3. Under "Codespaces", click **Manage spending limit**
4. Set the spending limit for the organization
5. Ensure your user has been granted Codespaces access by an organization admin

**Additional Tips:**
- GitHub provides 120 core-hours/month free for personal accounts (as of 2024)
- Usage resets at the start of each billing cycle
- To reduce usage, stop Codespaces when not in use
- Use smaller machine types (2-core instead of 4-core) to extend usage
- Set up idle timeout in [Codespaces settings](https://github.com/settings/codespaces) to auto-stop inactive Codespaces

**Alternative Development Options:**

If you've exhausted your Codespaces budget, you can develop locally:

```bash
# Clone the repository locally
git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
cd Secure-Renewals-2

# Follow the setup instructions in this guide
# See the "Development Setup" section above
```

---

### Getting Help

If you encounter issues not covered here:

1. Check the [documentation](docs/)
2. Review existing [GitHub Issues](https://github.com/ismaelloveexcel/Secure-Renewals-2/issues)
3. Use GitHub Copilot Agents for guidance
4. Open a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Python/Node versions)

---

## Additional Resources

### Documentation

- [README.md](README.md) - Project overview
- [docs/HR_USER_GUIDE.md](docs/HR_USER_GUIDE.md) - End-user guide
- [docs/COPILOT_AGENTS.md](docs/COPILOT_AGENTS.md) - Copilot Agents guide
- [docs/SYSTEM_HEALTH_CHECK.md](docs/SYSTEM_HEALTH_CHECK.md) - System status
- [replit.md](replit.md) - System architecture details

### External Documentation

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

### GitHub Copilot Resources

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Best practices for Copilot coding agent in your repository](https://gh.io/copilot-coding-agent-tips)

---

## License

By contributing to this project, you agree that your contributions will be licensed under the same ISC License that covers the project.

---

**Thank you for contributing to Secure Renewals HR Portal!** 🎉

If you have questions or suggestions for improving these guidelines, please open an issue or submit a PR.
