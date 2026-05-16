require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));

// GET /api/search?q=
const auth = require('./middleware/auth');
app.get('/api/search', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ workspaces: [], projects: [] });

    const { Workspace, Project } = require('./db');
    const regex = new RegExp(q, 'i');

    // Workspaces the user has access to
    const accessibleWs = await Workspace.find({
      $or: [
        { owner_id: req.user._id },
        { 'members.user_id': req.user._id }
      ]
    });
    const wsResults = accessibleWs.filter(w => regex.test(w.name) || regex.test(w.description || '')).map(w => ({
      id: w._id.toString(),
      name: w.name,
      description: w.description,
      category: w.category
    }));

    // Projects the user has access to (admins see all)
    let projectQuery = { $or: [{ name: regex }, { description: regex }] };
    if (req.user.role !== 'admin') {
      const allowedProjectIds = accessibleWs.reduce((acc, w) => acc.concat(w.projects.map(p => p.toString())), []);
      projectQuery = { _id: { $in: allowedProjectIds }, $or: [{ name: regex }, { description: regex }] };
    }
    const projects = await Project.find(projectQuery).limit(8);
    const prResults = projects.map(p => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      status: p.status,
      priority: p.priority
    }));

    res.json({ workspaces: wsResults.slice(0, 8), projects: prResults });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const uid = req.user._id;
    
    const { Task, Workspace } = require('./db');
    
    const myTasks = await Task.find({ assignee_id: uid })
      .populate('project_id', 'name')
      .sort({ createdAt: -1 });

    const mappedTasks = myTasks.map(t => ({
      id: t._id.toString(),
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      project_id: t.project_id._id.toString(),
      project_name: t.project_id.name
    }));

    const now = new Date().toISOString().split('T')[0];
    const overdue = mappedTasks.filter(t => t.due_date && t.due_date < now && t.status !== 'done');

    const stats = {
      total: mappedTasks.length,
      todo: mappedTasks.filter(t => t.status === 'todo').length,
      inProgress: mappedTasks.filter(t => t.status === 'in-progress').length,
      review: mappedTasks.filter(t => t.status === 'review').length,
      done: mappedTasks.filter(t => t.status === 'done').length,
      overdue: overdue.length,
    };

    const workspaces = await Workspace.find({
      $or: [
        { owner_id: uid },
        { 'members.user_id': uid }
      ]
    });

    res.json({ stats, recentTasks: mappedTasks.slice(0, 6), overdueTasks: overdue.slice(0, 5), workspaceCount: workspaces.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

// Serve frontend in production
if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
