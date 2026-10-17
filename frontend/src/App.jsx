import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import ApplicationForm from './pages/student/ApplicationForm';
import Documents from './pages/student/Documents';
import TrackStatus from './pages/student/TrackStatus';
import Notifications from './pages/student/Notifications';
import Acknowledgement from './pages/student/Acknowledgement';
import Help from './pages/student/Help';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import MasterStudentSheet from './pages/admin/MasterStudentSheet';
import Applications from './pages/admin/Applications';
import ApplicationDetail from './pages/admin/ApplicationDetail';
import DocumentVerification from './pages/admin/DocumentVerification';
import AdminNotifications from './pages/admin/Notifications';
import Settings from './pages/admin/Settings';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          user ? (user.role === 'student' ? <Navigate to="/student/dashboard" /> : <Navigate to="/admin/dashboard" />) : <LoginPage />
        } />
        <Route path="/register" element={
          user ? (user.role === 'student' ? <Navigate to="/student/dashboard" /> : <Navigate to="/admin/dashboard" />) : <RegisterPage />
        } />
        
        {/* Student Routes */}
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/application" element={<ProtectedRoute allowedRole="student"><ApplicationForm /></ProtectedRoute>} />
        <Route path="/student/documents" element={<ProtectedRoute allowedRole="student"><Documents /></ProtectedRoute>} />
        <Route path="/student/track" element={<ProtectedRoute allowedRole="student"><TrackStatus /></ProtectedRoute>} />
        <Route path="/student/notifications" element={<ProtectedRoute allowedRole="student"><Notifications /></ProtectedRoute>} />
        <Route path="/student/acknowledgement" element={<ProtectedRoute allowedRole="student"><Acknowledgement /></ProtectedRoute>} />
        <Route path="/student/help" element={<ProtectedRoute allowedRole="student"><Help /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/master-sheet" element={<ProtectedRoute allowedRole="admin"><MasterStudentSheet /></ProtectedRoute>} />
        <Route path="/admin/applications" element={<ProtectedRoute allowedRole="admin"><Applications /></ProtectedRoute>} />
        <Route path="/admin/applications/:id" element={<ProtectedRoute allowedRole="admin"><ApplicationDetail /></ProtectedRoute>} />
        <Route path="/admin/verification" element={<ProtectedRoute allowedRole="admin"><DocumentVerification /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allowedRole="admin"><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRole="admin"><Settings /></ProtectedRoute>} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
