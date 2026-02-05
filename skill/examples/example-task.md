# Task: Add User Authentication System

## Task ID
`550e8400-e29b-41d4-a716-446655440000`

## Agent
- **Target:** worker-dev
- **Profile:** `agents/worker-dev.md`
- **Model:** anthropic/claude-sonnet-4-5

## Project
- **Project:** Mission Control Dashboard
- **Project ID:** `123e4567-e89b-12d3-a456-426614174000`
- **Sprint:** Authentication Sprint

## Objective
Implement a complete JWT-based user authentication system with registration, login, logout, and protected route middleware.

## Context
The Mission Control Dashboard currently has no user authentication. We need to add a secure authentication system before we can implement user-specific features like personalized dashboards and access controls. The system should use industry-standard JWT tokens and include proper password hashing.

## Requirements
1. Create authentication middleware for route protection
2. Implement JWT token generation and validation
3. Add user registration endpoint with password hashing
4. Add user login endpoint with credential validation
5. Add logout functionality (token invalidation)
6. Create protected route wrapper
7. Add input validation and error handling
8. Write comprehensive unit tests

## Acceptance Criteria
- [ ] User can register with email/password (POST /api/auth/register)
- [ ] User can log in and receive JWT token (POST /api/auth/login)
- [ ] Protected routes validate JWT tokens via middleware
- [ ] User can log out and token is invalidated (POST /api/auth/logout)
- [ ] Passwords are properly hashed with bcrypt
- [ ] Input validation prevents invalid data
- [ ] All endpoints return appropriate error messages
- [ ] Unit tests cover all auth functions with 90%+ coverage
- [ ] API documentation updated with new endpoints

## Inputs
Following worker-dev agent requirements:
- TASK.md file (this file) in project root
- Project path: `/Users/dev/projects/mission-control-dashboard`
- Branch: `feature/add-authentication`

## Files/Paths
- `src/middleware/auth.ts` — JWT authentication middleware
- `src/routes/auth.ts` — Authentication API endpoints
- `src/models/User.ts` — User model with password hashing
- `src/utils/jwt.ts` — JWT utility functions
- `src/types/auth.ts` — Authentication type definitions
- `tests/auth.test.ts` — Comprehensive test suite
- `docs/api/auth.md` — API documentation for auth endpoints

## Out of Scope
- OAuth/social login integration (future sprint)
- Password reset functionality (future sprint)
- Email verification (future sprint)
- Role-based access control (future sprint)
- Rate limiting (will be handled at infrastructure level)

## Output Expected
Per worker-dev's output format:
- Detailed dev report with changes made
- Commit history with atomic, descriptive commits
- Test results showing coverage
- Acceptance criteria checklist status
- Any blockers or recommendations

## Notes
- Use bcrypt for password hashing with salt rounds of 12
- JWT secret should be read from environment variable
- Token expiration should be configurable (default 24h)
- Include proper TypeScript types for all auth-related data
- Follow existing code style and project structure
- Ensure backward compatibility with existing API endpoints

Example API endpoints:
```
POST /api/auth/register
  Body: { email: string, password: string, name: string }
  Returns: { user: UserInfo, token: string }

POST /api/auth/login  
  Body: { email: string, password: string }
  Returns: { user: UserInfo, token: string }

POST /api/auth/logout
  Headers: Authorization: Bearer {token}
  Returns: { message: "Logged out successfully" }

GET /api/auth/me (protected)
  Headers: Authorization: Bearer {token}
  Returns: { user: UserInfo }
```