import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const RegisterPage = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    college: 'Government College of Engineering, Pune',
    department: 'Information Technology',
    year: 'First Year',
    dob: '',
    gender: 'Female',
    category: 'Open',
    income: '200000',
    aadhaar: '',
    bankAccount: '',
    ifsc: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!formData.name.trim()) {
      return setError('Full name is required.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return setError('Please enter a valid email address.');
    }

    const phoneClean = formData.phone.trim();
    if (!/^\d{10}$/.test(phoneClean)) {
      return setError('Please enter a valid 10-digit mobile number.');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match. Please re-enter.');
    }

    setSubmitting(true);
    try {
      const res = await register(formData);
      if (res.success) {
        setSuccess(`Registration successful! Assigned Student ID: ${res.user.id}. Redirecting to your dashboard...`);
        setTimeout(() => {
          navigate('/student/dashboard');
        }, 1200);
      } else {
        setError(res.error || 'Registration failed. Please try again.');
        setSubmitting(false);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div className="card" style={{ maxWidth: '680px', width: '100%', padding: '32px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--color-primary-light)' }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
          <span style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '4px', fontWeight: '500' }}>
            Live Student Registration
          </span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--color-primary)', marginBottom: '4px' }}>MAHADBT Student Registration</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Create a new student profile for live examination demonstration.
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ padding: '12px 16px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <h3 style={{ fontSize: '15px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--color-primary)' }}>
            1. Account & Contact Information
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Full Name *</label>
              <input 
                type="text" 
                name="name" 
                className="form-control" 
                placeholder="e.g. Tanvi Sawant" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input 
                type="email" 
                name="email" 
                className="form-control" 
                placeholder="e.g. tanvi@demo.com" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input 
                type="tel" 
                name="phone" 
                className="form-control" 
                placeholder="10-digit mobile" 
                maxLength="10"
                value={formData.phone} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input 
                type="password" 
                name="password" 
                className="form-control" 
                placeholder="Minimum 6 characters" 
                value={formData.password} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input 
                type="password" 
                name="confirmPassword" 
                className="form-control" 
                placeholder="Re-enter password" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <h3 style={{ fontSize: '15px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px', marginTop: '16px', color: 'var(--color-primary)' }}>
            2. Academic & Personal Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">College / Institute Name *</label>
              <input 
                type="text" 
                name="college" 
                className="form-control" 
                value={formData.college} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Course / Department *</label>
              <select name="department" className="form-control" value={formData.department} onChange={handleChange} required>
                <option value="Information Technology">Information Technology</option>
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="ENTC">Electronics & Telecommunication</option>
                <option value="Mechanical">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Academic Year / Year of Study *</label>
              <select name="year" className="form-control" value={formData.year} onChange={handleChange} required>
                <option value="First Year">First Year</option>
                <option value="Second Year">Second Year</option>
                <option value="Third Year">Third Year</option>
                <option value="Final Year">Final Year</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input 
                type="date" 
                name="dob" 
                className="form-control" 
                value={formData.dob} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="gender" className="form-control" value={formData.gender} onChange={handleChange}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Social Category</label>
              <select name="category" className="form-control" value={formData.category} onChange={handleChange}>
                <option value="Open">Open</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="VJNT">VJNT</option>
                <option value="EBC">EBC</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Annual Family Income (₹)</label>
              <input 
                type="number" 
                name="income" 
                className="form-control" 
                placeholder="e.g. 150000" 
                value={formData.income} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '10px' }}
              disabled={submitting}
            >
              <UserPlus size={18} /> {submitting ? 'Registering Student...' : 'Complete Registration & Open Dashboard'}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Already have an account? <Link to="/" style={{ color: 'var(--color-primary-light)', fontWeight: '500' }}>Login here</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
