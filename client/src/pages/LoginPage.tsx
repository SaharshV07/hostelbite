import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, LogIn, Key, Mail, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('student@muj.manipal.edu');
  const [password, setPassword] = useState<string>('Student@123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFastDemoLogin = async (role: any, outlet?: string) => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin(role, outlet);
      if (role === 'student') navigate('/');
      else if (role === 'vendor') navigate('/vendor');
      else if (role === 'delivery') navigate('/delivery');
      else if (role === 'admin') navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          marginBottom: '0.75rem'
        }}>
          <UtensilsCrossed size={28} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>HostelBite Login</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Hostel Food Delivery Application &bull; Manipal University Jaipur
        </p>
      </div>

      {/* 1. Fast 1-Click Academic Demo Credentials Bar */}
      <div className="card" style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
          <UserCheck size={16} color="var(--primary)" />
          <strong style={{ fontSize: '0.85rem' }}>Academic Demo 1-Click Fast Logins</strong>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Instantly authenticate as any role without entering credentials:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleFastDemoLogin('student')}
            style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
          >
            &bull; Student (Saharsh)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleFastDemoLogin('vendor', 'mess')}
            style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
          >
            &bull; Mess Manager
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleFastDemoLogin('vendor', 'munchbox')}
            style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
          >
            &bull; Vendor (Munch Box)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleFastDemoLogin('delivery')}
            style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
          >
            &bull; Delivery Courier
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleFastDemoLogin('admin')}
            style={{ fontSize: '0.75rem', gridColumn: 'span 2', justifyContent: 'flex-start', color: '#6b21a8' }}
          >
            &bull; Hostel Administrator (Chief Warden)
          </button>
        </div>
      </div>

      {/* 2. Manual Login Form */}
      <div className="card">
        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            color: '#b91c1c',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">University Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', top: '12px', left: '10px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '2.2rem' }}
                required
                placeholder="e.g. student@muj.manipal.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', top: '12px', left: '10px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '2.2rem' }}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.7rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to HostelBite'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.25rem', paddingTop: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an account yet? </span>
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Register as Student / Vendor
          </Link>
        </div>
      </div>
    </div>
  );
};
