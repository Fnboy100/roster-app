import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth';
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

const labelStyle = { fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 };

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      setSuccess('Password changed. Use your new password next time you log in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not change your password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: '40px auto', padding: '0 16px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 18 }}
      >
        &larr; Back
      </button>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>
        Account
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Change Password</h1>

      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 14, padding: '24px 22px', border: '1px solid #e2e8f0' }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 14 }}>
            {success}
          </div>
        )}

        <label style={labelStyle}>Current password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          style={inputStyle}
          autoComplete="current-password"
          required
        />

        <label style={labelStyle}>New password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={inputStyle}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <label style={labelStyle}>Confirm new password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle}
          autoComplete="new-password"
          minLength={8}
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
          {submitting ? 'Changing…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
