import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
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


/* ---- Floating orbs background ---- */
function Background() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', width: '600px', height: '600px',
        borderRadius: '50%', top: '-200px', left: '-150px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute', width: '500px', height: '500px',
        borderRadius: '50%', bottom: '-100px', right: '-100px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute', width: '300px', height: '300px',
        borderRadius: '50%', top: '40%', left: '60%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        filter: 'blur(30px)',
        animation: 'float 8s ease-in-out infinite',
      }} />
    </div>
  );
}

/* ---- Global Search Bar ---- */
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
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="tf-input"
          placeholder="Search workspaces &amp; projects..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          style={{ paddingLeft: '36px', paddingRight: loading ? '36px' : '12px', fontSize: '0.875rem' }}
        />
        {loading && (
          <div className="tf-spinner" style={{ width: 16, height: 16, borderWidth: 2, position: 'absolute', right: 12 }} />
        )}
      </div>

      {open && results && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 300,
          background: 'rgba(12, 12, 35, 0.97)', backdropFilter: 'blur(24px)',
          border: '1px solid var(--glass-border)', borderRadius: '12px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)', overflow: 'hidden',
        }}>
          {results.workspaces.length === 0 && results.projects.length === 0 ? (
            <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No results found.</div>
          ) : (
            <>
              {results.workspaces.length > 0 && (
                <div>
                  <div style={{ padding: '8px 14px 4px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Workspaces</div>
                  {results.workspaces.map(w => (
                    <div key={w.id} onClick={() => { navigate(`/workspaces/${w.id}`); setQuery(''); setOpen(false); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{w.name}</div>
                        {w.description && <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{w.description.slice(0,60)}{w.description.length > 60 ? '…' : ''}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {results.projects.length > 0 && (
                <div>
                  <div style={{ padding: '8px 14px 4px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Projects</div>
                  {results.projects.map(p => (
                    <div key={p.id} onClick={() => { navigate(`/projects/${p.id}`); setQuery(''); setOpen(false); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{p.status} · {p.priority}</div>
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

/* ---- Left Sidebar ---- */
function Sidebar({ isOpen, toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const roleColor = user.role === 'admin' ? 'var(--accent)' : 'var(--done)';
  
  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.95rem',
    textDecoration: 'none',
    padding: '12px 16px',
    borderRadius: '8px',
    background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
    border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}
      
      <aside className={`tf-sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', boxShadow: '0 4px 12px var(--accent-glow)',
            }}>⚡</div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Task<span style={{ color: 'var(--accent)' }}>Flow</span>
            </span>
          </div>
          <button className="mobile-only close-sidebar" onClick={toggleSidebar}>×</button>
        </div>

        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink to="/dashboard" style={navLinkStyle} onClick={toggleSidebar}>
            <span>🏠</span> Dashboard
          </NavLink>
          <NavLink to="/workspaces" style={navLinkStyle} onClick={toggleSidebar}>
            <span>🏢</span> Workspaces
          </NavLink>
          <NavLink to="/projects" style={navLinkStyle} onClick={toggleSidebar}>
            <span>📁</span> Projects
          </NavLink>
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: '10px', padding: '10px', marginBottom: '1rem'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: `linear-gradient(135deg, var(--accent), var(--accent-2))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', fontWeight: 700, color: 'white', flexShrink: 0
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.name}
              </div>
              <div style={{
                fontSize: '0.65rem', fontWeight: 700,
                color: roleColor, textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {user.role}
              </div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="tf-btn tf-btn-ghost"
            style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

/* ---- Mobile Top Bar ---- */
function MobileTopBar({ toggleSidebar }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="mobile-topbar" style={{
      display: 'none', flexDirection: 'column', gap: '8px',
      padding: '0.75rem 1rem',
      background: 'rgba(6, 9, 24, 0.9)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, zIndex: 90
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>
          ☰
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          Task<span style={{ color: 'var(--accent)' }}>Flow</span>
        </div>
        <div style={{ width: '24px' }} />
      </div>
      <GlobalSearch />
    </div>
  );
}

function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="tf-spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading workspace...</p>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

/* ---- App Layout wrapper ---- */
function AppLayout({ children }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggle = () => setSidebarOpen(p => !p);

  return (
    <div className="app-bg" style={{ position: 'relative', display: 'flex', minHeight: '100vh' }}>
      <Background />
      {user && <Sidebar isOpen={sidebarOpen} toggleSidebar={toggle} />}
      <div style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile topbar (shown on small screens) */}
        {user && <MobileTopBar toggleSidebar={toggle} />}
        {/* Desktop search strip (hidden on mobile, handled by MobileTopBar) */}
        {user && (
          <div className="desktop-search-bar" style={{
            padding: '0.875rem 2rem',
            background: 'rgba(6,9,24,0.6)', backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', gap: '1rem',
            position: 'sticky', top: 0, zIndex: 89
          }}>
            <GlobalSearch />
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
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
