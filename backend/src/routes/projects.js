const router = require('express').Router();
const { Project, Workspace } = require('../db');
const auth = require('../middleware/auth');

// GET /api/projects/mine - Projects the current user is part of (via workspace membership)
router.get('/mine', auth, async (req, res) => {
  try {
    // Find all workspaces the user is a member of
    const workspaces = await Workspace.find({
      $or: [
        { owner_id: req.user._id },
        { 'members.user_id': req.user._id }
      ]
    }).populate('projects');

    // Collect unique projects from those workspaces
    const projectMap = new Map();
    for (const ws of workspaces) {
      for (const p of ws.projects) {
        if (!projectMap.has(p._id.toString())) {
          projectMap.set(p._id.toString(), {
            id: p._id.toString(),
            name: p.name,
            description: p.description,
            owner_id: p.owner_id.toString(),
            status: p.status,
            priority: p.priority,
            deadline: p.deadline,
            createdAt: p.createdAt
          });
        }
      }
    }

    res.json([...projectMap.values()]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects - Get all global projects (admins see all; members see theirs via /mine)
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    
    // Convert to response format
    const mapped = projects.map(p => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      owner_id: p.owner_id.toString(),
      status: p.status,
      priority: p.priority,
      deadline: p.deadline,
      createdAt: p.createdAt
    }));
    
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects - Create a project (any authenticated user)
router.post('/', auth, async (req, res) => {
  const { name, description, status, priority, deadline, workspaces = [] } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name is required' });

  try {
    const project = new Project({
      name,
      description,
      status: status || 'active',
      priority: priority || 'medium',
      deadline: deadline || null,
      owner_id: req.user._id
    });
    await project.save();

    // If workspaces specified, link the project
    if (workspaces.length > 0) {
      // Only link workspaces where the user is a member or admin
      const ownedWs = await Workspace.find({
        _id: { $in: workspaces },
        $or: [
          { owner_id: req.user._id },
          { 'members.user_id': req.user._id }
        ]
      });
      for (const ws of ownedWs) {
        ws.projects.push(project._id);
        await ws.save();
      }
    }

    res.status(201).json({ id: project._id.toString(), name: project.name, description: project.description });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id - Get a specific global project with its tasks
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner_id', 'name');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Fetch tasks for this project
    const { Task } = require('../db');
    const tasks = await Task.find({ project_id: project._id }).populate('assignee_id', 'name').populate('creator_id', 'name').populate('comments.user_id', 'name').sort({ createdAt: -1 });
    
    // Format tasks
    const formattedTasks = tasks.map(t => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      tags: t.tags,
      assignee_id: t.assignee_id?._id?.toString(),
      assignee_name: t.assignee_id?.name,
      creator_id: t.creator_id?._id?.toString(),
      creator_name: t.creator_id?.name,
      comments: t.comments.map(c => ({
        id: c._id.toString(),
        text: c.text,
        user_name: c.user_id?.name,
        created_at: c.created_at
      }))
    }));

    // For a global project, we may not have 'members' like a workspace, but we can assume the owner is a member, 
    // or we can fetch users who are members of workspaces that this project belongs to.
    // For now, let's just include the owner as a member so the UI can assign tasks to them.
    const members = [{
      id: project.owner_id._id.toString(),
      name: project.owner_id.name,
      workspace_role: 'admin'
    }];

    res.json({
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      owner_id: project.owner_id._id.toString(),
      owner_name: project.owner_id.name,
      status: project.status,
      priority: project.priority,
      deadline: project.deadline,
      createdAt: project.createdAt,
      members,
      tasks: formattedTasks
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id - Delete a project (owner or global admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = project.owner_id.toString() === req.user._id.toString();
    const isGlobalAdmin = req.user.role === 'admin';
    if (!isOwner && !isGlobalAdmin) {
      return res.status(403).json({ message: 'Only the project owner or a global admin can delete this project' });
    }
    
    await Project.findByIdAndDelete(req.params.id);
    
    // Remove from all workspaces that linked it
    await Workspace.updateMany(
      { projects: req.params.id },
      { $pull: { projects: req.params.id } }
    );
    
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
