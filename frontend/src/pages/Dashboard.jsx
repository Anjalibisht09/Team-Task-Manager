import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import { ClipboardList, RefreshCw, Eye, CheckCircle2, AlertTriangle, Building2, Clock, Flame, PartyPopper } from 'lucide-react';

/* ---- Helpers ---- */
const STATUS_COLORS = {
  todo:        { color: 'var(--todo)',       glow: 'var(--todo-glow)' },
  'in-progress':{ color: 'var(--inprogress)', glow: 'var(--inprogress-glow)' },
  review:      { color: 'var(--review)',     glow: 'var(--review-glow)' },
  done:        { color: 'var(--done)',       glow: 'var(--done-glow)' },
};
const PRIORITY_COLOR = { low: 'var(--low)', medium: 'var(--medium)', high: 'var(--high)', critical: 'var(--critical)' };

function StatCard({ label, value, color, glow, icon, delay }) {
  return (
    <div style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${color}30`,
      borderRadius: 'var(--radius)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      opacity: 0,
      animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s forwards`,
      boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 0 60px ${glow}10`,
    }}>
      {/* Glow strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <div style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{icon}</div>
      <div style={{ fontSize: '2.25rem', fontWeight: 800, color, lineHeight: 1, marginBottom: '0.3rem' }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );
}

function TaskRow({ task, onClick }) {
  const today = new Date().toISOString().split('T')[0];
  const overdue = task.due_date && task.due_date < today && task.status !== 'done';
  const sc = STATUS_COLORS[task.status] || { color: '#ccc', glow: 'transparent' };
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.875rem 1rem', borderRadius: '10px', cursor: 'pointer',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : 'var(--glass-border)'}`,
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'var(--glass-border-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = overdue ? 'rgba(239,68,68,0.3)' : 'var(--glass-border)'; }}
    >
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
        background: sc.color, boxShadow: `0 0 8px ${sc.glow}`,
      }} />
      <span style={{ flex: 1, fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{task.title}</span>
      {task.project_name && (
        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px' }}>
          {task.project_name}
        </span>
      )}
      <span style={{
        fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', textTransform: 'uppercase',
        background: PRIORITY_COLOR[task.priority] + '20', color: PRIORITY_COLOR[task.priority],
      }}>{task.priority}</span>
      {overdue && (
        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
          OVERDUE
        </span>
      )}
    </div>
  );
}

function SectionPanel({ title, titleColor, children, delay }) {
  return (
    <div style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius)',
      padding: '1.5rem',
      opacity: 0,
      animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s forwards`,
    }}>
      <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: titleColor || 'var(--text-primary)', fontSize: '0.95rem' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const { user } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data));
  }, []);

  if (!data) return (
    <div style={{ padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius)' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton" style={{ height: '280px', borderRadius: 'var(--radius)' }} />)}
        </div>
      </div>
    </div>
  );

  const { stats, recentTasks, overdueTasks, workspaceCount } = data;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem' }}>

      {/* Welcome header */}
      <div style={{ marginBottom: '2rem', opacity: 0, animation: 'fadeUp 0.4s ease forwards' }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Welcome back, <span style={{ color: 'var(--accent)' }}>{user?.name?.split(' ')[0]}</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
          Here's a snapshot of your workspace
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Tasks"  value={stats.total}      color="var(--accent)"      glow="var(--accent-glow)"      icon={<ClipboardList size={24} color="var(--accent)" />} delay={0.05} />
        <StatCard label="In Progress"  value={stats.inProgress} color="var(--inprogress)"  glow="var(--inprogress-glow)"  icon={<RefreshCw size={24} color="var(--inprogress)" />} delay={0.1}  />
        <StatCard label="In Review"    value={stats.review}     color="var(--review)"      glow="var(--review-glow)"      icon={<Eye size={24} color="var(--review)" />} delay={0.15} />
        <StatCard label="Completed"    value={stats.done}       color="var(--done)"        glow="var(--done-glow)"        icon={<CheckCircle2 size={24} color="var(--done)" />} delay={0.2}  />
        <StatCard label="Overdue"      value={stats.overdue}    color="var(--high)"        glow="rgba(239,68,68,0.3)"     icon={<AlertTriangle size={24} color="var(--high)" />} delay={0.25} />
        <StatCard label="Workspaces"     value={workspaceCount}     color="#a78bfa"            glow="rgba(167,139,250,0.3)"   icon={<Building2 size={24} color="#a78bfa" />} delay={0.3}  />
      </div>

      {/* Task panels */}
      <div className="mobile-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <SectionPanel title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> Recent Tasks</div>} delay={0.35}>
          {recentTasks.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No tasks yet. Join a project to get started.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentTasks.map(t => (
                  <TaskRow key={t.id} task={t} onClick={() => navigate(`/workspaces/${t.workspace_id}/projects/${t.project_id}`)} />
                ))}
              </div>
          }
        </SectionPanel>

        <SectionPanel title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Flame size={16} /> Overdue Tasks</div>} titleColor="#fca5a5" delay={0.4}>
          {overdueTasks.length === 0
            ? <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.875rem' }}><PartyPopper size={14} /> No overdue tasks! You're on track.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {overdueTasks.map(t => (
                  <TaskRow key={t.id} task={t} onClick={() => navigate(`/workspaces/${t.workspace_id}/projects/${t.project_id}`)} />
                ))}
              </div>
          }
        </SectionPanel>
      </div>
    </div>
  );
}
