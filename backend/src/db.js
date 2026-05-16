const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
}

// Schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' } // 'admin' or 'user'
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'active' }, // active, completed, on-hold
  priority: { type: String, default: 'medium' }, // low, medium, high
  deadline: String // YYYY-MM-DD
}, { timestamps: true });

const WorkspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, default: 'general' }, // engineering, design, marketing, general
  visibility: { type: String, default: 'private' }, // private, company-wide
  members: [{
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'member'], default: 'member' }
  }],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }]
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, default: 'todo' },
  priority: { type: String, default: 'medium' },
  due_date: String, // YYYY-MM-DD
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [String],
  comments: [{
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Models
const User = mongoose.model('User', UserSchema);
const Project = mongoose.model('Project', ProjectSchema);
const Workspace = mongoose.model('Workspace', WorkspaceSchema);
const Task = mongoose.model('Task', TaskSchema);

module.exports = {
  connectDB,
  User,
  Project,
  Workspace,
  Task
};
