import React, { createContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('mahadbt_demo_user');
      const token = localStorage.getItem('mahadbt_token');

      if (token) {
        try {
          const data = await api.get('/auth/me');
          setUser(data.user);
          setStudentProfile(data.studentProfile);
          localStorage.setItem('mahadbt_demo_user', JSON.stringify(data.user));
        } catch (err) {
          console.warn('Session expired or backend offline, falling back to cached user:', err.message);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } else if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.user);
      localStorage.setItem('mahadbt_demo_user', JSON.stringify(res.user));
      localStorage.setItem('mahadbt_token', res.token);
      
      // Fetch profile if student
      if (res.user.role === 'student') {
        try {
          const profileData = await api.get('/auth/me');
          setStudentProfile(profileData.studentProfile);
        } catch (e) {
          // ignore
        }
      }
      return { success: true };
    } catch (err) {
      console.warn('API login failed, checking fallback credentials:', err.message);
      // Fallback for offline demo
      if (email === 'student@demo.com' && password === 'student123') {
        const studentUser = { role: 'student', id: 'STU2026001', name: 'Sharvari Bangar', email };
        setUser(studentUser);
        localStorage.setItem('mahadbt_demo_user', JSON.stringify(studentUser));
        return { success: true };
      } else if (email === 'admin@demo.com' && password === 'admin123') {
        const adminUser = { role: 'admin', id: 'admin', name: 'System Admin', email };
        setUser(adminUser);
        localStorage.setItem('mahadbt_demo_user', JSON.stringify(adminUser));
        return { success: true };
      }
      return { success: false, error: err.message || 'Invalid credentials' };
    }
  };

  const register = async (registrationData) => {
    try {
      const res = await api.post('/auth/register', registrationData);
      setUser(res.user);
      localStorage.setItem('mahadbt_demo_user', JSON.stringify(res.user));
      localStorage.setItem('mahadbt_token', res.token);

      try {
        const profileData = await api.get('/auth/me');
        setStudentProfile(profileData.studentProfile);
      } catch (e) {
        // ignore
      }

      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setStudentProfile(null);
    localStorage.removeItem('mahadbt_demo_user');
    localStorage.removeItem('mahadbt_token');
  };

  const refreshProfile = async () => {
    if (user && user.role === 'student') {
      try {
        const data = await api.get('/auth/me');
        setStudentProfile(data.studentProfile);
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      studentProfile,
      loading,
      login,
      register,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
