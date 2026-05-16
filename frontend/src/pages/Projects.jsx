import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import MultiSelect from '../components/MultiSelect';
import SingleSelect from '../components/SingleSelect';
import { CheckCircle2, CircleDashed, PauseCircle, Clock, CalendarDays, FolderOpen, Plus, Trash2 } from 'lucide-react';

const STATUS_COLOR = { active: '#10b981', completed: '#6366f1', 'on-hold': '#f59e0b' };
const STATUS_ICON  = { 
  active: <CircleDashed size={14} />, 
  completed: <CheckCircle2 size={14} />, 
  'on-hold': <PauseCircle size={14} /> 
};

const PRIORITY_META = {
  low:      { color: '#3b82f6', label: 'Low' },
  medium:   { color: '#eab308', label: 'Medium' },
  high:     { color: '#f97316', label: 'High' }
};

function ProjectCard({ project, onDelete }) {
  const sc = STATUS_COLOR[project.status] || '#94a3b8';
  const pm = PRIORITY_META[project.priority] || PRIORITY_META.medium;
  
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--glass-border)',
      borderLeft: `3px solid ${sc}`,
      borderRadius: 'var(--radius)',
      padding: '1.5rem',
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '10px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, flex: 1, wordBreak: 'break-word' }}>
          {project.name}
        </h3>
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} 
            style={{ 
              background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer',
              padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
            title="Delete Project"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      
      {project.status && (
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', fontWeight: 700, padding: '4px 8px', borderRadius: '8px', background: sc + '15', color: sc, textTransform: 'uppercase' }}>
            {STATUS_ICON[project.status]} {project.status}
          </span>
        </div>
      )}
      
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5, flex: 1 }}>
        {project.description || 'No description provided.'}
      </p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {project.priority && (
          <div style={{ fontSize: '0.75rem', color: pm.color, fontWeight: 600, background: pm.color + '15', padding: '2px 8px', borderRadius: '6px' }}>
            {pm.label} Priority
          </div>
        )}
        {project.deadline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: project.deadline < new Date().toISOString().split('T')[0] && project.status !== 'completed' ? '#fca5a5' : 'var(--text-muted)' }}>
            <Clock size={12} /> {new Date(project.deadline + 'T00:00:00').toLocaleDateString()}
          </div>
        )}
        {project.createdAt && !project.deadline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <CalendarDays size={12} /> Created {new Date(project.createdAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', workspaces: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [allWorkspaces, setAllWorkspaces] = useState([]);

  useEffect(() => {
    api.get('/workspaces').then(r => setAllWorkspaces(r.data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await api.post('/projects', form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: '400px', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <FolderOpen size={20} color="var(--accent)" />
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>New Project</h3>
        </div>
        {error && <div className="tf-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="tf-label">Project Name</label>
            <input className="tf-input" placeholder="E.g., Website Redesign" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="tf-label">Description</label>
            <textarea className="tf-input" rows={3} placeholder="Brief description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1rem' }}>
            <div>
              <label className="tf-label">Status</label>
              <SingleSelect 
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'on-hold', label: 'On Hold' },
                  { value: 'completed', label: 'Completed' }
                ]}
                value={form.status || 'active'} 
                onChange={v => setForm({ ...form, status: v })} 
              />
            </div>
            <div>
              <label className="tf-label">Priority</label>
              <SingleSelect 
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' }
                ]}
                value={form.priority || 'medium'} 
                onChange={v => setForm({ ...form, priority: v })} 
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="tf-label">Deadline (Optional)</label>
              <input type="date" className="tf-input" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="tf-label">Add to Workspaces</label>
            <MultiSelect 
              options={allWorkspaces} 
              selected={form.workspaces} 
              onChange={(sel) => setForm(p => ({ ...p, workspaces: sel }))} 
              placeholder="Search workspaces..." 
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Instantly link this project to selected workspaces.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="tf-btn tf-btn-primary" disabled={loading} style={{ flex: 1, padding: '12px' }}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
            <button type="button" className="tf-btn tf-btn-ghost" onClick={onClose} style={{ padding: '12px 20px' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  // Default: members see their own projects; admins see all
  const [viewAll, setViewAll] = useState(user?.role === 'admin');

  const load = (all = viewAll) => {
    setLoading(true);
    const endpoint = all ? '/projects' : '/projects/mine';
    api.get(endpoint).then(r => {
      setProjects(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(viewAll); }, [viewAll]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      load(viewAll);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 2rem' }}>
      <div className="mobile-header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-primary)' }}>
            Projects
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {viewAll
              ? (user?.role === 'admin' ? 'All projects across the platform.' : 'All projects you have access to.')
              : 'Projects from workspaces you are a member of.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* View toggle — shown to all users */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
            border: '1px solid var(--glass-border)', overflow: 'hidden'
          }}>
            <button
              onClick={() => setViewAll(false)}
              style={{
                padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
                background: !viewAll ? 'rgba(99,102,241,0.25)' : 'transparent',
                color: !viewAll ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}>My Projects</button>
            <button
              onClick={() => setViewAll(true)}
              style={{
                padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
                background: viewAll ? 'rgba(99,102,241,0.25)' : 'transparent',
                color: viewAll ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}>All Projects</button>
          </div>
          {/* All users can create projects */}
          <button onClick={() => setShowModal(true)} className="tf-btn tf-btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Create Project
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '150px', width: '300px', borderRadius: '12px' }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <FolderOpen size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {!viewAll ? 'No projects in your workspaces yet' : 'No projects found'}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            {!viewAll
              ? 'Create a project and link it to a workspace, or ask a workspace admin to add you.'
              : 'No projects are accessible to you yet.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowModal(true)} className="tf-btn tf-btn-primary">Create a Project</button>
            {!viewAll && (
              <button onClick={() => setViewAll(true)} className="tf-btn tf-btn-ghost">Browse All Projects</button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {projects.map(p => (
            <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ cursor: 'pointer' }}>
              <ProjectCard
                project={p}
                // Owner or global admin can delete
                onDelete={(user?.id === p.owner_id || user?.role === 'admin') ? handleDelete : null}
              />
            </div>
          ))}
        </div>
      )}

      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} onCreated={() => load(viewAll)} />}
    </div>

  );
}
