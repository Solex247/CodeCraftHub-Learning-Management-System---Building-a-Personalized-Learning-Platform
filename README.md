# CodeCraftHub Learning Management System

CodeCraftHub is a simple REST API for tracking developer learning goals. It is built with Node.js and Express and stores course data in a local `courses.json` file instead of using a database.

## Features

- Create, read, update, and delete courses
- View course statistics by status
- Validate required fields and allowed status values
- Store data in `courses.json`
- Automatically create `courses.json` if it does not exist
- Return clear error messages for common issues

## Project Structure

```text
.
|-- app.js
|-- package.json
|-- public/
|   `-- index.html
|-- README.md
|-- TEST_CASES.md
`-- courses.json   (created automatically when the app starts)
```

## Installation

1. Make sure Node.js is installed.
2. Install dependencies:

```bash
npm install
```

If PowerShell blocks the `npm` command on your machine, use:

```powershell
npm.cmd install
```

## How to Run the Application

Start the backend and dashboard with:

```bash
npm start
```

If needed in PowerShell:

```powershell
npm.cmd start
```

For auto-reload during development, run:

```bash
npm run dev
```

If needed in PowerShell:

```powershell
npm.cmd run dev
```

The app runs on `http://localhost:5000`.

Open the frontend dashboard at:

```text
http://localhost:5000
```

The REST API is available at:

```text
http://localhost:5000/api/courses
```

When the app starts, it prints:

```text
- CodeCraftHub API is starting...
- Data will be stored in: <project-path>/courses.json
- Dashboard is available at: http://localhost:5000
- API is available at: http://localhost:5000
```

## Frontend Dashboard

The project now includes a custom single-page dashboard in `public/index.html`. It uses vanilla HTML, CSS, and JavaScript and includes:

- A responsive modern course management interface
- A course creation form
- Edit and delete actions for each course
- Search and status filtering
- Live stats powered by `GET /api/courses/stats`
- Loading and success or error feedback states

## API Endpoints

### `POST /api/courses`

Add a new course.

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Python Basics",
    "description": "Learn Python fundamentals",
    "target_date": "2025-12-31",
    "status": "Not Started"
  }'
```

### `GET /api/courses`

Get all courses.

```bash
curl http://localhost:5000/api/courses
```

### `GET /api/courses/stats`

Get a summary of total courses and counts by status.

```bash
curl http://localhost:5000/api/courses/stats
```

Example response:

```json
{
  "total_courses": 3,
  "by_status": {
    "Not Started": 1,
    "In Progress": 1,
    "Completed": 1
  }
}
```

### `GET /api/courses/:id`

Get one course by its ID.

```bash
curl http://localhost:5000/api/courses/1
```

### `PUT /api/courses/:id`

Update one or more fields on a course.

```bash
curl -X PUT http://localhost:5000/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress"
  }'
```

### `DELETE /api/courses/:id`

Delete a course.

```bash
curl -X DELETE http://localhost:5000/api/courses/1
```

## Course Object Format

Each course includes the following fields:

```json
{
  "id": 1,
  "name": "Python Basics",
  "description": "Learn Python fundamentals",
  "target_date": "2025-12-31",
  "status": "Not Started",
  "created_at": "2026-03-26T12:00:00.000Z"
}
```

Allowed `status` values:

- `Not Started`
- `In Progress`
- `Completed`

## Troubleshooting

### PowerShell says `npm` cannot be loaded

Use `npm.cmd install` and `npm.cmd start` instead of `npm install` and `npm start`.

### Port 5000 is already in use

Stop the process using port `5000`, then restart the application.

### `courses.json` contains invalid JSON

Replace the file contents with `[]` or delete the file and restart the app so it can be recreated automatically.

### Requests return validation errors

Check that:

- `name` is provided
- `description` is provided
- `target_date` uses `YYYY-MM-DD`
- `status` is one of `Not Started`, `In Progress`, or `Completed`

## Manual Testing

See `TEST_CASES.md` for a quick checklist of manual API test cases.
