# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Local Development

```bash
npm run dev              # Run with hot-reload (--watch mode)
npm start                # Run production build locally
```

### Docker Development

```bash
npm run dev:docker       # Start dev environment with Neon Local (ephemeral DB branch)
npm run prod:docker      # Start production environment with Neon Cloud
```

### Database Operations

```bash
npm run db:generate      # Generate Drizzle migrations from schema changes
npm run db:migrate       # Apply migrations to database
npm run db:studio        # Open Drizzle Studio (database GUI)
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without modifying
```

### Docker Container Commands

When containers are running:

```bash
# Development
docker exec acquisitions-app-dev npm run db:migrate
docker exec acquisitions-app-dev npm run db:studio

# Production
docker exec acquisitions-app-prod npm run db:migrate
docker logs -f acquisitions-app-prod
```

## Architecture

### Database Strategy

This project uses **Neon Serverless Postgres** with two distinct database strategies:

**Development Mode:**

- Uses Neon Local proxy (running in Docker on port 5432)
- Creates ephemeral database branches from the main branch
- Configuration in `src/config/database.js` switches to local endpoint when `NODE_ENV=development`
- Each dev session gets a fresh database branch - no shared state between sessions
- Neon Local proxy intercepts connections and routes to ephemeral branches

**Production Mode:**

- Direct connection to Neon Cloud database via `DATABASE_URL`
- Standard serverless PostgreSQL connection over HTTPS

The database client (`drizzle`) and connection setup switches behavior automatically based on environment. This allows testing with production-like data without affecting real data.

### Application Flow

```
Entry: src/index.js (loads dotenv, imports server.js)
  └─> src/server.js (starts Express server)
       └─> src/app.js (configures Express app, middleware, routes)
            ├─> Middleware chain:
            │    1. helmet (security headers)
            │    2. cors
            │    3. express.json/urlencoded
            │    4. cookieParser
            │    5. morgan (request logging via winston)
            │    6. securityMiddleware (Arcjet rate limiting + bot/shield protection)
            │
            └─> Routes:
                 ├─> /api/auth → auth.routes.js (signup, signin, signout)
                 └─> /api/users → user.routes.js (user management)
```

### Security Layer (Arcjet)

The `securityMiddleware` runs on **every request** before reaching route handlers:

- **Shield Protection**: Blocks SQL injection, XSS, and other attacks
- **Bot Detection**: Blocks automated requests (except search engines/link previews in production)
- **Role-based Rate Limiting**: Different limits per user role:
  - Guests: 5 requests/min
  - Users: 10 requests/min
  - Admins: 20 requests/min

Note: Bot detection runs in `DRY_RUN` mode in development (logs only), `LIVE` mode in production (blocks).

### Authentication Pattern

1. User submits credentials to `/api/auth/sign-in` or `/api/auth/sign-up`
2. Controller validates input with Zod schemas (`src/validations/auth.validation.js`)
3. Service layer (`auth.service.js`) handles:
   - Password hashing with bcrypt (10 rounds)
   - User lookup via Drizzle ORM
   - Password comparison
4. JWT token generated with user payload (id, email, role)
5. Token stored in HTTP-only cookie via `cookies.set()`
6. Future requests include token in cookies for authentication

### Path Aliases

This project uses Node.js subpath imports (not TypeScript paths):

```javascript
#src/*          → ./src/*
#config/*       → ./src/config/*
#controllers/*  → ./src/controllers/*
#middleware/*   → ./src/middleware/*
#models/*       → ./src/models/*
#routes/*       → ./src/routes/*
#services/*     → ./src/services/*
#utils/*        → ./src/utils/*
#validations/*  → ./src/validations/*
```

These are defined in `package.json` under the `imports` field and work natively without build tooling.

### Database ORM (Drizzle)

- Schema definitions in `src/models/*.js` (e.g., `user.model.js`)
- Uses Drizzle ORM with Neon serverless HTTP driver
- Migrations stored in `/drizzle` directory
- Configuration in `drizzle.config.js`

**Workflow for schema changes:**

1. Modify schema in `src/models/*.js`
2. Run `npm run db:generate` to create migration files
3. Run `npm run db:migrate` to apply to database
4. Use `npm run db:studio` to verify changes

### Logging

- Winston logger configured in `src/config/logger.js`
- Morgan middleware pipes HTTP logs to Winston
- Logs written to `logs/` directory (mounted in Docker)
- Different log levels for dev (`debug`) vs prod (`info`)

## Code Style

### ESLint Rules

- 2-space indentation (with switch case indentation)
- Single quotes for strings
- Semicolons required
- Unix line endings (LF)
- No `var`, use `const` by default
- Prefer arrow functions
- Unused vars allowed if prefixed with `_`

### Prettier Config

- 80 character line width
- Single quotes
- Trailing commas (ES5 style)
- Arrow function parens avoided when possible

## Environment Variables

### Required for Development (.env.development)

```bash
NEON_API_KEY           # Neon API key from console.neon.tech
NEON_PROJECT_ID        # Neon project ID
PARENT_BRANCH_ID=main  # Branch to create ephemeral branches from
JWT_SECRET             # Secret for signing JWTs
PORT=3000
LOG_LEVEL=debug
```

### Required for Production (.env.production)

```bash
DATABASE_URL           # Full Neon Cloud connection string
JWT_SECRET             # Strong production JWT secret
PORT=3000
LOG_LEVEL=info
CORS_ORIGIN            # Production domain(s)
ARCJET_KEY             # Arcjet security API key
```

## Project Structure Notes

- No tests currently implemented (test script placeholder exists)
- Docker setup is comprehensive with separate dev/prod compose files
- All route handlers follow: Controller → Service → Model pattern
- Validation happens at controller level using Zod schemas
- Error handling uses try-catch with logger and custom error messages
