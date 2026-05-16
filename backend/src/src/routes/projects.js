const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/projects
router.get('/', auth, (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, u.name as owner_name FROM projects p
    JOIN users u ON p.owner_id = u.id
    WHERE p.owner_id = ? OR EXISTS (
      SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ?
    )
    ORDER BY p.created_at DESC
  `).all(req.user.id, req.user.id);

  const result = projects.map(p => {
    const members = db.prepare(`
      SELECT u.id, u.name, u.email, pm.role as project_role
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(p.id);
    const taskCounts = db.prepare(`
      SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status
    `).all(p.id);
    return { ...p, members, taskCounts };
  });
  res.json(result);
});

// POST /api/projects
router.post('/', auth, (req, res) => {
  const { name, description, deadline } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name required' });
  const result = db.prepare('INSERT INTO projects (name, description, deadline, owner_id) VALUES (?, ?, ?, ?)').run(name, description || null, deadline || null, req.user.id);
  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(result.lastInsertRowid, req.user.id, 'admin');
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(project);
});

// GET /api/projects/:id
router.get('/:id', auth, (req, res) => {
  const project = db.prepare('SELECT p.*, u.name as owner_name FROM projects p JOIN users u ON p.owner_id = u.id WHERE p.id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ message: 'Not found' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, pm.role as project_role
    FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?
  `).all(project.id);

  const tasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users c ON t.creator_id = c.id
    WHERE t.project_id = ? ORDER BY t.created_at DESC
  `).all(project.id);

  res.json({ ...project, members, tasks });
});

// PUT /api/projects/:id
router.put('/:id', auth, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ message: 'Not found' });
  if (project.owner_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { name, description, status, deadline } = req.body;
  db.prepare('UPDATE projects SET name=?, description=?, status=?, deadline=? WHERE id=?')
    .run(name || project.name, description ?? project.description, status || project.status, deadline ?? project.deadline, project.id);
  res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(project.id));
});

// DELETE /api/projects/:id
router.delete('/:id', auth, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ message: 'Not found' });
  if (project.owner_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  db.prepare('DELETE FROM projects WHERE id = ?').run(project.id);
  res.json({ message: 'Deleted' });
});

// POST /api/projects/:id/members
router.post('/:id/members', auth, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ message: 'Not found' });
  const isAdmin = project.owner_id === req.user.id ||
    db.prepare('SELECT * FROM project_members WHERE project_id=? AND user_id=? AND role=?').get(project.id, req.user.id, 'admin');
  if (!isAdmin) return res.status(403).json({ message: 'Only admins can add members' });
  const { userId, role } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId required' });
  try {
    db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(project.id, userId, role || 'member');
    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', auth, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ message: 'Not found' });
  if (project.owner_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  db.prepare('DELETE FROM project_members WHERE project_id=? AND user_id=?').run(project.id, req.params.userId);
  res.json({ message: 'Removed' });
});

module.exports = router;
