# TaskFlow

## 1) Overview

TaskFlow is a lightweight project and task management app.  
It supports authentication, creating projects, and managing tasks (including status updates and edits).

### Tech stack
- Frontend: React + TypeScript + Vite + Axios + Framer Motion
- Backend: FastAPI + SQLAlchemy + Alembic
- Database: PostgreSQL 15
- Runtime: Docker + Docker Compose

---

## 2) Architecture Decisions

- Split into `frontend` and `backend` services to keep UI and API concerns independent.
- FastAPI + SQLAlchemy was chosen for quick API development and clean ORM models.
- PostgreSQL is used instead of SQLite to align with production-like relational behavior.
- Alembic migrations are run automatically at backend container startup to avoid manual schema drift.
- Demo data seeding runs on backend startup, and is idempotent (it checks before insert), so reviewers always have a usable account.

### Tradeoffs made
- Request bodies currently use simple `dict` handling in route handlers for speed of delivery rather than strict Pydantic schemas for every endpoint.
- Error handling is intentionally minimal and focused on core flows.
- No pagination/filtering on listing endpoints yet because current scope and dataset are small.

### Intentionally left out
- Role-based multi-user project collaboration (only owner-focused behavior implemented).
- Automated test suite and CI setup.
- Advanced validation, observability, and production hardening (rate limits, audit logs, tracing).

---

## 3) Running Locally

Assumption: reviewer has **Docker + Docker Compose** installed.

```bash
git clone <your-repo-url>
cd TaskFlow
docker compose up --build
```

After containers are up:
- Frontend: [http://localhost:4173](http://localhost:4173)
- Backend: [http://localhost:8000](http://localhost:8000)
- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

To stop:

```bash
docker compose down
```

To reset data completely:

```bash
docker compose down -v
docker compose up --build
```

---

## 4) Running Migrations

Migrations run automatically on backend startup via `backend/entrypoint.sh`:

```bash
python -m alembic upgrade head
```

If you want to run migrations manually:

```bash
docker compose exec backend python -m alembic upgrade head
```

---

## 5) Test Credentials

Seeded demo user (available immediately after startup):

- Email: `test@example.com`
- Password: `password123`

The backend startup seeding also creates:
- 1 demo project (`Sample Project`)
- 3 demo tasks with statuses: `todo`, `in_progress`, `done`

---

## 6) API Reference

Base URL: `http://localhost:8000`

### Auth

- `POST /auth/register` — Register a new user
  - Request:
    ```json
    {
      "name": "John",
      "email": "john@example.com",
      "password": "secret123"
    }
    ```
  - Response:
    ```json
    {
      "access_token": "<jwt>",
      "token_type": "bearer",
      "user": {
        "id": "<uuid>",
        "email": "john@example.com"
      }
    }
    ```

- `POST /auth/login` — Login
  - Request:
    ```json
    {
      "email": "test@example.com",
      "password": "password123"
    }
    ```
  - Response:
    ```json
    {
      "access_token": "<jwt>",
      "token_type": "bearer"
    }
    ```

### Projects

- `GET /projects` — List projects owned by current user
- `POST /projects` — Create project
  - Request:
    ```json
    {
      "name": "Website Revamp",
      "description": "Q2 roadmap work"
    }
    ```
- `GET /projects/{id}` — Get project details and its tasks
- `PATCH /projects/{id}` — Update project name/description (owner only)
  - Request:
    ```json
    {
      "name": "Website Revamp V2",
      "description": "Updated scope"
    }
    ```
- `DELETE /projects/{id}` — Delete project and all tasks (owner only)
  - Response:
    ```json
    {
      "success": true
    }
    ```

### Tasks

- `POST /projects/{project_id}/tasks` — Create task in project
  - Request:
    ```json
    {
      "title": "Design mockups",
      "description": "Homepage + dashboard",
      "status": "todo"
    }
    ```
- `PATCH /tasks/{id}` — Update task fields (e.g. title/description/status)
  - Request:
    ```json
    {
      "title": "Design mockups v2",
      "description": "Include mobile screens",
      "status": "in_progress"
    }
    ```

Use `Authorization: Bearer <access_token>` for protected routes.

---

## 7) What I'd Do With More Time

- Add strict request/response schemas for all endpoints (Pydantic models) with richer validation and clearer API contracts.
- Add automated tests (unit + integration + API smoke tests) and CI checks.
- Improve authorization boundaries for task operations (e.g. enforce project ownership checks consistently across all task routes).
- Add better UX feedback (toasts, loading/error states, retry handling) and optimistic updates.
- Add production readiness items: structured logging, health/readiness checks, and environment-specific configuration.