import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Register() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('member');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - var(--nav-height, 0px))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: '460px' }}>
        <div className="modal-panel" style={{ padding: '2.5rem 2.5rem' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', margin: '0 auto 1rem',
              boxShadow: '0 8px 30px var(--accent-glow)',
            }}>🚀</div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Create account
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '0.875rem' }}>
              Join TaskFlow and start collaborating
            </p>
          </div>

          {error && <div className="tf-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

          <form onSubmit={submit}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="tf-label" htmlFor="reg-name">Full name</label>
              <input
                id="reg-name"
                className="tf-input"
                type="text"
                placeholder="Alex Johnson"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="tf-label" htmlFor="reg-email">Email address</label>
              <input
                id="reg-email"
                className="tf-input"
                type="email"
                placeholder="alex@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="tf-label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                className="tf-input"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Role selector */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="tf-label">Account role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {[
                  { val: 'member', icon: '👤', label: 'Member', desc: 'Contribute to projects' },
                  { val: 'admin',  icon: '👑', label: 'Admin',  desc: 'Manage everything' },
                ].map(r => (
                  <button
                    key={r.val}
                    type="button"
                    id={`role-${r.val}`}
                    onClick={() => setRole(r.val)}
                    style={{
                      padding: '12px', borderRadius: '10px', cursor: 'pointer',
                      background: role === r.val ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                      border: role === r.val ? '1.5px solid var(--accent)' : '1px solid var(--glass-border)',
                      color: role === r.val ? 'var(--text-primary)' : 'var(--text-secondary)',
                      textAlign: 'left', transition: 'all 0.2s', fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{r.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{r.label}</div>
                    <div style={{ fontSize: '0.73rem', opacity: 0.7, marginTop: '2px' }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              className="tf-btn tf-btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '13px', fontSize: '1rem' }}
            >
              {loading ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Creating account...
                </>
              ) : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
