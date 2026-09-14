import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Sprout, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export function LoginForm() {
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [phone, setPhone] = useState('+919876543210');
  const [password, setPassword] = useState('password123');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginWithOtp } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      setError('');
      setLoading(true);
      await api.sendOtp(phone);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'password') {
        await login(phone, password);
      } else {
        await loginWithOtp(phone, otp);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
            <Sprout size={28} />
          </div>
          <h2>Welcome back to KrishiSetu</h2>
          <p>Login to your decentralized agricultural marketplace</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-tabs">
          <button
            className={mode === 'password' ? 'active' : ''}
            onClick={() => { setMode('password'); setError(''); }}
            type="button"
          >
            Password
          </button>
          <button
            className={mode === 'otp' ? 'active' : ''}
            onClick={() => { setMode('otp'); setError(''); }}
            type="button"
          >
            Fast OTP
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Phone Number</span>
            <div className="input-wrap">
              <Phone size={18} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                required
              />
            </div>
          </label>

          {mode === 'password' ? (
            <label>
              <span>Password</span>
              <div className="input-wrap">
                <Lock size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </label>
          ) : (
            <label>
              <span>Enter 4-Digit OTP</span>
              <div className="input-wrap" style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="1234"
                  maxLength={6}
                  disabled={!otpSent}
                  required
                />
                {!otpSent ? (
                  <button
                    type="button"
                    className="outline-button"
                    onClick={handleSendOtp}
                    disabled={loading || !phone}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Send OTP
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Resend
                  </button>
                )}
              </div>
            </label>
          )}

          <button type="submit" className="primary-button submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
          </button>

          <div className="auth-footer">
            <p>
              Don't have an account? <Link to="/register">Create farmer or buyer account</Link>
            </p>
            <div className="secure-badge">
              <ShieldCheck size={16} /> 256-bit Encrypted Session
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
