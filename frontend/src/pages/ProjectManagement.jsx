import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, ChevronLeft, Trash2, UserPlus } from 'lucide-react';

export default function ProjectManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState(
    JSON.parse(localStorage.getItem('team_projects') || '[]')
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [activeProject, setActiveProject] = useState(null);
  const [newMember, setNewMember] = useState('');

  const handleCreateProject = (e) => {
    e.preventDefault();
    const projectId = `proj-${Date.now()}`;
    const newProject = {
      id: projectId,
      name: formData.name,
      description: formData.description,
      host_id: user.id,
      host_name: user.name,
      created_at: new Date().toISOString(),
      status: 'active',
      members: [{ id: user.id, name: user.name, role: 'host' }],
      files: [],
    };

    const updated = [...projects, newProject];
    setProjects(updated);
    localStorage.setItem('team_projects', JSON.stringify(updated));
    setFormData({ name: '', description: '' });
    setShowCreateForm(false);
    setActiveProject(projectId);
  };

  const handleAddMember = (projectId) => {
    if (!newMember.trim()) return;

    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id === projectId) {
          const memberExists = p.members.some((m) => m.name.toLowerCase() === newMember.toLowerCase());
          if (!memberExists) {
            return {
              ...p,
              members: [...p.members, { id: `mem-${Date.now()}`, name: newMember, role: 'contributor' }],
            };
          }
        }
        return p;
      });
      try {
        localStorage.setItem('team_projects', JSON.stringify(updated));
      } catch (e) {
        // ignore storage errors
      }
      return updated;
    });
    setNewMember('');
  };

  const handleDeleteProject = (projectId) => {
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    localStorage.setItem('team_projects', JSON.stringify(updated));
    setActiveProject(null);
  };

  const activeProj = projects.find((p) => p.id === activeProject);

  return (
    <div className="project-management-page">
      <header className="page-header flex-align-center">
        <ChevronLeft size={20} style={{ cursor: 'pointer' }} onClick={() => navigate('/student')} />
        <div className="margin-left-sm">
          <h1>Team Architect Projects</h1>
          <p className="subtitle">
            Create projects, manage team members, upload code files, and let AI analyze team contributions.
          </p>
        </div>
      </header>

      <div className="dashboard-grid-equal">
        <section className="dashboard-card glass-panel">
          <div className="card-header flex-align-center justify-between">
            <h2>Your Projects</h2>
            <button
              className="btn-primary btn-sm"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={16} />
              New Project
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateProject} className="compact-form margin-bottom-md" style={{ padding: '16px', backgroundColor: 'rgba(100, 200, 255, 0.05)', borderRadius: '8px' }}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., E-Commerce Platform"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this project about?"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Create</button>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="projects-list">
            {projects.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: '32px' }}>
                No projects yet. Create one to get started.
              </p>
            ) : (
              projects.map((proj) => (
                <div
                  key={proj.id}
                  className={`project-item-card ${activeProject === proj.id ? 'active' : ''}`}
                  onClick={() => setActiveProject(proj.id)}
                  style={{ cursor: 'pointer', padding: '12px', marginBottom: '8px', borderRadius: '6px', backgroundColor: activeProject === proj.id ? 'rgba(100, 200, 255, 0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <h3>{proj.name}</h3>
                  <p className="text-sm text-muted">{proj.members.length} members · {proj.files.length} files</p>
                </div>
              ))
            )}
          </div>
        </section>

        {activeProj && (
          <section className="dashboard-card glass-panel flex-column">
            <div className="card-header flex-align-center justify-between">
              <h2>{activeProj.name}</h2>
              <button
                className="btn-secondary btn-sm"
                onClick={() => handleDeleteProject(activeProj.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <p className="text-sm margin-bottom-md">{activeProj.description}</p>

            <div className="project-info-grid" style={{ marginBottom: '16px' }}>
              <div>
                <span className="label">Host</span>
                <span className="value">{activeProj.host_name}</span>
              </div>
              <div>
                <span className="label">Status</span>
                <span className="value">{activeProj.status}</span>
              </div>
              <div>
                <span className="label">Files Uploaded</span>
                <span className="value">{activeProj.files.length}</span>
              </div>
            </div>

            <div className="members-section margin-top-md">
              <h3 style={{ marginBottom: '12px' }}>Team Members ({activeProj.members.length})</h3>
              <div className="members-list" style={{ marginBottom: '12px' }}>
                {activeProj.members.map((member) => (
                  <div key={member.id} className="member-pill" style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: 'rgba(100, 200, 255, 0.2)', borderRadius: '20px', marginRight: '8px', marginBottom: '6px', fontSize: '12px' }}>
                    {member.name}
                    <span style={{ marginLeft: '6px', opacity: 0.7 }}>({member.role})</span>
                  </div>
                ))}
              </div>

              <div className="add-member-form" style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMember(activeProj.id)}
                  placeholder="Add member name"
                  style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '12px' }}
                />
                <button
                  className="btn-primary btn-sm"
                  onClick={() => handleAddMember(activeProj.id)}
                >
                  <UserPlus size={14} />
                </button>
              </div>
            </div>

            <div className="project-actions margin-top-md" style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-primary"
                onClick={() => navigate(`/student/team/upload/${activeProj.id}`)}
              >
                Upload Files
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate(`/student/team/analyze/${activeProj.id}`)}
              >
                Analyze Project
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
