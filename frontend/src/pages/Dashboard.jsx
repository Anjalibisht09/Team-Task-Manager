import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import {
  ClipboardList, RefreshCw, Eye, CheckCircle2,
  AlertTriangle, Building2, Clock, Flame,
  PartyPopper, ArrowUpRight, TrendingUp, TrendingDown, LayoutDashboard, CalendarDays
} from 'lucide-react';

const STATUS_COLORS = {
  todo:          { color: '#94a3b8', glow: 'rgba(148,163,184,0.2)' },
  'in-progress': { color: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
  review:        { color: '#3b82f6', glow: 'rgba(59,130,246,0.2)' },
  done:          { color: '#10b981', glow: 'rgba(16,185,129,0.2)' },
};
const PRIORITY_COLOR = {
  low: '#64748b', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626',
};

/* ---- Stat Card ---- */
function StatCard({ label, value, icon, color, delay, trend }) {
  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '10px',
      padding: '1.25rem 1.5rem',
      opacity: 0,
      animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}s forwards`,
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
      position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: '1.5rem', right: '1.5rem', height: '1px', background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '8px',
          background: `${color}12`, border: `1px solid ${color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: trend >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

/* ---- Task Row ---- */
function TaskRow({ task, onClick }) {
  const today = new Date().toISOString().split('T')[0];
  const overdue = task.due_date && task.due_date < today && task.status !== 'done';
  const sc = STATUS_COLORS[task.status] || { color: '#666', glow: 'transparent' };

  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
      border: `1px solid ${overdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)'}`,
      background: overdue ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = overdue ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = overdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)'; }}
    >
      {/* Status dot */}
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: sc.color }} />

      {/* Title */}
      <span style={{ flex: 1, fontWeight: 400, fontSize: '0.87rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {task.title}
      </span>

      {/* Project tag */}
      {task.project_name && (
        <span style={{
          fontSize: '0.7rem', color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: '4px',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {task.project_name}
        </span>
      )}

      {/* Priority */}
      <span style={{
        fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
        background: `${PRIORITY_COLOR[task.priority]}18`, color: PRIORITY_COLOR[task.priority],
        textTransform: 'uppercase', letterSpacing: '0.3px', flexShrink: 0,
      }}>{task.priority}</span>

      {overdue && (
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
          background: 'rgba(239,68,68,0.12)', color: '#fca5a5',
          textTransform: 'uppercase', letterSpacing: '0.3px', flexShrink: 0,
        }}>Overdue</span>
      )}
    </div>
  );
}

/* ---- Panel ---- */
function Panel({ title, subtitle, children, action, delay }) {
  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '10px',
      opacity: 0,
      animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}s forwards`,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {/* Panel body */}
      <div style={{ padding: '1rem 1.25rem', flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

/* ---- Mini Bar ---- */
function MiniBar({ label, value, color, total }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

/* ---- Activity Graph ---- */
function ActivityGraph({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.completed), 1);
  const height = 140;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: `${height}px`, marginTop: '1rem', paddingBottom: '20px', position: 'relative' }}>
      {/* Y-axis grid lines */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, borderBottom: '1px dashed rgba(255,255,255,0.05)', height: '0px' }} />
      <div style={{ position: 'absolute', top: `${height / 2}px`, left: 0, right: 0, borderBottom: '1px dashed rgba(255,255,255,0.05)', height: '0px' }} />
      <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, borderBottom: '1px dashed rgba(255,255,255,0.1)', height: '0px' }} />

      {data.map((d, i) => {
        const barHeight = (d.completed / maxVal) * (height - 20); // 20px padding for labels
        return (
          <div key={i} className="activity-bar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 1 }}>
            <div className="bar-fill" style={{
              width: '100%', maxWidth: '32px',
              height: `${Math.max(barHeight, 4)}px`,
              background: d.completed > 0 ? 'linear-gradient(180deg, #10b981 0%, rgba(16,185,129,0.3) 100%)' : 'rgba(255,255,255,0.05)',
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.6s cubic-bezier(0.16,1,0.3,1), filter 0.2s',
            }}>
              <div className="bar-tooltip" style={{
                position: 'absolute', top: '-28px', left: '50%', transform: 'translateX(-50%)',
                background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)',
                padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem',
                color: 'white', opacity: 0, transition: 'all 0.2s', pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}>
                {d.completed} task{d.completed !== 1 ? 's' : ''}
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>
              {d.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Status Progress Bar ---- */
function ProgressBar({ stats }) {
  const total = stats.total || 1;
  const segments = [
    { key: 'done',       value: stats.done,       color: '#10b981', label: 'Done' },
    { key: 'review',     value: stats.review,     color: '#3b82f6', label: 'Review' },
    { key: 'inProgress', value: stats.inProgress, color: '#f59e0b', label: 'In Progress' },
  ];
  const remaining = Math.max(0, total - stats.done - stats.review - stats.inProgress);

  return (
    <div>
      <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)', marginBottom: '12px' }}>
        {segments.map(s => (
          <div key={s.key} style={{
            width: `${(s.value / total) * 100}%`,
            background: s.color,
            transition: 'width 0.6s ease',
          }} />
        ))}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {segments.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.value}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Todo</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{remaining}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data));
  }, []);

  if (!data) return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '96px', borderRadius: '10px' }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        <div className="skeleton" style={{ height: '400px', borderRadius: '10px' }} />
        <div className="skeleton" style={{ height: '400px', borderRadius: '10px' }} />
      </div>
    </div>
  );

  const { stats, recentTasks, overdueTasks, upcomingTasks, priorityStats, projectStats, activityData, workspaceCount } = data;

  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const pendingTasksCount = stats.total - stats.done;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem', opacity: 0, animation: 'fadeUp 0.35s ease forwards' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600, marginBottom: '4px' }}>
              {greeting}
            </p>
            <h1 style={{ fontWeight: 800, fontSize: '1.65rem', color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              {user?.name?.split(' ')[0]}'s Workspace
            </h1>
          </div>
          {/* Completion pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '8px',
            background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: completionPct >= 70 ? '#10b981' : completionPct >= 40 ? '#f59e0b' : '#94a3b8' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {completionPct}% completed
            </span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total Tasks"  value={stats.total}      color="#ffffff"   icon={<ClipboardList size={16} color="#ffffff" />} delay={0.05} />
        <StatCard label="In Progress"  value={stats.inProgress} color="#f59e0b"   icon={<RefreshCw size={16} color="#f59e0b" />}    delay={0.10} />
        <StatCard label="In Review"    value={stats.review}     color="#3b82f6"   icon={<Eye size={16} color="#3b82f6" />}          delay={0.15} />
        <StatCard label="Completed"    value={stats.done}       color="#10b981"   icon={<CheckCircle2 size={16} color="#10b981" />} delay={0.20} trend={stats.completionTrend} />
        <StatCard label="Overdue"      value={stats.overdue}    color="#ef4444"   icon={<AlertTriangle size={16} color="#ef4444" />} delay={0.25} />
        <StatCard label="Workspaces"   value={workspaceCount}   color="#a78bfa"   icon={<Building2 size={16} color="#a78bfa" />}   delay={0.30} />
      </div>

      <div className="mobile-col" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <Panel
            title="Weekly Activity"
            subtitle="Tasks completed over the last 7 days"
            delay={0.32}
          >
            <ActivityGraph data={activityData} />
          </Panel>

          <Panel
            title="Upcoming Deadlines"
            subtitle="Tasks due in the next 7 days"
            delay={0.35}
            action={upcomingTasks.length > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{upcomingTasks.length} upcoming</span>}
          >
            {upcomingTasks.length === 0
              ? <p style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <CalendarDays size={14} /> No upcoming deadlines.
                </p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {upcomingTasks.map(t => (
                    <TaskRow key={t.id} task={t} onClick={() => navigate(`/workspaces/${t.workspace_id}/projects/${t.project_id}`)} />
                  ))}
                </div>
            }
          </Panel>

          <Panel
            title="Recent Tasks"
            subtitle="Latest tasks assigned to you"
            delay={0.4}
            action={
              <button onClick={() => navigate('/projects')} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 500, fontFamily: 'inherit', padding: '4px 6px', borderRadius: '6px',
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                View all <ArrowUpRight size={12} />
              </button>
            }
          >
            {recentTasks.length === 0
              ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No tasks yet. Join a project to get started.</p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {recentTasks.map(t => (
                    <TaskRow key={t.id} task={t} onClick={() => navigate(`/workspaces/${t.workspace_id}/projects/${t.project_id}`)} />
                  ))}
                </div>
            }
          </Panel>

          {overdueTasks.length > 0 && (
            <Panel
              title="Overdue Tasks"
              subtitle={`${overdueTasks.length} task${overdueTasks.length !== 1 ? 's' : ''} past due date`}
              delay={0.45}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {overdueTasks.map(t => (
                  <TaskRow key={t.id} task={t} onClick={() => navigate(`/workspaces/${t.workspace_id}/projects/${t.project_id}`)} />
                ))}
              </div>
            </Panel>
          )}

        </div>

        {/* Right Column: Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{
            background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '1.25rem 1.5rem',
            opacity: 0, animation: 'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.35s forwards',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Task Progress</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Overall completion</div>
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{completionPct}%</span>
            </div>
            <ProgressBar stats={stats} />
          </div>

          <Panel title="Priority Breakdown" subtitle="Pending tasks by urgency" delay={0.4}>
            <MiniBar label="Critical" value={priorityStats.critical} color="#dc2626" total={pendingTasksCount} />
            <MiniBar label="High" value={priorityStats.high} color="#ef4444" total={pendingTasksCount} />
            <MiniBar label="Medium" value={priorityStats.medium} color="#f59e0b" total={pendingTasksCount} />
            <MiniBar label="Low" value={priorityStats.low} color="#64748b" total={pendingTasksCount} />
          </Panel>

          <Panel title="Project Portfolio" subtitle="Your active projects overview" delay={0.45}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <LayoutDashboard size={28} color="var(--text-muted)" style={{ opacity: 0.5 }} />
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{projectStats.total}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Projects</div>
              </div>
            </div>
            <MiniBar label="Active" value={projectStats.active} color="#3b82f6" total={projectStats.total} />
            <MiniBar label="Completed" value={projectStats.completed} color="#10b981" total={projectStats.total} />
            <MiniBar label="On Hold" value={projectStats.onHold} color="#f59e0b" total={projectStats.total} />
          </Panel>

        </div>
      </div>
    </div>
  );
}
