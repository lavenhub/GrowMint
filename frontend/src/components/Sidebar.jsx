import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  User,
  Network,
  FileCode,
  Users,
  Shuffle,
  LogOut,
  Sparkles,
  FileSearch,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar() {
  const { user, switchRole, logout } = useAuth();

  const handleRoleToggle = () => {
    const nextRole = user.role === 'teacher' ? 'student' : 'teacher';
    switchRole(nextRole);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Sparkles className="brand-logo" size={18} />
        <span className="brand-name">GrowMint</span>
      </div>

      <div className="user-profile-section">
        <img className="user-avatar" src={user.avatar} alt={user.name} />
        <div className="user-details">
          <span className="user-name">{user.name}</span>
          <span className="user-role-tag">{user.role.toUpperCase()}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {user.role === 'teacher' ? (
          <>
            <div className="nav-group-title">Educator Portal</div>
            <NavLink to="/teacher/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <BookOpen size={18} />
              <span>Curriculum Engine</span>
            </NavLink>
            <NavLink to="/teacher/class-analysis" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileSearch size={18} />
              <span>Class ZIP Analysis</span>
            </NavLink>
          </>
        ) : (
          <>
            <div className="nav-group-title">Student Portal</div>
            <NavLink to="/student/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <FileCode size={18} />
              <span>Assignments</span>
            </NavLink>
            <NavLink to="/student/skillgraph" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Network size={18} />
              <span>ZK SkillGraph</span>
            </NavLink>
            <NavLink to="/student/company-verification" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={18} />
              <span>Project Verification</span>
            </NavLink>
            <NavLink to="/student/team/manage" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Team Architect</span>
            </NavLink>
            <NavLink to={`/profile/${user.id}`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <User size={18} />
              <span>Public Profile</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="btn-role-toggle" onClick={handleRoleToggle}>
          <Shuffle size={16} />
          <span>Switch to {user.role === 'teacher' ? 'Student' : 'Teacher'}</span>
        </button>
        <NavLink to="/" className="nav-link logout-link" onClick={logout}>
          <LogOut size={16} />
          <span>Exit Portal</span>
        </NavLink>
      </div>
    </aside>
  );
}
