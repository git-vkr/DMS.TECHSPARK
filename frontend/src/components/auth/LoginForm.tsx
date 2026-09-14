import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Sprout } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

interface LoginFormProps {
  onDemoSelect?: (role: "farmer" | "retail" | "bulk") => void;
}

export function LoginForm({ onDemoSelect }: LoginFormProps) {
  const { login, loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError("Enter valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await api.sendOtp(phone);
      setOtpMode(true);
      setError("");
      alert(res.message);
    } catch (e: any) {
      setError(e.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (otpMode) {
        await loginWithOtp(phone, otpCode);
      } else {
        await login(phone, password);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-screen">
      <div className="role-shell" style={{ maxWidth: "440px", margin: "0 auto" }}>
        <div className="role-brand" style={{ justifyContent: "center" }}>
          <div className="brand-mark"><Sprout size={24} /></div>
          <div><strong>KrishiSetu</strong><span>DECENTRALISED MARKETPLACE</span></div>
        </div>
        
        <div className="role-intro" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "24px" }}>Welcome Back</h1>
          <p>Login to your account securely</p>
        </div>

        {/* Quick Demo Access */}
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "12px",
          padding: "1rem",
          marginBottom: "1.25rem",
          textAlign: "center"
        }}>
          <p style={{ margin: "0 0 0.6rem", fontSize: "0.85rem", fontWeight: 600, color: "#166534" }}>
            ⚡ Instant Demo Access (Explore Directly)
          </p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => onDemoSelect ? onDemoSelect("farmer") : navigate("/farmer/dashboard")}
              style={{
                background: "#16a34a",
                color: "#fff",
                border: "none",
                padding: "7px 12px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              🌾 Farmer Portal
            </button>
            <button
              type="button"
              onClick={() => onDemoSelect ? onDemoSelect("retail") : navigate("/buyer/dashboard")}
              style={{
                background: "#0284c7",
                color: "#fff",
                border: "none",
                padding: "7px 12px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              🛒 Buyer Market
            </button>
            <button
              type="button"
              onClick={() => onDemoSelect ? onDemoSelect("bulk") : navigate("/bulk/dashboard")}
              style={{
                background: "#d97706",
                color: "#fff",
                border: "none",
                padding: "7px 12px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              🏢 Bulk Desk
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>Mobile Number</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. +919876543210" 
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }} 
              disabled={otpMode || loading}
              required
            />
          </div>

          {!otpMode ? (
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" 
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }} 
                disabled={loading}
                required
              />
            </div>
          ) : (
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>Enter OTP</label>
              <input 
                type="text" 
                value={otpCode} 
                onChange={e => setOtpCode(e.target.value)}
                placeholder="1234" 
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }} 
                disabled={loading}
                required
              />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="button" style={{ background: "none", border: "none", color: "#16a34a", fontSize: "0.9rem", cursor: "pointer" }}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="primary-button" style={{ width: "100%", justifyContent: "center", padding: "0.8rem" }} disabled={loading}>
            {loading ? "Processing..." : "LOGIN"}
          </button>

          <div style={{ textAlign: "center", margin: "1rem 0", color: "#64748b", fontSize: "0.9rem" }}>------- OR -------</div>

          {!otpMode && (
            <button type="button" onClick={handleSendOtp} style={{ width: "100%", padding: "0.8rem", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", fontWeight: 500 }} disabled={loading}>
              Login with OTP
            </button>
          )}

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#64748b" }}>New user? </span>
            <Link to="/register" style={{ color: "#16a34a", fontWeight: 500, textDecoration: "none" }}>Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}