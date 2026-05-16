const router = require('express').Router();
const { Task, Project, Workspace, User } = require('../db');
const auth = require('../middleware/auth');

// Helper to check if a user has access to a project
// (i.e. is the user an admin, or in a workspace that contains this project)
async function checkProjectAccess(projectId, userId, userRole) {
  if (userRole === 'admin') return true;
  const workspaces = await Workspace.find({
    projects: projectId,
    $or: [
      { owner_id: userId },
      { 'members.user_id': userId }
    ]
  });
  return workspaces.length > 0;
}

// GET /api/tasks?projectId=&assigneeId=&status=
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectId) filter.project_id = req.query.projectId;
    if (req.query.assigneeId) filter.assignee_id = req.query.assigneeId;
    if (req.query.status) filter.status = req.query.status;

    // We only want to return tasks that belong to projects the user has access to.
    // If user is not admin, find all projects they have access to.
    if (req.user.role !== 'admin') {
      const workspaces = await Workspace.find({
        $or: [
          { owner_id: req.user._id },
          { 'members.user_id': req.user._id }
        ]
      });
      const allowedProjectIds = workspaces.reduce((acc, w) => acc.concat(w.projects), []);
      if (filter.project_id) {
        if (!allowedProjectIds.some(pid => pid.toString() === filter.project_id)) {
          return res.json([]); // User asked for a project they don't have access to
        }
      } else {
        filter.project_id = { $in: allowedProjectIds };
      }
    }

    const tasks = await Task.find(filter)
      .populate('assignee_id', 'name')
      .populate('creator_id', 'name')
      .populate('project_id', 'name')
      .sort({ createdAt: -1 });

    const mapped = tasks.map(t => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      project_id: t.project_id._id.toString(),
      project_name: t.project_id.name,
      assignee_id: t.assignee_id?._id.toString(),
      assignee_name: t.assignee_id?.name,
      creator_id: t.creator_id._id.toString(),
      creator_name: t.creator_id.name,
      tags: t.tags || [],
      comments: t.comments || []
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks
router.post('/', auth, async (req, res) => {
  const { title, description, status, priority, due_date, project_id, assignee_id, tags } = req.body;
  if (!title || !project_id) return res.status(400).json({ message: 'title and project_id required' });
  
  try {
    const hasAccess = await checkProjectAccess(project_id, req.user._id, req.user.role);
    if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });

    const task = new Task({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      due_date,
      project_id,
      assignee_id: assignee_id === '' ? undefined : assignee_id,
      creator_id: req.user._id,
      tags: tags || []
    });
    
    await task.save();
    res.status(201).json({ id: task._id.toString(), title: task.title });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee_id', 'name')
      .populate('creator_id', 'name')
      .populate('project_id', 'name')
      .populate('comments.user_id', 'name');
      
    if (!task) return res.status(404).json({ message: 'Not found' });
    
    const hasAccess = await checkProjectAccess(task.project_id._id, req.user._id, req.user.role);
    if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });

    res.json({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      project_id: task.project_id._id.toString(),
      project_name: task.project_id.name,
      assignee_id: task.assignee_id?._id.toString(),
      assignee_name: task.assignee_id?.name,
      creator_id: task.creator_id._id.toString(),
      creator_name: task.creator_id.name,
      tags: task.tags || [],
      comments: task.comments.map(c => ({
        id: c._id.toString(),
        text: c.text,
        created_at: c.created_at,
        user_id: c.user_id?._id.toString(),
        user_name: c.user_id?.name
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    
    const hasAccess = await checkProjectAccess(task.project_id, req.user._id, req.user.role);
    if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });

    const { title, description, status, priority, due_date, assignee_id, tags } = req.body;
    
    task.title = title ?? task.title;
    task.description = description ?? task.description;
    task.status = status ?? task.status;
    task.priority = priority ?? task.priority;
    task.due_date = due_date ?? task.due_date;
    
    if (assignee_id !== undefined) {
      task.assignee_id = assignee_id === '' ? undefined : assignee_id;
    }
    
    if (tags !== undefined) task.tags = tags;
    
    await task.save();
    res.json({ id: task._id.toString(), title: task.title });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    
    // Only creator or admin can delete
    if (task.creator_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    
    const hasAccess = await checkProjectAccess(task.project_id, req.user._id, req.user.role);
    if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });

    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'text required' });

    task.comments.push({
      user_id: req.user._id,
      text
    });
    
    await task.save();
    
    const newComment = task.comments[task.comments.length - 1];
    res.status(201).json({ id: newComment._id.toString(), text: newComment.text });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
