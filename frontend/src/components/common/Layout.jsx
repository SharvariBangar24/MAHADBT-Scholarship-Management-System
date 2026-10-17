import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { AppDataContext } from '../../context/AppDataContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, FileText, FileBadge, Activity, Bell, HelpCircle, ExternalLink, Menu, LogOut, X, PieChart, CheckSquare, Settings, Database } from 'lucide-react';

export const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const { notifications } = useContext(AppDataContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const unreadCount = notifications.filter(n => !n.read && n.userId === (user.role === 'admin' ? 'admin' : user.id)).length;

  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: <Home size={18} /> },
    { name: 'My Application', path: '/student/application', icon: <FileText size={18} /> },
    { name: 'Documents', path: '/student/documents', icon: <FileBadge size={18} /> },
    { name: 'Track Status', path: '/student/track', icon: <Activity size={18} /> },
    { name: 'Notifications', path: '/student/notifications', icon: <Bell size={18} /> },
    { name: 'Help', path: '/student/help', icon: <HelpCircle size={18} /> },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <PieChart size={18} /> },
    { name: 'Master Student Sheet', path: '/admin/master-sheet', icon: <Database size={18} /> },
    { name: 'Applications', path: '/admin/applications', icon: <FileText size={18} /> },
    { name: 'Verification Queue', path: '/admin/verification', icon: <CheckSquare size={18} /> },
    { name: 'Notifications', path: '/admin/notifications', icon: <Bell size={18} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
  ];

  const links = user.role === 'student' ? studentLinks : adminLinks;

  const [mahadbtModal, setMahadbtModal] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        backgroundColor: 'var(--color-primary)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, bottom: 0, left: sidebarOpen ? 0 : '-260px',
        transition: 'left 0.3s',
        zIndex: 100
      }}>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '18px', color: 'white', margin: 0 }}>MAHADBT Demo</h2>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'block' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {links.map(link => (
            <Link 
              key={link.path}
              to={link.path}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                color: 'white', opacity: location.pathname === link.path ? 1 : 0.7,
                backgroundColor: location.pathname === link.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                textDecoration: 'none'
              }}
              onClick={() => setSidebarOpen(false)}
            >
              {link.icon} {link.name}
            </Link>
          ))}
          {user.role === 'student' && (
             <button 
             style={{
               display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
               color: 'white', opacity: 0.7, backgroundColor: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '16px'
             }}
             onClick={() => {setMahadbtModal(true); setSidebarOpen(false);}}
           >
             <ExternalLink size={18} /> Official MAHADBT
           </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: sidebarOpen ? '260px' : 0, transition: 'margin-left 0.3s' }}>
        {/* Topbar */}
        <header style={{ height: '60px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <Menu size={20} />
            </button>
            <h3 style={{ margin: 0, fontSize: '16px' }}>{links.find(l => location.pathname.includes(l.path))?.name || 'Dashboard'}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Bell size={20} style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }} onClick={() => navigate(`/${user.role}/notifications`)} />
              {unreadCount > 0 && (
                <div style={{ position: 'absolute', top: -5, right: -5, background: 'var(--color-error)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                  {unreadCount}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user.name.charAt(0)}
              </div>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{user.name}</span>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '24px' }}>
          {children}
        </main>
      </div>

      {/* Mahadbt Demo Modal */}
      {mahadbtModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '16px' }}>Official MAHADBT Portal Redirect</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
              <strong>Demo/Simulated:</strong> You are about to leave this prototype application. This button would normally redirect you to the official MAHADBT portal (https://mahadbt.maharashtra.gov.in). 
            </p>
            <p style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>
              This prototype does not integrate with the real government system.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setMahadbtModal(false)}>Close</button>
              <a href="https://mahadbt.maharashtra.gov.in" target="_blank" rel="noreferrer" className="btn btn-primary" onClick={() => setMahadbtModal(false)}>
                Go to MAHADBT
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
