# Contributing to Secure Renewals

Thank you for your interest in contributing to Secure Renewals! This document provides guidelines for contributing.

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL database
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
   cd Secure-Renewals-2
   ```

2. **Set up the backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your local settings
   uv sync
   uv run alembic upgrade head
   uv run uvicorn app.main:app --reload
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
   npm run dev
   ```

## How to Contribute

### Reporting Issues

- Check existing issues before creating a new one
- Use the issue templates provided
- Include as much detail as possible

### Submitting Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add comments where necessary
   - Update documentation if needed

3. **Test your changes**
   - Ensure the backend runs without errors
   - Ensure the frontend builds successfully
   - Test the feature you added/modified

4. **Submit a pull request**
   - Provide a clear description of changes
   - Reference any related issues
   - Request review from maintainers

## Code Style

### Python (Backend)

- Follow PEP 8 guidelines
- Use type hints
- Use async/await for database operations
- Keep functions focused and small

### TypeScript (Frontend)

- Use TypeScript strict mode
- Follow the existing component structure
- Use TailwindCSS for styling
- Keep components reusable

## Documentation

- Update README.md for significant changes
- Update the relevant doc files in `docs/`
- Add inline comments for complex logic

## Questions?

Feel free to open an issue for any questions about contributing.

## Code of Conduct

Be respectful and constructive in all interactions. We're all here to build something great together.
