# TaskSync

A tRPC-Powered Collaborative Task Board application that allows users to create and manage tasks collaboratively.

## Project Overview

TaskSync is a full-stack application built with the following technologies:

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Express, tRPC
- **Database**: SQLite (via Prisma ORM)
- **Authentication**: JWT

The project is structured as a monorepo using Turborepo with the following packages:

- `packages/client`: Next.js frontend application
- `packages/server`: Express backend server with tRPC
- `packages/shared`: Shared types and utilities used by both client and server

## Prerequisites

Before running the application, make sure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- Git

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd be-trpc
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Set up environment variables:

Create a `.env` file in the `packages/server` directory with the following content:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

> **Note**: Make sure to change the JWT_SECRET in production for security reasons.

4. Initialize the database and generate Prisma client:

```bash
cd packages/server
npx prisma migrate dev --name init
npx prisma generate
# or
yarn prisma migrate dev --name init
yarn prisma generate
```

> **Note**: The `prisma generate` command is required to generate the Prisma client code before running the application.
> If you encounter errors about Prisma client not being initialized, run this command.

## How to Run

### Development Mode

To run the application in development mode:

```bash
# From the root directory
npm run dev
# or
yarn dev
```

This will start both the client and server in development mode with hot reloading:

- Client will be available at: http://localhost:3000
- Server will be available at: http://localhost:4000

### Production Mode

To build and run the application in production mode:

1. Build the application:

```bash
# From the root directory
npm run build
# or
yarn build
```

2. Start the application:

```bash
# From the root directory
npm start
# or
yarn start
```

This will start the server in production mode. The client will be served by the Next.js server.

## Project Structure

```
be-trpc/
├── packages/
│   ├── client/         # Next.js frontend
│   ├── server/         # Express backend with tRPC
│   │   ├── prisma/     # Prisma schema and migrations
│   │   └── src/        # Server source code
│   └── shared/         # Shared types and utilities
├── package.json        # Root package.json with workspace configuration
└── turbo.json          # Turborepo configuration
```

## Database

The application uses SQLite as the database, which is configured through Prisma. The database file is located at
`packages/server/prisma/dev.db`.

If you need to reset the database or make changes to the schema:

```bash
cd packages/server
npx prisma migrate reset  # Reset the database
npx prisma migrate dev    # Apply migrations after schema changes
npx prisma studio         # Open Prisma Studio to view/edit data
```

## Dependency Management

This project uses pnpm workspaces and package overrides to manage dependencies across packages. The following major
dependencies are used:

- Next.js 15.x (frontend framework)
- ESLint 9.x (code linting)
- tRPC 10.x (type-safe API)
- Prisma 5.x (database ORM)

If you encounter any deprecation warnings or security vulnerabilities when installing dependencies, please update the
relevant packages in the package.json files or add overrides in the root package.json file.

### Troubleshooting

If you encounter any of the following issues:

1. **Prisma Client Not Initialized**: Run `npx prisma generate` in the `packages/server` directory to generate the
   Prisma client code.

2. **Multiple Lockfiles Warning**: If you see a warning about multiple lockfiles, remove any lockfiles other than the
   one being used by your package manager (e.g., if using pnpm, keep only pnpm-lock.yaml).

3. **Package Manager Not Specified**: The project uses pnpm as the package manager. The root package.json includes a "
   packageManager" property specifying pnpm@8.6.0.

### Recent Updates (2025-07-17)

- Updated Next.js from 13.5.4 to 15.4.1 to fix security vulnerabilities
- Updated ESLint from 8.51.0 to 9.0.0
- Added package overrides to address deprecated transitive dependencies:
    - inflight (memory leak issues fixed)
    - rimraf (updated to v5)
    - glob (updated to v10)
    - @humanwhocodes/config-array (replaced with @eslint/config-array)
    - @humanwhocodes/object-schema (replaced with @eslint/object-schema)
    - npmlog and gauge (updated to newer versions)
