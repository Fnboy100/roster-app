import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1.5px solid #e2e8f0',
  fontSize: 14,
  marginBottom: 14,
  boxSizing: 'border-box',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/roster';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      // The backend returns 429 (rate limited) or 401 (bad credentials) —
      // apiErrorMessage surfaces either's `detail` message directly.
      setError(apiErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#fff',
          borderRadius: 14,
          padding: '32px 28px',
          boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>
          Restaurant Operations
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Sign in</h1>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              color: '#b91c1c',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          autoComplete="username"
          required
        />

        <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '11px 0',
            borderRadius: 8,
            border: 'none',
            background: submitting ? '#94a3b8' : '#0f172a',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: submitting ? 'default' : 'pointer',
            marginTop: 4,
          }}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
