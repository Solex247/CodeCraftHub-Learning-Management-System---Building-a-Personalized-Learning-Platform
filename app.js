const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const DATA_FILE = process.env.COURSES_FILE
  ? path.resolve(process.env.COURSES_FILE)
  : path.join(__dirname, "courses.json");
const VALID_STATUSES = ["Not Started", "In Progress", "Completed"];

app.use(express.json());

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw createHttpError(500, "Unable to access the course data file.");
    }

    try {
      await fs.writeFile(DATA_FILE, "[]", "utf8");
    } catch {
      throw createHttpError(500, "Unable to create courses.json automatically.");
    }
  }
}

async function readCourses() {
  await ensureDataFile();

  try {
    const fileContents = await fs.readFile(DATA_FILE, "utf8");

    if (!fileContents.trim()) {
      return [];
    }

    const courses = JSON.parse(fileContents);

    if (!Array.isArray(courses)) {
      throw new Error("Invalid file format");
    }

    return courses;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    if (error instanceof SyntaxError || error.message === "Invalid file format") {
      throw createHttpError(
        500,
        "courses.json contains invalid JSON. Please fix or replace the file."
      );
    }

    throw createHttpError(500, "Unable to read course data from courses.json.");
  }
}

async function writeCourses(courses) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(courses, null, 2), "utf8");
  } catch {
    throw createHttpError(500, "Unable to save course data to courses.json.");
  }
}

function isValidDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value
  );
}

function validateCoursePayload(payload, options = {}) {
  const { partial = false } = options;
  const errors = [];
  const updates = {};
  const requiredFields = ["name", "description", "target_date", "status"];

  if (!partial) {
    requiredFields.forEach((field) => {
      if (
        payload[field] === undefined ||
        payload[field] === null ||
        (typeof payload[field] === "string" && !payload[field].trim())
      ) {
        errors.push(`${field} is required.`);
      }
    });
  }

  if (payload.name !== undefined) {
    if (typeof payload.name !== "string" || !payload.name.trim()) {
      errors.push("name must be a non-empty string.");
    } else {
      updates.name = payload.name.trim();
    }
  }

  if (payload.description !== undefined) {
    if (typeof payload.description !== "string" || !payload.description.trim()) {
      errors.push("description must be a non-empty string.");
    } else {
      updates.description = payload.description.trim();
    }
  }

  if (payload.target_date !== undefined) {
    if (!isValidDateString(payload.target_date)) {
      errors.push("target_date must use the YYYY-MM-DD format.");
    } else {
      updates.target_date = payload.target_date;
    }
  }

  if (payload.status !== undefined) {
    if (!VALID_STATUSES.includes(payload.status)) {
      errors.push(
        `status must be one of: ${VALID_STATUSES.join(", ")}.`
      );
    } else {
      updates.status = payload.status;
    }
  }

  if (partial && Object.keys(updates).length === 0) {
    errors.push(
      "Provide at least one valid field to update: name, description, target_date, or status."
    );
  }

  return {
    errors,
    updates,
  };
}

function parseCourseId(idValue) {
  const id = Number.parseInt(idValue, 10);

  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError(400, "Course id must be a positive integer.");
  }

  return id;
}

function getNextCourseId(courses) {
  return courses.reduce((maxId, course) => Math.max(maxId, course.id), 0) + 1;
}

function buildCourseStats(courses) {
  const byStatus = Object.fromEntries(
    VALID_STATUSES.map((status) => [status, 0])
  );

  courses.forEach((course) => {
    if (Object.hasOwn(byStatus, course.status)) {
      byStatus[course.status] += 1;
    }
  });

  return {
    total_courses: courses.length,
    by_status: byStatus,
  };
}

function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

app.get("/", (request, response) => {
  response.json({
    message: "Welcome to the CodeCraftHub API.",
    endpoints: [
      "POST /api/courses",
      "GET /api/courses",
      "GET /api/courses/stats",
      "GET /api/courses/:id",
      "PUT /api/courses/:id",
      "DELETE /api/courses/:id",
    ],
  });
});

app.post(
  "/api/courses",
  asyncHandler(async (request, response) => {
    const { errors, updates } = validateCoursePayload(request.body);

    if (errors.length > 0) {
      throw createHttpError(400, errors.join(" "));
    }

    const courses = await readCourses();
    const newCourse = {
      id: getNextCourseId(courses),
      ...updates,
      created_at: new Date().toISOString(),
    };

    courses.push(newCourse);
    await writeCourses(courses);

    response.status(201).json(newCourse);
  })
);

app.get(
  "/api/courses",
  asyncHandler(async (request, response) => {
    const courses = await readCourses();
    response.json(courses);
  })
);

app.get(
  "/api/courses/stats",
  asyncHandler(async (request, response) => {
    const courses = await readCourses();
    response.json(buildCourseStats(courses));
  })
);

app.get(
  "/api/courses/:id",
  asyncHandler(async (request, response) => {
    const courseId = parseCourseId(request.params.id);
    const courses = await readCourses();
    const course = courses.find((item) => item.id === courseId);

    if (!course) {
      throw createHttpError(404, "Course not found.");
    }

    response.json(course);
  })
);

app.put(
  "/api/courses/:id",
  asyncHandler(async (request, response) => {
    const courseId = parseCourseId(request.params.id);
    const { errors, updates } = validateCoursePayload(request.body, {
      partial: true,
    });

    if (errors.length > 0) {
      throw createHttpError(400, errors.join(" "));
    }

    const courses = await readCourses();
    const courseIndex = courses.findIndex((item) => item.id === courseId);

    if (courseIndex === -1) {
      throw createHttpError(404, "Course not found.");
    }

    const updatedCourse = {
      ...courses[courseIndex],
      ...updates,
    };

    courses[courseIndex] = updatedCourse;
    await writeCourses(courses);

    response.json(updatedCourse);
  })
);

app.delete(
  "/api/courses/:id",
  asyncHandler(async (request, response) => {
    const courseId = parseCourseId(request.params.id);
    const courses = await readCourses();
    const courseIndex = courses.findIndex((item) => item.id === courseId);

    if (courseIndex === -1) {
      throw createHttpError(404, "Course not found.");
    }

    const [deletedCourse] = courses.splice(courseIndex, 1);
    await writeCourses(courses);

    response.json({
      message: "Course deleted successfully.",
      course: deletedCourse,
    });
  })
);

app.use((request, response) => {
  response.status(404).json({
    error: "Endpoint not found.",
  });
});

app.use((error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({
      error: "Invalid JSON body.",
    });
    return;
  }

  response.status(error.statusCode || 500).json({
    error: error.message || "Internal server error.",
  });
});

async function startServer() {
  await ensureDataFile();

  app.listen(PORT, () => {
    console.log("- CodeCraftHub API is starting...");
    console.log(`- Data will be stored in: ${DATA_FILE}`);
    console.log(`- API is available at: http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  });
}

module.exports = {
  app,
  ensureDataFile,
  DATA_FILE,
  VALID_STATUSES,
};
