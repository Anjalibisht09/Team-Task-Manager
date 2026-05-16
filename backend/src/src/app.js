require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));

const auth = require('./middleware/auth');
app.get('/api/dashboard', auth, (req, res) => {
  const uid = req.user.id;
  const myTasks = db.prepare(`
    SELECT t.*, p.name as project_name FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.assignee_id = ? ORDER BY t.created_at DESC
  `).all(uid);

  const now = new Date().toISOString().split('T')[0];
  const overdue = myTasks.filter(t => t.due_date && t.due_date < now && t.status !== 'done');

  const stats = {
    total: myTasks.length,
    todo: myTasks.filter(t => t.status === 'todo').length,
    inProgress: myTasks.filter(t => t.status === 'in-progress').length,
    review: myTasks.filter(t => t.status === 'review').length,
    done: myTasks.filter(t => t.status === 'done').length,
    overdue: overdue.length,
  };

  const projectCount = db.prepare(`
    SELECT COUNT(*) as c FROM (
      SELECT id FROM projects WHERE owner_id = ?
      UNION SELECT project_id FROM project_members WHERE user_id = ?
    )
  `).get(uid, uid).c;

  res.json({ stats, recentTasks: myTasks.slice(0, 6), overdueTasks: overdue.slice(0, 5), projectCount });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
