# CodeCraftHub Test Cases

Use these test cases after starting the API on `http://localhost:5000`.

## 1. Create a Course Successfully

**Request**

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Node.js Fundamentals",
    "description": "Learn the basics of Node.js",
    "target_date": "2026-06-30",
    "status": "Not Started"
  }'
```

**Expected Result**

- Status code: `201`
- Response includes `id` and `created_at`

## 2. Get All Courses

**Request**

```bash
curl http://localhost:5000/api/courses
```

**Expected Result**

- Status code: `200`
- Response is a JSON array

## 3. Get a Course by ID

**Request**

```bash
curl http://localhost:5000/api/courses/1
```

**Expected Result**

- Status code: `200`
- Response includes course with `id` equal to `1`

## 4. Get Course Statistics

**Request**

```bash
curl http://localhost:5000/api/courses/stats
```

**Expected Result**

- Status code: `200`
- Response includes `total_courses`
- Response includes `by_status` counts for `Not Started`, `In Progress`, and `Completed`

## 5. Update a Course

**Request**

```bash
curl -X PUT http://localhost:5000/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress"
  }'
```

**Expected Result**

- Status code: `200`
- `status` changes to `In Progress`

## 6. Delete a Course

**Request**

```bash
curl -X DELETE http://localhost:5000/api/courses/1
```

**Expected Result**

- Status code: `200`
- Response confirms the course was deleted

## 7. Missing Required Fields

**Request**

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Incomplete Course"
  }'
```

**Expected Result**

- Status code: `400`
- Response explains which required fields are missing

## 8. Invalid Status

**Request**

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bad Status Course",
    "description": "This should fail",
    "target_date": "2026-06-30",
    "status": "Paused"
  }'
```

**Expected Result**

- Status code: `400`
- Response explains the allowed status values

## 9. Course Not Found

**Request**

```bash
curl http://localhost:5000/api/courses/999
```

**Expected Result**

- Status code: `404`
- Response says the course was not found
