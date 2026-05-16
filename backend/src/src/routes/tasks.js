const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

const getFullTask = (id) => db.prepare(`
  SELECT t.*, u.name as assignee_name, c.name as creator_name, p.name as project_name
  FROM tasks t
  LEFT JOIN users u ON t.assignee_id = u.id
  LEFT JOIN users c ON t.creator_id = c.id
  LEFT JOIN projects p ON t.project_id = p.id
  WHERE t.id = ?
`).get(id);

// GET /api/tasks?projectId=&assigneeId=&status=
router.get('/', auth, (req, res) => {
  let query = `
    SELECT t.*, u.name as assignee_name, p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN projects p ON t.project_id = p.id WHERE 1=1
  `;
  const params = [];
  if (req.query.projectId) { query += ' AND t.project_id = ?'; params.push(req.query.projectId); }
  if (req.query.assigneeId) { query += ' AND t.assignee_id = ?'; params.push(req.query.assigneeId); }
  if (req.query.status) { query += ' AND t.status = ?'; params.push(req.query.status); }
  query += ' ORDER BY t.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// POST /api/tasks
router.post('/', auth, (req, res) => {
  const { title, description, status, priority, due_date, project_id, assignee_id } = req.body;
  if (!title || !project_id) return res.status(400).json({ message: 'title and project_id required' });
  const result = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id, creator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description || null, status || 'todo', priority || 'medium', due_date || null, project_id, assignee_id || null, req.user.id);
  res.status(201).json(getFullTask(result.lastInsertRowid));
});

// GET /api/tasks/:id
router.get('/:id', auth, (req, res) => {
  const task = getFullTask(req.params.id);
  if (!task) return res.status(404).json({ message: 'Not found' });
  res.json(task);
});

// PUT /api/tasks/:id
router.put('/:id', auth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ message: 'Not found' });
  const isCreator = task.creator_id === req.user.id;
  const isAssignee = task.assignee_id === req.user.id;
  const isProjectAdmin = db.prepare('SELECT * FROM project_members WHERE project_id=? AND user_id=? AND role=?').get(task.project_id, req.user.id, 'admin');
  if (!isCreator && !isAssignee && !isProjectAdmin && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Not authorized' });
  const { title, description, status, priority, due_date, assignee_id } = req.body;
  db.prepare(`UPDATE tasks SET title=?, description=?, status=?, priority=?, due_date=?, assignee_id=? WHERE id=?`)
    .run(title ?? task.title, description ?? task.description, status ?? task.status, priority ?? task.priority, due_date ?? task.due_date, assignee_id ?? task.assignee_id, task.id);
  res.json(getFullTask(task.id));
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ message: 'Not found' });
  if (task.creator_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
