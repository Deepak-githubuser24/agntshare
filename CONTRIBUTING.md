# Contributing to AgentShare

Thank you for your interest in contributing to AgentShare!

## Local Development Setup

AgentShare uses Next.js, Postgres, and MinIO for local development.

1. Clone the repository.
2. Run `npm install` in the root directory.
3. Copy `.env.example` to `.env.local`.
4. Ensure Docker is running.
5. Start local services: `docker compose up -d`.
6. Apply schema and migrations (found in `lib/db/`).
7. Run the development server: `npm run dev`.

## Core Philosophy

When contributing, please adhere to our core architectural principles:
- **Opaque Pipe:** The server must never inspect, read, or mutate the bytes of uploaded files. We rely entirely on presigned URLs and metadata.
- **Fail-Closed Security:** All endpoints must default to rejecting requests unless explicitly authenticated and authorized.
- **Least-Privilege DB:** All app connections must use the restricted `agentshare_app` role.

## Pull Request Process

1. Create a branch for your feature or bugfix.
2. Ensure your changes pass all local linting (`npm run lint`) and builds (`npm run build`).
3. Submit a Pull Request targeting the `main` branch.
4. CI will run automatically. Wait for checks to pass and a maintainer to review your code.
