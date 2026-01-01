# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do not** create a public GitHub issue for security vulnerabilities
2. Email your findings to the repository owner
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- We will acknowledge your report within 48 hours
- We will investigate and provide updates on our progress
- We will credit you (if desired) when we publish a fix

### Scope

This policy applies to:
- Backend API (`backend/`)
- Frontend application (`frontend/`)
- Infrastructure configurations

### Out of Scope

- Issues in third-party dependencies (report these to the dependency maintainers)
- Vulnerabilities requiring physical access
- Social engineering attacks

## Security Measures

This application implements:
- JWT token validation
- Role-based access control
- Input sanitization
- CORS protection
- No sensitive data logging

## Best Practices for Users

1. Keep your authentication tokens secure
2. Use strong passwords for your Azure AD account
3. Report suspicious activity immediately
4. Do not share access credentials
