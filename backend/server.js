const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin:["https://render-practice-app-1.onrender.com"],
  methods:["GET", "POST","PATCH","DELETE","OPTIONS","PUT"],
  allowedHeaders:["Content-Type","Authorization"]
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render's hosted PostgreSQL connections use TLS. For local development,
  // omit DATABASE_URL or use a local URL and SSL will be disabled.
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing. Set it to your PostgreSQL connection string."
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(500).json({ status: "error", database: "unavailable" });
  }
});

app.get("/api/tasks", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, completed, created_at FROM tasks ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Could not fetch tasks:", error.message);
    res.status(500).json({ error: "Could not fetch tasks." });
  }
});

app.post("/api/tasks", async (req, res) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";

  if (!title) {
    return res.status(400).json({ error: "Please enter a task title." });
  }
  if (title.length > 200) {
    return res.status(400).json({ error: "Task titles must be 200 characters or fewer." });
  }

  try {
    const result = await pool.query(
      "INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, completed, created_at",
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Could not create task:", error.message);
    res.status(500).json({ error: "Could not create task." });
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid task ID." });
  }
  if (typeof req.body.completed !== "boolean") {
    return res.status(400).json({ error: "completed must be true or false." });
  }

  try {
    const result = await pool.query(
      "UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING id, title, completed, created_at",
      [req.body.completed, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Could not update task:", error.message);
    res.status(500).json({ error: "Could not update task." });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid task ID." });
  }

  try {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.status(204).end();
  } catch (error) {
    console.error("Could not delete task:", error.message);
    res.status(500).json({ error: "Could not delete task." });
  }
});

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`App is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

start();
