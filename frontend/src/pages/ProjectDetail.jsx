import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import SingleSelect from '../components/SingleSelect';
import MultiSelect from '../components/MultiSelect';
import { CalendarDays, AlertTriangle, PlusCircle, Trash2, ArrowLeft, Clock, Circle, Clock4, Eye, CheckCircle2, Link as LinkIcon } from 'lucide-react';

const STATUSES   = ['todo', 'in-progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const STATUS_META = {
  'todo':        { color: 'var(--todo)',       glow: 'var(--todo-glow)',       label: 'To Do',      icon: <Circle size={14} /> },
  'in-progress': { color: 'var(--inprogress)', glow: 'var(--inprogress-glow)', label: 'In Progress', icon: <Clock4 size={14} /> },
  'review':      { color: 'var(--review)',     glow: 'var(--review-glow)',     label: 'Review',     icon: <Eye size={14} /> },
  'done':        { color: 'var(--done)',       glow: 'var(--done-glow)',       label: 'Done',       icon: <CheckCircle2 size={14} /> },
};
const PRIORITY_META = {
  low:      { color: 'var(--low)',      label: 'Low' },
  medium:   { color: 'var(--medium)',   label: 'Medium' },
  high:     { color: 'var(--high)',     label: 'High' },
  critical: { color: 'var(--critical)', label: 'Critical' },
};

function Avatar({ name, size = 28 }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const hue = (name?.charCodeAt(0) || 0) * 137 % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},55%,45%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: 'white',
      border: '2px solid rgba(255,255,255,0.15)',
      title: name,
    }}>{initials}</div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px',
      background: color + '25', color, textTransform: 'uppercase', letterSpacing: '0.3px',
    }}>{label}</span>
  );
}

/* ---- Task Card (Kanban) ---- */
function TaskCard({ task, onClick }) {
  const today  = new Date().toISOString().split('T')[0];
  const overdue = task.due_date && task.due_date < today && task.status !== 'done';
  const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${overdue ? 'rgba(239,68,68,0.4)' : 'var(--glass-border)'}`,
        borderLeft: `3px solid ${pm.color}`,
        borderRadius: '12px',
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: overdue ? '0 2px 12px rgba(239,68,68,0.15)' : 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = overdue ? '0 2px 12px rgba(239,68,68,0.15)' : 'none'; }}
    >
      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: '0.6rem', lineHeight: 1.4 }}>
        {task.title}
      </p>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: task.assignee_name || task.due_date ? '0.6rem' : 0 }}>
        <Badge label={pm.label} color={pm.color} />
        {overdue && <Badge label="Overdue" color="#ef4444" />}
        {task.tags?.map(t => (
          <span key={t} style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', textTransform: 'lowercase' }}>#{t}</span>
        ))}
      </div>
      {(task.assignee_name || task.due_date) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          {task.assignee_name
            ? <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Avatar name={task.assignee_name} size={20} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{task.assignee_name}</span>
              </div>
            : <span />
          }
          {task.due_date && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: overdue ? '#fca5a5' : 'var(--text-muted)' }}>
              {overdue ? <AlertTriangle size={12} /> : <CalendarDays size={12} />} {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Add Task Modal ---- */
function AddTaskModal({ project, allUsers, onClose, onCreated }) {
  const [form, setForm]     = useState({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '', assignee_id: '', tagsInput: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const tags = form.tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      await api.post('/tasks', { ...form, project_id: project.id, tags });
      onCreated(); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: '520px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={20} color="var(--accent)" />
            <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>New Task</h3>
          </div>
          <button id="close-task-modal" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
        </div>
        {error && <div className="tf-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="tf-label">Title *</label>
            <input id="task-title" className="tf-input" placeholder="What needs to be done?" value={form.title} onChange={set('title')} required autoFocus />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="tf-label">Description</label>
            <textarea id="task-desc" className="tf-input" rows={3} style={{ resize: 'vertical' }} placeholder="Add details..." value={form.description} onChange={set('description')} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="tf-label">Tags</label>
            <input className="tf-input" placeholder="frontend, bug, ui (comma separated)" value={form.tagsInput} onChange={set('tagsInput')} />
          </div>
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1rem' }}>
            <div>
              <label className="tf-label">Priority</label>
              <SingleSelect 
                options={PRIORITIES.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} 
                value={form.priority} 
                onChange={v => setForm(p => ({ ...p, priority: v }))} 
              />
            </div>
            <div>
              <label className="tf-label">Status</label>
              <SingleSelect 
                options={STATUSES.map(s => ({ value: s, label: STATUS_META[s].label }))} 
                value={form.status} 
                onChange={v => setForm(p => ({ ...p, status: v }))} 
              />
            </div>
            <div>
              <label className="tf-label">Due Date</label>
              <input id="task-due-date" className="tf-input" type="date" value={form.due_date} onChange={set('due_date')} />
            </div>
            <div>
              <label className="tf-label">Assign To</label>
              <SingleSelect 
                options={[{ id: '', name: 'Unassigned' }, ...(project.members || [])]} 
                value={form.assignee_id} 
                onChange={v => setForm(p => ({ ...p, assignee_id: v }))} 
                placeholder="Unassigned"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button id="create-task-btn" type="submit" className="tf-btn tf-btn-primary" disabled={loading} style={{ flex: 1, padding: '12px' }}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
            <button type="button" className="tf-btn tf-btn-ghost" onClick={onClose} style={{ padding: '12px 20px' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---- Link To Workspace Modal ---- */
function LinkToWorkspaceModal({ project, onClose, onLinked }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    api.get('/workspaces').then(r => {
      setWorkspaces(r.data);
      setLoading(false);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (selected.length === 0) return onClose();
    setSaving(true);
    try {
      for (const wId of selected) {
        await api.post(`/workspaces/${wId}/projects`, { projectId: project.id });
      }
      onLinked();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to link workspaces');
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: '400px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LinkIcon size={20} color="var(--accent)" />
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>Link to Workspace</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="tf-label">Select Workspaces</label>
            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading workspaces...</div>
            ) : (
              <MultiSelect 
                options={workspaces}
                selected={selected}
                onChange={setSelected}
                placeholder="Search workspaces..."
              />
            )}
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Note: You must be an admin in the workspace to link projects.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="tf-btn tf-btn-primary" disabled={saving || loading} style={{ flex: 1, padding: '12px' }}>
              {saving ? 'Linking...' : 'Link Project'}
            </button>
            <button type="button" className="tf-btn tf-btn-ghost" onClick={onClose} style={{ padding: '12px 20px' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---- Removed AddMemberModal ---- */

/* ---- Task Detail Modal ---- */
function TaskDetailModal({ task, canDelete, onClose, onStatusChange, onDelete, onAddComment }) {
  const sm = STATUS_META[task.status] || STATUS_META.todo;
  const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const today  = new Date().toISOString().split('T')[0];
  const overdue = task.due_date && task.due_date < today && task.status !== 'done';
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommenting(true);
    await onAddComment(task.id, commentText);
    setCommentText('');
    setCommenting(false);
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <button id="close-task-detail-modal" onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <Badge label={sm.label} color={sm.color} />
            <Badge label={pm.label} color={pm.color} />
            {overdue && <Badge label="Overdue" color="#ef4444" />}
            {task.tags?.map(t => (
              <span key={t} style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textTransform: 'lowercase' }}>#{t}</span>
            ))}
          </div>
          <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.2rem', lineHeight: 1.3, paddingRight: '2rem' }}>
            {task.title}
          </h3>
          {task.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.75rem', lineHeight: 1.6 }}>{task.description}</p>}
        </div>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {task.assignee_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar name={task.assignee_name} size={24} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Assigned to <strong style={{ color: 'var(--text-primary)' }}>{task.assignee_name}</strong></span>
            </div>
          )}
          {task.due_date && (
            <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: overdue ? '#fca5a5' : 'var(--text-secondary)' }}>
              {overdue ? <AlertTriangle size={14} /> : <CalendarDays size={14} />} Due: {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}
            </p>
          )}
          {task.creator_name && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Created by {task.creator_name}</p>}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="tf-label">Update Status</label>
          <SingleSelect 
            options={STATUSES.map(s => ({ value: s, label: STATUS_META[s].label }))} 
            value={task.status} 
            onChange={v => onStatusChange(task.id, v)} 
          />
        </div>

        {/* Comments Section */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Comments</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {task.comments?.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No comments yet.</div>
            ) : (
              task.comments?.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
                  <Avatar name={c.user_name} size={28} />
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '0 12px 12px 12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{c.user_name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={submitComment} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              className="tf-input" 
              placeholder="Write a comment..." 
              value={commentText} 
              onChange={e => setCommentText(e.target.value)} 
              style={{ flex: 1 }} 
            />
            <button type="submit" className="tf-btn tf-btn-primary" disabled={commenting || !commentText.trim()} style={{ padding: '0 16px' }}>
              {commenting ? '...' : 'Send'}
            </button>
          </form>
        </div>

        {canDelete && (
          <button id="delete-task-btn" onClick={() => onDelete(task.id)} className="tf-btn tf-btn-danger" style={{ width: '100%', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Trash2 size={16} /> Delete Task
          </button>
        )}
      </div>
    </div>
  );
}

/* ---- Main Page ---- */
export default function ProjectDetail() {
  const { id, workspaceId } = useParams();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [project, setProject]   = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [showTask, setShowTask]     = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  const load = () => api.get(`/projects/${id}`).then(r => setProject(r.data));
  useEffect(() => { load(); api.get('/auth/users').then(r => setAllUsers(r.data)); }, [id]);

  const updateStatus = async (taskId, status) => {
    await api.put(`/tasks/${taskId}`, { status });
    if (activeTask?.id === taskId) setActiveTask(t => ({ ...t, status }));
    load();
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    await api.delete(`/tasks/${taskId}`);
    setActiveTask(null); load();
  };

  const addComment = async (taskId, text) => {
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, { text });
      // update active task with new comment locally to avoid full reload just for a comment
      setActiveTask(t => ({
        ...t,
        comments: [...(t.comments || []), { id: res.data.id, text: res.data.text, user_name: user.name, created_at: new Date().toISOString() }]
      }));
      // also reload project to get updated tasks
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment');
    }
  };

  if (!project) return (
    <div style={{ padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        <div className="skeleton" style={{ height: '60px', borderRadius: '12px', marginBottom: '1.5rem', maxWidth: '400px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius)' }} />)}
        </div>
      </div>
    </div>
  );

  const tasksByStatus = STATUSES.reduce((acc, s) => ({ ...acc, [s]: project.tasks?.filter(t => t.status === s) || [] }), {});
  const isMemberAdmin = project.members?.some(m => m.id === user?.id && m.workspace_role === 'admin');
  const isOwner   = project.owner_id === user?.id;
  // Can manage = project owner, workspace-level admin, or global admin
  const canManage = isOwner || isMemberAdmin || user?.role === 'admin';
  const totalTasks = project.tasks?.length || 0;
  const doneTasks  = project.tasks?.filter(t => t.status === 'done').length || 0;
  const pct        = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '2.5rem 2rem' }}>

      {/* Header */}
      <div style={{ opacity: 0, animation: 'fadeUp 0.4s ease forwards', marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate(workspaceId ? `/workspaces/${workspaceId}` : '/projects')} 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1rem', padding: 0, fontFamily: 'inherit' }}
        >
          <ArrowLeft size={14} /> Back to {workspaceId ? 'Workspace' : 'Projects'}
        </button>

        <div className="mobile-header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 }}>{project.name}</h2>
              {project.status && (
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {project.status}
                </span>
              )}
              {project.priority && (
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: PRIORITY_META[project.priority]?.color + '20', color: PRIORITY_META[project.priority]?.color, textTransform: 'uppercase' }}>
                  {PRIORITY_META[project.priority]?.label || project.priority} Priority
                </span>
              )}
            </div>
            {project.description && <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem', maxWidth: '600px', lineHeight: 1.5 }}>{project.description}</p>}
            
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {project.createdAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <CalendarDays size={14} /> Created {new Date(project.createdAt).toLocaleDateString()}
                </div>
              )}
              {project.deadline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: project.deadline < new Date().toISOString().split('T')[0] && project.status !== 'completed' ? '#fca5a5' : 'var(--text-muted)' }}>
                  {project.deadline < new Date().toISOString().split('T')[0] && project.status !== 'completed' ? <AlertTriangle size={14} /> : <Clock size={14} />} Deadline: {new Date(project.deadline + 'T00:00:00').toLocaleDateString()}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '300px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', height: '100%', width: `${pct}%`, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{pct}%</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{doneTasks}/{totalTasks} tasks done</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
            <button onClick={() => setShowLinkModal(true)} className="tf-btn tf-btn-ghost" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>
              <LinkIcon size={14} /> Link Workspace
            </button>
            <button id="add-task-open-btn" onClick={() => setShowTask(true)} className="tf-btn tf-btn-primary" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>
              + Add Task
            </button>
          </div>
        </div>

        {/* Members */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {project.members?.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
              borderRadius: '20px', padding: '4px 12px 4px 5px',
            }}>
              <Avatar name={m.name} size={22} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{m.name}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: m.workspace_role === 'admin' ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                {m.workspace_role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-grid">
        {STATUSES.map((status, ci) => {
          const sm = STATUS_META[status];
          const tasks = tasksByStatus[status];
          return (
            <div key={status} style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--glass-border)',
              borderTop: `2px solid ${sm.color}`,
              borderRadius: 'var(--radius)',
              padding: '1rem',
              opacity: 0,
              animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${0.1 + ci * 0.07}s forwards`,
            }}>
              {/* Column header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: sm.color, fontSize: '0.9rem' }}>{sm.icon}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: sm.color }}>
                    {sm.label}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.73rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                  background: sm.color + '20', color: sm.color,
                }}>{tasks.length}</span>
              </div>

              {/* Task cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={() => setActiveTask(task)} />
                ))}
                {tasks.length === 0 && (
                  <div style={{
                    textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)',
                    fontSize: '0.8rem', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '10px',
                  }}>
                    No tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showLinkModal && (
        <LinkToWorkspaceModal project={project} onClose={() => setShowLinkModal(false)} onLinked={() => {
          alert('Project linked to selected workspaces!');
        }} />
      )}
      {showTask && (
        <AddTaskModal project={project} allUsers={allUsers} onClose={() => setShowTask(false)} onCreated={load} />
      )}
      {activeTask && (
        <TaskDetailModal
          task={activeTask}
          canDelete={activeTask.creator_id === user?.id || user?.role === 'admin'}
          onClose={() => setActiveTask(null)}
          onStatusChange={updateStatus}
          onDelete={deleteTask}
          onAddComment={addComment}
        />
      )}
    </div>
  );
}
