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
    
    const { Task, Workspace, Project } = require('./db');
    
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
      project_name: t.project_id.name,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }));

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const overdue = mappedTasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'done');
    const upcoming = mappedTasks.filter(t => t.due_date && t.due_date >= todayStr && t.due_date <= nextWeekStr && t.status !== 'done').sort((a,b) => a.due_date.localeCompare(b.due_date));

    const priorityStats = { low: 0, medium: 0, high: 0, critical: 0 };
    mappedTasks.filter(t => t.status !== 'done').forEach(t => {
      if (priorityStats[t.priority] !== undefined) priorityStats[t.priority]++;
    });

    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0,0,0,0);
    const fourteenDaysAgo = new Date(now); fourteenDaysAgo.setDate(now.getDate() - 13);
    fourteenDaysAgo.setHours(0,0,0,0);
    
    const completedLast7 = mappedTasks.filter(t => t.status === 'done' && new Date(t.updatedAt) >= sevenDaysAgo).length;
    const completedPrev7 = mappedTasks.filter(t => t.status === 'done' && new Date(t.updatedAt) >= fourteenDaysAgo && new Date(t.updatedAt) < sevenDaysAgo).length;
    const completionTrend = completedPrev7 === 0 ? (completedLast7 > 0 ? 100 : 0) : Math.round(((completedLast7 - completedPrev7) / completedPrev7) * 100);

    // Activity Data for the graph (Last 7 days)
    const activityData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const completedOnDay = mappedTasks.filter(t => t.status === 'done' && t.updatedAt && new Date(t.updatedAt).toISOString().split('T')[0] === dateStr).length;
      activityData.push({ day: shortDay, date: dateStr, completed: completedOnDay });
    }

    const stats = {
      total: mappedTasks.length,
      todo: mappedTasks.filter(t => t.status === 'todo').length,
      inProgress: mappedTasks.filter(t => t.status === 'in-progress').length,
      review: mappedTasks.filter(t => t.status === 'review').length,
      done: mappedTasks.filter(t => t.status === 'done').length,
      overdue: overdue.length,
      completedLast7,
      completionTrend
    };

    const workspaces = await Workspace.find({
      $or: [
        { owner_id: uid },
        { 'members.user_id': uid }
      ]
    });

    const ownedProjects = await Project.find({ owner_id: uid });
    const projectIds = new Set(ownedProjects.map(p => p._id.toString()));
    workspaces.forEach(ws => ws.projects.forEach(p => projectIds.add(p.toString())));
    
    const allProjects = await Project.find({ _id: { $in: Array.from(projectIds) } });
    const projectStats = {
      active: allProjects.filter(p => p.status === 'active').length,
      completed: allProjects.filter(p => p.status === 'completed').length,
      onHold: allProjects.filter(p => p.status === 'on-hold').length,
      total: allProjects.length
    };

    res.json({ 
      stats, 
      priorityStats,
      projectStats,
      activityData,
      recentTasks: mappedTasks.slice(0, 6), 
      overdueTasks: overdue.slice(0, 5), 
      upcomingTasks: upcoming.slice(0, 5),
      workspaceCount: workspaces.length 
    });
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
