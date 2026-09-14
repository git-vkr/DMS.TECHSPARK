import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  _id: string;
  name: string;
  phone: string;
  role: 'farmer' | 'buyer' | 'fpo' | 'driver' | 'admin';
  language: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (phone: string, password?: string) => Promise<void>;
  loginWithOtp: (phone: string, otp: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const data = await api.getMe();
      setUser(data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, password?: string) => {
    const res = await api.login(phone, password);
    setUser(res.user);
  };

  const loginWithOtp = async (phone: string, otp: string) => {
    const res = await api.verifyOtp(phone, otp);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        loginWithOtp,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
