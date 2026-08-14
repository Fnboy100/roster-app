import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const errorBoxStyle = {
  background: '#fef2f2',
  border: '1.5px solid #fecaca',
  color: '#b91c1c',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  marginBottom: 14,
};

const successBoxStyle = {
  background: '#f0fdf4',
  border: '1.5px solid #bbf7d0',
  color: '#15803d',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  marginBottom: 14,
};

const submitButtonStyle = (submitting) => ({
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
});

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Step 1: request a code. Step 2: enter the code + new password. Kept as
  // one page/one flow (rather than two routes) since the email the code
  // was sent to needs to carry over exactly as typed.
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      const { message } = await authApi.forgotPassword(email.trim());
      setInfo(message);
      setStep('reset');
    } catch (err) {
      // The backend returns a generic message for "no such account" (by
      // design — see app/routers/auth.py) so an error here only ever means
      // a real problem: rate limiting, or the mail server itself failing.
      setError(apiErrorMessage(err, 'Could not send the verification code. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
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
      const { message } = await authApi.resetPassword({ email: email.trim(), code, newPassword });
      setInfo(message);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not reset your password.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      const { message } = await authApi.forgotPassword(email.trim());
      setInfo(message);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not resend the code. Please try again.'));
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
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          borderRadius: 14,
          padding: '32px 28px',
          boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>
          Restaurant Operations
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
          {step === 'request' ? 'Forgot password' : 'Enter your code'}
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
          {step === 'request'
            ? "Enter your account email and we'll send a 6-digit verification code."
            : `We sent a 6-digit code to ${email}. Enter it below along with your new password.`}
        </p>

        {error && <div style={errorBoxStyle}>{error}</div>}
        {info && <div style={successBoxStyle}>{info}</div>}

        {step === 'request' ? (
          <form onSubmit={handleRequestCode}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              autoComplete="username"
              required
            />
            <button type="submit" disabled={submitting} style={submitButtonStyle(submitting)}>
              {submitting ? 'Sending…' : 'Send verification code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <label style={labelStyle}>Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ ...inputStyle, letterSpacing: 4, textAlign: 'center', fontSize: 18 }}
              placeholder="123456"
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

            <button type="submit" disabled={submitting} style={submitButtonStyle(submitting)}>
              {submitting ? 'Resetting…' : 'Reset password'}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={submitting}
              style={{ width: '100%', background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, padding: '10px 0', cursor: submitting ? 'default' : 'pointer' }}
            >
              Didn't get a code? Resend
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Link to="/login" style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textDecoration: 'none' }}>
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
