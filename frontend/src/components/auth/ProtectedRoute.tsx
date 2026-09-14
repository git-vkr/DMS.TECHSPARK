import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', color: '#64748b' }}>
        <ShieldCheck size={40} style={{ animation: 'pulse 2s infinite' }} />
        <p>Verifying secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on actual role
    if (user.role === 'farmer') return <Navigate to="/farmer/dashboard" replace />;
    if (user.role === 'buyer') return <Navigate to="/buyer/dashboard" replace />;
    if ((user.role as string) === 'bulk') return <Navigate to="/buyer/dashboard" replace />; // Using buyer dashboard for bulk for now
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
