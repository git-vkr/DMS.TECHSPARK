import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Sprout, Phone, Lock, User, ArrowRight, ShieldCheck, Globe } from 'lucide-react';

export function RegisterForm() {
  const [role, setRole] = useState<'farmer' | 'buyer'>('farmer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('hi');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        name,
        phone,
        password,
        role,
        language,
        email: email || undefined,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
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
          <h2>Join KrishiSetu</h2>
          <p>Register as a direct producer or verified buyer</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-tabs role-selector">
          <button
            className={role === 'farmer' ? 'active' : ''}
            onClick={() => setRole('farmer')}
            type="button"
          >
            🌾 Farmer / FPO
          </button>
          <button
            className={role === 'buyer' ? 'active' : ''}
            onClick={() => setRole('buyer')}
            type="button"
          >
            🛒 Buyer / Business
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Full Name</span>
            <div className="input-wrap">
              <User size={18} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'farmer' ? 'Ramesh Kumar' : 'Ananya / Shakti Foods'}
                required
              />
            </div>
          </label>

          <label>
            <span>Phone Number (+91 format)</span>
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

          <label>
            <span>Create Password</span>
            <div className="input-wrap">
              <Lock size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                minLength={6}
                required
              />
            </div>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>
              <span>Preferred Language</span>
              <div className="input-wrap">
                <Globe size={18} />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none' }}
                >
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="en">English</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                </select>
              </div>
            </label>

            <label>
              <span>Email (Optional)</span>
              <div className="input-wrap">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
            </label>
          </div>

          <button type="submit" className="primary-button submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : `Register as ${role === 'farmer' ? 'Farmer' : 'Buyer'}`} <ArrowRight size={18} />
          </button>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
            <div className="secure-badge">
              <ShieldCheck size={16} /> Verified Identity & Escrow Backed
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
