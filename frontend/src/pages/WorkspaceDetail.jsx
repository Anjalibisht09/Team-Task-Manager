import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import MultiSelect from '../components/MultiSelect';
import SingleSelect from '../components/SingleSelect';
import { CheckCircle2, CircleDashed, PauseCircle, Clock, CalendarDays, Link2, UserPlus, Shield, User, Edit3, AlertTriangle, ArrowLeft } from 'lucide-react';

const STATUS_COLOR = { active: '#10b981', completed: '#6366f1', 'on-hold': '#f59e0b' };
const STATUS_ICON  = { 
  active: <CircleDashed size={14} />, 
  completed: <CheckCircle2 size={14} />, 
  'on-hold': <PauseCircle size={14} /> 
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
    }}>
      {initials}
    </div>
  );
}

function LinkProjectModal({ workspaceId, currentProjects, onClose, onLinked }) {
  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/projects').then(res => {
      // Filter out projects already in this workspace
      const currentIds = currentProjects?.map(p => p.id) || [];
      setAvailableProjects(res.data.filter(p => !currentIds.includes(p.id)));
    });
  }, [currentProjects]);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await Promise.all(selectedProjectIds.map(projectId => 
        api.post(`/workspaces/${workspaceId}/projects`, { projectId })
      ));
      onLinked(); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Failed to link project'); setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: '480px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={20} color="var(--accent)" />
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>Link Global Project</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
        </div>
        {error && <div className="tf-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="tf-label">Select Projects</label>
            <MultiSelect 
              options={availableProjects} 
              selected={selectedProjectIds} 
              onChange={setSelectedProjectIds} 
              placeholder="Search global projects..." 
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="tf-btn tf-btn-primary" disabled={loading || selectedProjectIds.length === 0} style={{ flex: 1, padding: '12px' }}>
              {loading ? 'Linking...' : 'Link Project'}
            </button>
            <button type="button" className="tf-btn tf-btn-ghost" onClick={onClose} style={{ padding: '12px 20px' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ workspace, allUsers, onClose, onAdded }) {
  const [userId, setUserId] = useState('');
  const [role, setRole]     = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const available = allUsers.filter(u => !workspace.members?.find(m => m.id === u.id));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try { 
      await api.post(`/workspaces/${workspace.id}/members`, { userId, role }); 
      onAdded(); onClose(); 
    } catch (err) { 
      setError(err.response?.data?.message || 'Failed to add member');
      setLoading(false); 
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: '420px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="var(--accent)" />
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Add Contributor</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
        </div>
        {error && <div className="tf-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="tf-label">Select User</label>
            <SingleSelect 
              options={available} 
              value={userId} 
              onChange={setUserId} 
              placeholder="Choose a user..." 
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="tf-label">Role</label>
            <div className="mobile-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {['member', 'admin'].map(r => (
                <button key={r} type="button" onClick={() => setRole(r)} style={{
                  padding: '10px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                  background: role === r ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                  border: role === r ? '1.5px solid var(--accent)' : '1px solid var(--glass-border)',
                  color: role === r ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                  {r === 'admin' ? <Shield size={16} /> : <User size={16} />}
                  {r === 'admin' ? 'Admin' : 'Member'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="tf-btn tf-btn-primary" disabled={loading} style={{ flex: 1, padding: '12px' }}>
              {loading ? 'Adding...' : 'Add Contributor'}
            </button>
            <button type="button" className="tf-btn tf-btn-ghost" onClick={onClose} style={{ padding: '12px 20px' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditWorkspaceModal({ workspace, onClose, onUpdated }) {
  const [form, setForm] = useState({ 
    name: workspace.name, 
    description: workspace.description || '',
    category: workspace.category || 'general',
    visibility: workspace.visibility || 'private'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await api.put(`/workspaces/${workspace.id}`, form);
      onUpdated(); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Failed to update workspace'); setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: '480px', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
          <Edit3 size={20} color="var(--accent)" />
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>Edit Workspace</h3>
        </div>
        {error && <div className="tf-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="tf-label">Workspace Name</label>
            <input className="tf-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="tf-label">Description</label>
            <textarea className="tf-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="tf-btn tf-btn-primary" disabled={loading} style={{ flex: 1, padding: '12px' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="tf-btn tf-btn-ghost" onClick={onClose} style={{ padding: '12px 20px' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectCard({ project, onClick, onUnlink }) {
  const total  = project.taskCounts?.reduce((a, c) => a + c.count, 0) || 0;
  const done   = project.taskCounts?.find(c => c.status === 'done')?.count || 0;
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
  const sc     = STATUS_COLOR[project.status] || '#94a3b8';
  const isOverdue = project.deadline && project.deadline < new Date().toISOString().split('T')[0] && project.status !== 'completed';

  return (
    <div
      onClick={onClick}
      className="glass-card"
      style={{ cursor: 'pointer', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, ${sc}, ${sc}80)`,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.3 }}>
          {project.name}
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: '10px', whiteSpace: 'nowrap',
            background: sc + '20', color: sc, textTransform: 'uppercase', letterSpacing: '0.3px',
          }}>
            {STATUS_ICON[project.status]} {project.status}
          </span>
          {onUnlink && (
            <button 
              onClick={(e) => { e.stopPropagation(); onUnlink(project.id); }}
              className="tf-btn tf-btn-danger" 
              style={{ padding: '3px 8px', fontSize: '0.65rem' }}
              title="Remove from Workspace"
            >
              Unlink
            </button>
          )}
        </div>
      </div>

      {project.description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginBottom: '1rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {project.description}
        </p>
      )}

      <div style={{ marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>Progress</span>
          <span style={{ fontSize: '0.73rem', fontWeight: 700, color: pct === 100 ? 'var(--done)' : 'var(--text-secondary)' }}>{pct}%</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
          <div style={{
            background: pct === 100 ? 'var(--done)' : 'linear-gradient(90deg, var(--accent), var(--accent-2))',
            height: '100%', width: `${pct}%`, borderRadius: '4px', transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
          <span>{done}/{total} tasks</span>
          {project.deadline && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isOverdue ? '#fca5a5' : 'var(--text-muted)' }}>
              {isOverdue ? <AlertTriangle size={12} /> : <Clock size={12} />} {new Date(project.deadline + 'T00:00:00').toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/workspaces/${id}`).then(r => { setWorkspace(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { 
    load(); 
    api.get('/auth/users').then(r => setAllUsers(r.data)).catch(() => {});
  }, [id]);

  const removeMember = async (userId) => {
    if (!confirm('Remove this member from the workspace?')) return;
    await api.delete(`/workspaces/${id}/members/${userId}`);
    load();
  };

  const changeMemberRole = async (userId, newRole) => {
    try {
      await api.put(`/workspaces/${id}/members/${userId}`, { role: newRole });
      load();
    } catch(err) { alert(err.response?.data?.message || 'Failed to update role'); }
  };

  const handleUnlinkProject = async (projectId) => {
    if (!confirm('Remove this project from the workspace? (It will not be deleted globally)')) return;
    try {
      await api.delete(`/workspaces/${id}/projects/${projectId}`);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Failed to unlink'); }
  };

  const handleDeleteWorkspace = async () => {
    if (!confirm('Are you sure you want to completely delete this workspace? This cannot be undone.')) return;
    try {
      await api.delete(`/workspaces/${id}`);
      navigate('/workspaces');
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete workspace'); }
  };

  if (loading || !workspace) return (
    <div style={{ padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="skeleton" style={{ height: '60px', borderRadius: '12px', marginBottom: '1.5rem', maxWidth: '400px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius)' }} />)}
        </div>
      </div>
    </div>
  );

  // Workspace admin: workspace owner, workspace-level admin member, or global admin
  const isAdmin = workspace.owner_id === user?.id
    || workspace.members?.some(m => m.id === user?.id && m.workspace_role === 'admin')
    || user?.role === 'admin';
  // Workspace participant: any member (any role) of this workspace
  const isMember = isAdmin || workspace.members?.some(m => m.id === user?.id);
  // Global admin can manage any workspace regardless of membership
  const isGlobalAdmin = user?.role === 'admin';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem' }}>
      <div style={{ marginBottom: '2rem', opacity: 0, animation: 'fadeUp 0.4s ease forwards' }}>
        <button onClick={() => navigate('/workspaces')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1rem', padding: 0, fontFamily: 'inherit' }}>
          <ArrowLeft size={14} /> Back to Workspaces
        </button>
        <div className="mobile-header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{workspace.name}</h2>
              {workspace.owner_name && (
                <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                  Created by <strong style={{ color: 'var(--text-primary)' }}>{workspace.owner_name}</strong>
                </span>
              )}
            </div>
            {workspace.description && <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem', maxWidth: '600px', lineHeight: 1.5 }}>{workspace.description}</p>}
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {workspace.category && (
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', textTransform: 'uppercase' }}>
                  {workspace.category}
                </span>
              )}
              {workspace.visibility && (
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {workspace.visibility}
                </span>
              )}
              {workspace.createdAt && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <CalendarDays size={14} /> Created {new Date(workspace.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Any workspace member can link projects and add contributors */}
            {isMember && activeTab === 'projects' && (
              <button onClick={() => setShowProjectModal(true)} className="tf-btn tf-btn-primary">
                + Link Project
              </button>
            )}
            {isMember && activeTab === 'contributors' && (
              <button onClick={() => setShowMemberModal(true)} className="tf-btn tf-btn-primary">
                + Add Contributor
              </button>
            )}
            {/* Only workspace admins (owner, workspace-level admin, or global admin) can edit/delete */}
            {isAdmin && (
              <>
                <button onClick={() => setShowEditModal(true)} className="tf-btn tf-btn-ghost">
                  Edit
                </button>
                <button onClick={handleDeleteWorkspace} className="tf-btn tf-btn-danger">
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
        {['projects', 'contributors'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', padding: '0.75rem 1rem', fontSize: '0.95rem',
              fontWeight: activeTab === tab ? 700 : 500, color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              fontFamily: 'inherit', textTransform: 'capitalize', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'projects' && (
        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {workspace.projects?.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
              No projects in this workspace yet.
            </div>
          ) : (
            workspace.projects?.map(p => (
              <ProjectCard 
                key={p.id} 
                project={p} 
                onClick={() => navigate(`/workspaces/${workspace.id}/projects/${p.id}`)} 
                onUnlink={isAdmin ? handleUnlinkProject : null}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'contributors' && (
        <div className="glass-card mobile-scroll-x" style={{ padding: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Role</th>
                {isAdmin && <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {workspace.members?.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar name={m.name} size={32} />
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{m.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px',
                      background: m.workspace_role === 'admin' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.08)',
                      color: m.workspace_role === 'admin' ? 'var(--accent)' : 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      {m.workspace_role}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {(workspace.owner_id !== m.id) && (m.id !== user.id) && (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => changeMemberRole(m.id, m.workspace_role === 'admin' ? 'member' : 'admin')} 
                            className="tf-btn tf-btn-ghost" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            Make {m.workspace_role === 'admin' ? 'Member' : 'Admin'}
                          </button>
                          <button onClick={() => removeMember(m.id)} className="tf-btn tf-btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showProjectModal && <LinkProjectModal workspaceId={workspace.id} currentProjects={workspace.projects} onClose={() => setShowProjectModal(false)} onLinked={load} />}
      {showMemberModal && <AddMemberModal workspace={workspace} allUsers={allUsers} onClose={() => setShowMemberModal(false)} onAdded={load} />}
      {showEditModal && <EditWorkspaceModal workspace={workspace} onClose={() => setShowEditModal(false)} onUpdated={load} />}
    </div>
  );
}
