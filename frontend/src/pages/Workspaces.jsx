import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import MultiSelect from '../components/MultiSelect';
import SingleSelect from '../components/SingleSelect';
import { Building2, Plus, Users, FolderKanban, CalendarDays, Eye, Tag } from 'lucide-react';

function NewWorkspaceModal({ onClose, onCreated }) {
  const [form, setForm]     = useState({ name: '', description: '', category: 'general', visibility: 'private', projects: [], members: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  
  const [allUsers, setAllUsers] = useState([]);
  const [allProjects, setAllProjects] = useState([]);

  useEffect(() => {
    api.get('/auth/users').then(r => setAllUsers(r.data)).catch(() => {});
    api.get('/projects').then(r => setAllProjects(r.data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Map members to the format expected by backend: {userId, role}
      const payload = {
        ...form,
        members: form.members.map(id => ({ userId: id, role: 'member' })) // defaulting to member, could enhance later
      };
      await api.post('/workspaces', payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create workspace');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: '480px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="var(--accent)" />
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>New Workspace</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
        </div>
        {error && <div className="tf-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="tf-label" htmlFor="ws-name">Workspace name *</label>
            <input id="ws-name" className="tf-input" placeholder="e.g. Acme Corp" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required autoFocus />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="tf-label" htmlFor="ws-desc">Description</label>
            <textarea id="ws-desc" className="tf-input" placeholder="What's this workspace for?" rows={3} style={{ resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="tf-label">Category</label>
              <SingleSelect 
                options={[
                  { value: 'general', label: 'General' },
                  { value: 'engineering', label: 'Engineering' },
                  { value: 'design', label: 'Design' },
                  { value: 'marketing', label: 'Marketing' }
                ]}
                value={form.category} 
                onChange={v => setForm(p => ({ ...p, category: v }))} 
              />
            </div>
            <div>
              <label className="tf-label">Visibility</label>
              <SingleSelect 
                options={[
                  { value: 'private', label: 'Private' },
                  { value: 'company-wide', label: 'Company-wide' }
                ]}
                value={form.visibility} 
                onChange={v => setForm(p => ({ ...p, visibility: v }))} 
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label className="tf-label">Link Existing Projects</label>
            <MultiSelect 
              options={allProjects} 
              selected={form.projects} 
              onChange={(sel) => setForm(p => ({ ...p, projects: sel }))} 
              placeholder="Type a project name..." 
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="tf-label">Invite Members</label>
            <MultiSelect 
              options={allUsers} 
              selected={form.members} 
              onChange={(sel) => setForm(p => ({ ...p, members: sel }))} 
              placeholder="Search by name or email..." 
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Members will be added as Contributors.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="tf-btn tf-btn-primary" disabled={loading} style={{ flex: 1, padding: '12px' }}>
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
            <button type="button" className="tf-btn tf-btn-ghost" onClick={onClose} style={{ padding: '12px 20px' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WorkspaceCard({ workspace, onClick }) {
  return (
    <div
      onClick={onClick}
      className="glass-card"
      style={{ cursor: 'pointer', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, var(--accent), var(--accent-2))`,
      }} />

      <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem', lineHeight: 1.3, marginBottom: '0.5rem' }}>
        {workspace.name}
      </h3>
      
      {workspace.description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {workspace.description}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: workspace.description ? '0' : '1.5rem', marginBottom: '0.5rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Users size={14} /> {workspace.membersCount || 0} members
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <FolderKanban size={14} /> {workspace.projectsCount || 0} projects
        </span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {workspace.category && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', textTransform: 'uppercase' }}>
              <Tag size={10} /> {workspace.category}
            </span>
          )}
          {workspace.visibility && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              <Eye size={10} /> {workspace.visibility}
            </span>
          )}
        </div>
        {workspace.createdAt && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <CalendarDays size={12} /> {new Date(workspace.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Workspaces() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get('/workspaces').then(r => { setWorkspaces(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem' }}>
      <div className="mobile-header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', opacity: 0, animation: 'fadeUp 0.4s ease forwards' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Workspaces</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.3rem' }}>
            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} available
          </p>
        </div>
        {/* Any user can create a workspace — they become the workspace admin */}
        <button onClick={() => setShowModal(true)} className="tf-btn tf-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> New Workspace
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : workspaces.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '5rem 2rem',
          background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)',
          animation: 'fadeUp 0.5s ease forwards',
        }}>
          <Building2 size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No workspaces yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Create a workspace to organize your projects and team members.</p>
          <button onClick={() => setShowModal(true)} className="tf-btn tf-btn-primary">Create Workspace</button>
        </div>
      ) : (
        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {workspaces.map(w => (
            <WorkspaceCard key={w.id} workspace={w} onClick={() => navigate(`/workspaces/${w.id}`)} />
          ))}
        </div>
      )}

      {showModal && <NewWorkspaceModal onClose={() => setShowModal(false)} onCreated={load} />}
    </div>
  );
}
