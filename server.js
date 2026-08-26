const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware: Parse incoming JSON request bodies
app.use(express.json());

// 2. Middleware: Handle malformed JSON input cleanly without crashing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload received' });
  }
  next();
});

// 3. In-memory data store with initial seed tasks
let tasks = [
  { id: 1, title: 'Understand HTTP and REST basics', completed: true },
  { id: 2, title: 'Build Express routes and endpoints', completed: false }
];
let nextId = 3;

// --- ROUTE HANDLERS ---

// GET /health - Server status check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// GET /api/tasks - Retrieve all tasks
app.get('/api/tasks', (req, res) => {
  res.status(200).json(tasks);
});

// GET /api/tasks/:id - Retrieve a single task by ID
app.get('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ error: `Task with ID ${req.params.id} not found` });
  }

  res.status(200).json(task);
});

// POST /api/tasks - Create a new task (validates required title)
app.post('/api/tasks', (req, res) => {
  const { title, completed = false } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      error: 'Title is required and must be a non-empty string'
    });
  }

  const newTask = {
    id: nextId++,
    title: title.trim(),
    completed: Boolean(completed)
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PATCH /api/tasks/:id - Partially update an existing task
app.patch('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ error: `Task with ID ${req.params.id} not found` });
  }

  const { title, completed } = req.body;

  if (title === undefined && completed === undefined) {
    return res.status(400).json({
      error: 'Provide at least one field to update: title or completed'
    });
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }
    task.title = title.trim();
  }

  if (completed !== undefined) {
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'Completed field must be a boolean (true or false)' });
    }
    task.completed = completed;
  }

  res.status(200).json(task);
});

// DELETE /api/tasks/:id - Delete a task by ID
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task with ID ${req.params.id} not found` });
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  res.status(200).json({
    message: 'Task deleted successfully',
    task: deletedTask
  });
});

// 4. Fallback for unhandled routes (404)
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// 5. Global internal server error handler (500)
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error occurred' });
});

// --- SERVER INITIALIZATION ---
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});