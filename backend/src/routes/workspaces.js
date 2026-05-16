const router = require('express').Router();
const { Workspace, User, Project, Task } = require('../db');
const auth = require('../middleware/auth');

// GET /api/workspaces
router.get('/', auth, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { owner_id: req.user._id },
        { 'members.user_id': req.user._id }
      ]
    }).populate('owner_id', 'name');

    const mapped = workspaces.map(w => ({
      id: w._id.toString(),
      name: w.name,
      description: w.description,
      owner_name: w.owner_id?.name,
      projectsCount: w.projects.length,
      membersCount: w.members.length,
      category: w.category,
      visibility: w.visibility,
      createdAt: w.createdAt
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/workspaces
router.post('/', auth, async (req, res) => {
  const { name, description, category, visibility, projects = [], members = [] } = req.body;
  if (!name) return res.status(400).json({ message: 'Workspace name required' });
  try {
    // Add creator as admin
    const initialMembers = [{ user_id: req.user._id, role: 'admin' }];
    
    // Add requested members if they don't already exist in initialMembers (prevent self-duplication)
    members.forEach(m => {
      if (m.userId !== req.user._id.toString()) {
        initialMembers.push({ user_id: m.userId, role: m.role || 'member' });
      }
    });

    const workspace = new Workspace({
      name,
      description,
      category,
      visibility,
      owner_id: req.user._id,
      members: initialMembers,
      projects
    });
    await workspace.save();
    res.status(201).json({ id: workspace._id.toString(), name: workspace.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workspaces/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner_id', 'name')
      .populate('members.user_id', 'name email')
      .populate('projects');
      
    if (!workspace) return res.status(404).json({ message: 'Not found' });

    const isOwner = workspace.owner_id._id.toString() === req.user._id.toString();
    const member = workspace.members.find(m => m.user_id._id.toString() === req.user._id.toString());
    const hasAccess = isOwner || member || req.user.role === 'admin';
    if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });

    // Map members
    const members = workspace.members.map(m => ({
      id: m.user_id._id.toString(),
      name: m.user_id.name,
      email: m.user_id.email,
      workspace_role: m.role
    }));

    // Map projects and fetch stats
    const projectsWithStats = await Promise.all(workspace.projects.map(async p => {
      const taskCountsAggr = await Task.aggregate([
        { $match: { project_id: p._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const taskCounts = taskCountsAggr.map(tc => ({ status: tc._id, count: tc.count }));
      return {
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        status: p.status,
        priority: p.priority,
        deadline: p.deadline,
        createdAt: p.createdAt,
        taskCounts
      };
    }));

    res.json({
      id: workspace._id.toString(),
      name: workspace.name,
      description: workspace.description,
      category: workspace.category,
      visibility: workspace.visibility,
      createdAt: workspace.createdAt,
      owner_id: workspace.owner_id._id.toString(),
      owner_name: workspace.owner_id.name,
      members,
      projects: projectsWithStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/workspaces/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Not found' });
    
    if (workspace.owner_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    workspace.name = req.body.name || workspace.name;
    workspace.description = req.body.description ?? workspace.description;
    if (req.body.category) workspace.category = req.body.category;
    if (req.body.visibility) workspace.visibility = req.body.visibility;
    await workspace.save();
    
    res.json({ id: workspace._id.toString(), name: workspace.name, category: workspace.category, visibility: workspace.visibility });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/workspaces/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Not found' });
    
    if (workspace.owner_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await Workspace.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/workspaces/:id/projects - Link a global project
router.post('/:id/projects', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Not found' });

    const isAdmin = workspace.owner_id.toString() === req.user._id.toString() ||
                    workspace.members.some(m => m.user_id.toString() === req.user._id.toString() && m.role === 'admin') ||
                    req.user.role === 'admin';
    if (!isAdmin) return res.status(403).json({ message: 'Only workspace admins can link projects' });

    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ message: 'projectId required' });

    if (!workspace.projects.includes(projectId)) {
      workspace.projects.push(projectId);
      await workspace.save();
    }
    res.status(201).json({ message: 'Project linked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/workspaces/:id/members
router.post('/:id/members', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Not found' });

    const isAdmin = workspace.owner_id.toString() === req.user._id.toString() ||
                    workspace.members.some(m => m.user_id.toString() === req.user._id.toString() && m.role === 'admin') ||
                    req.user.role === 'admin';
    if (!isAdmin) return res.status(403).json({ message: 'Only workspace admins can add members' });

    const { userId, role } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const exists = workspace.members.find(m => m.user_id.toString() === userId);
    if (!exists) {
      workspace.members.push({ user_id: userId, role: role || 'member' });
      await workspace.save();
    }
    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/workspaces/:id/members/:userId
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Not found' });

    const isAdmin = workspace.owner_id.toString() === req.user._id.toString() ||
                    workspace.members.some(m => m.user_id.toString() === req.user._id.toString() && m.role === 'admin') ||
                    req.user.role === 'admin';
    
    if (!isAdmin && req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    workspace.members = workspace.members.filter(m => m.user_id.toString() !== req.params.userId);
    await workspace.save();
    
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/workspaces/:id/members/:userId - Update member role
router.put('/:id/members/:userId', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Not found' });

    const isAdmin = workspace.owner_id.toString() === req.user._id.toString() ||
                    workspace.members.some(m => m.user_id.toString() === req.user._id.toString() && m.role === 'admin') ||
                    req.user.role === 'admin';
    
    if (!isAdmin) return res.status(403).json({ message: 'Only workspace admins can update roles' });

    const member = workspace.members.find(m => m.user_id.toString() === req.params.userId);
    if (!member) return res.status(404).json({ message: 'Member not found in workspace' });

    member.role = req.body.role || member.role;
    await workspace.save();
    
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/workspaces/:id/projects/:projectId - Unlink a project
router.delete('/:id/projects/:projectId', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Not found' });

    const isAdmin = workspace.owner_id.toString() === req.user._id.toString() ||
                    workspace.members.some(m => m.user_id.toString() === req.user._id.toString() && m.role === 'admin') ||
                    req.user.role === 'admin';
    if (!isAdmin) return res.status(403).json({ message: 'Only workspace admins can unlink projects' });

    workspace.projects = workspace.projects.filter(p => p.toString() !== req.params.projectId);
    await workspace.save();
    
    res.json({ message: 'Project unlinked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
