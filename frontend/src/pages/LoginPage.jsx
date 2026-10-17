import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, UserPlus } from 'lucide-react';

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please check the demo credentials below.');
    }
  };

  const setDemoCredentials = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'student') {
      setEmail('student@demo.com');
      setPassword('student123');
    } else {
      setEmail('admin@demo.com');
      setPassword('admin123');
    }
    setError('');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '32px' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--color-primary)', marginBottom: '8px' }}>MAHADBT Portal</h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '24px', fontSize: '14px' }}>
          Scholarship Management & Tracking System
        </p>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button 
            className="btn" 
            style={{ flex: 1, backgroundColor: role === 'student' ? 'var(--color-primary-light)' : 'transparent', color: role === 'student' ? 'white' : 'var(--color-text)', border: '1px solid var(--color-border)' }}
            onClick={() => setDemoCredentials('student')}
            type="button"
          >
            <User size={16} /> Student
          </button>
          <button 
            className="btn" 
            style={{ flex: 1, backgroundColor: role === 'admin' ? 'var(--color-primary-light)' : 'transparent', color: role === 'admin' ? 'white' : 'var(--color-text)', border: '1px solid var(--color-border)' }}
            onClick={() => setDemoCredentials('admin')}
            type="button"
          >
            <Shield size={16} /> Admin
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. student@demo.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login to Portal'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <Link to="/register" className="btn btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <UserPlus size={16} /> Register as New Student
          </Link>
        </div>

        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px dashed #9ca3af' }}>
          <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#4b5563', marginBottom: '8px' }}>DEMO CREDENTIALS</h4>
          <div style={{ fontSize: '13px', marginBottom: '6px' }}>
            <strong>Student:</strong> student@demo.com / student123
          </div>
          <div style={{ fontSize: '13px' }}>
            <strong>Admin:</strong> admin@demo.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
