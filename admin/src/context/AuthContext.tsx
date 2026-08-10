import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  adminEmail: string | null;
  isAuthenticated: boolean;
  requestOtp: (email: string) => Promise<{ success: boolean; message: string; otp_code?: string }>;
  verifyOtp: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'));
  const [adminEmail, setAdminEmail] = useState<string | null>(() => localStorage.getItem('admin_email'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.removeItem('admin_token');
    }
  }, [token]);

  useEffect(() => {
    if (adminEmail) {
      localStorage.setItem('admin_email', adminEmail);
    } else {
      localStorage.removeItem('admin_email');
    }
  }, [adminEmail]);

  const requestOtp = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Failed to send OTP.' };
      }
      return {
        success: true,
        message: data.message || 'OTP sent successfully.',
        otp_code: data.otp_code,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error occurred.' };
    }
  };

  const verifyOtp = async (email: string, otp_code: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Invalid or expired OTP.' };
      }

      const receivedToken = data.admin_token;
      setToken(receivedToken);
      setAdminEmail(email);
      return { success: true, message: 'OTP verified successfully.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error occurred.' };
    }
  };

  const logout = () => {
    setToken(null);
    setAdminEmail(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        adminEmail,
        isAuthenticated: !!token,
        requestOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
