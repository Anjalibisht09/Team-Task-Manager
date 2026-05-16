import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workspaces from './pages/Workspaces';
import WorkspaceDetail from './pages/WorkspaceDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import api from './api';
import './index.css';

/* ---- Global Search ---- */
function GlobalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const search = useCallback((q) => {
    if (!q.trim()) { setResults(null); setOpen(false); return; }
    setLoading(true);
    api.get(`/search?q=${encodeURIComponent(q)}`)
      .then(r => { setResults(r.data); setOpen(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults(null); setOpen(false); return; }
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--glass-border)', borderRadius: '8px',
            padding: '8px 12px 8px 34px', fontSize: '0.85rem',
            fontFamily: 'inherit', color: 'var(--text-primary)', outline: 'none',
            transition: 'all 0.2s',
          }}
          onFocusCapture={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
          onBlurCapture={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
        />
        {loading && <div className="tf-spinner" style={{ width: 14, height: 14, borderWidth: 2, position: 'absolute', right: 12 }} />}
      </div>

      {open && results && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 300,
          background: '#0f0f0f', backdropFilter: 'blur(24px)',
          border: '1px solid var(--glass-border)', borderRadius: '10px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)', overflow: 'hidden',
        }}>
          {results.workspaces.length === 0 && results.projects.length === 0 ? (
            <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No results found.</div>
          ) : (
            <>
              {results.workspaces.length > 0 && (
                <div>
                  <div style={{ padding: '8px 14px 4px', fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Workspaces</div>
                  {results.workspaces.map(w => (
                    <div key={w.id} onClick={() => { navigate(`/workspaces/${w.id}`); setQuery(''); setOpen(false); }}
                      style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{w.name}</div>
                    </div>
                  ))}
                </div>
              )}
              {results.projects.length > 0 && (
                <div>
                  <div style={{ padding: '8px 14px 4px', fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Projects</div>
                  {results.projects.map(p => (
                    <div key={p.id} onClick={() => { navigate(`/projects/${p.id}`); setQuery(''); setOpen(false); }}
                      style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{p.status} · {p.priority}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Nav Item ---- */
function NavItem({ to, icon, label, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '9px 12px', borderRadius: '7px',
      textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
      background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
      borderLeft: isActive ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
      transition: 'all 0.15s',
      marginLeft: '-2px',
    })}
      onMouseEnter={e => { if (!e.currentTarget.style.borderLeftColor.includes('0.6')) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}}
      onMouseLeave={e => { const active = e.currentTarget.getAttribute('aria-current') === 'page'; if (!active) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}}
    >
      <span style={{ opacity: 0.8, display: 'flex' }}>{icon}</span>
      {label}
    </NavLink>
  );
}

/* ---- Left Sidebar ---- */
function Sidebar({ isOpen, toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {isOpen && <div onClick={toggleSidebar} style={{
        display: 'none', position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 99,
      }} className="sidebar-overlay" />}

      <aside className={`tf-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '7px',
              background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', flexShrink: 0,
            }}>⚡</div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Task<span style={{ color: 'rgba(255,255,255,0.5)' }}>Flow</span>
            </span>
          </div>
          <button className="mobile-only close-sidebar" onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Nav sections */}
        <div style={{ flex: 1, padding: '1rem 1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px', paddingLeft: '12px' }}>
              Main
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <NavItem to="/dashboard" label="Dashboard" onClick={toggleSidebar} icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              } />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px', paddingLeft: '12px' }}>
              Workspace
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <NavItem to="/workspaces" label="Workspaces" onClick={toggleSidebar} icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
              } />
              <NavItem to="/projects" label="Projects" onClick={toggleSidebar} icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              } />
            </div>
          </div>
        </div>

        {/* User footer */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)',
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{user.role}</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            width: '100%', padding: '8px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--glass-border)', borderRadius: '7px',
            color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

/* ---- Top Header Bar ---- */
function TopBar({ toggleSidebar }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;

  // Derive page title from pathname
  const pathMap = {
    '/dashboard': 'Dashboard',
    '/workspaces': 'Workspaces',
    '/projects': 'Projects',
  };
  const title = pathMap[location.pathname] || (location.pathname.includes('/projects/') ? 'Project' : location.pathname.includes('/workspaces/') ? 'Workspace' : '');

  return (
    <div style={{
      height: '56px', display: 'flex', alignItems: 'center',
      padding: '0 1.5rem', gap: '1rem',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--glass-border)',
      position: 'sticky', top: 0, zIndex: 89, flexShrink: 0,
    }}>
      {/* Mobile hamburger */}
      <button onClick={toggleSidebar} className="mobile-only" style={{
        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      {/* Page title */}
      {title && (
        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }} className="desktop-only">
          {title}
        </span>
      )}
      {title && <div style={{ width: '1px', height: '16px', background: 'var(--glass-border)', flexShrink: 0 }} className="desktop-only" />}

      {/* Search */}
      <div style={{ flex: 1 }}><GlobalSearch /></div>

      {/* Right: notification bell placeholder + user pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
          title="Notifications"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '4px 10px 4px 4px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
        }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)',
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name.split(' ')[0]}
          </span>
        </div>
      </div>
    </div>
  );
}

function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="tf-spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</p>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

/* ---- App Layout ---- */
function AppLayout({ children }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggle = () => setSidebarOpen(p => !p);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#000', position: 'relative' }}>
      {user && <Sidebar isOpen={sidebarOpen} toggleSidebar={toggle} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {user && <TopBar toggleSidebar={toggle} />}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          {/* subtle grid overlay */}
          <div style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/login"       element={<Login />} />
            <Route path="/register"    element={<Register />} />
            <Route path="/dashboard"   element={<Guard><Dashboard /></Guard>} />
            <Route path="/workspaces"  element={<Guard><Workspaces /></Guard>} />
            <Route path="/workspaces/:id" element={<Guard><WorkspaceDetail /></Guard>} />
            <Route path="/projects"    element={<Guard><Projects /></Guard>} />
            <Route path="/projects/:id" element={<Guard><ProjectDetail /></Guard>} />
            <Route path="/workspaces/:workspaceId/projects/:id" element={<Guard><ProjectDetail /></Guard>} />
            <Route path="*"            element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
