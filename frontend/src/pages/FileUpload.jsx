import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function FileUpload() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState(JSON.parse(localStorage.getItem('team_projects') || '[]'));
  const [project, setProject] = useState(projects.find((p) => p.id === projectId));
  const [moduleName, setModuleName] = useState('');
  const [authorId, setAuthorId] = useState(project?.members[0]?.id || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState(project?.files || []);

  if (!project) {
    return (
      <div className="page-error">
        <p>Project not found</p>
        <button onClick={() => navigate('/student/team/manage')}>Back</button>
      </div>
    );
  }

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !moduleName || !authorId) {
      setMessage('Please fill all fields and select a file.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const content = await selectedFile.text();
      const lineCount = content.split('\n').length;
      const authorName = project.members.find((m) => m.id === authorId)?.name || authorId;

      const newFile = {
        id: `file-${Date.now()}`,
        filename: selectedFile.name,
        module_name: moduleName,
        author_id: authorId,
        author_name: authorName,
        uploaded_at: new Date().toISOString(),
        line_count: lineCount,
        content: content.substring(0, 5000), // Store preview
      };

      const updated = [...uploadedFiles, newFile];
      setUploadedFiles(updated);

      // Update project
      const updatedProjects = projects.map((p) =>
        p.id === projectId ? { ...p, files: updated } : p
      );
      setProjects(updatedProjects);
      try {
        localStorage.setItem('team_projects', JSON.stringify(updatedProjects));
      } catch (storageErr) {
        // ignore storage errors
      }

      setMessage(`✓ File uploaded: ${moduleName} (${lineCount} lines)`);
      setModuleName('');
      setSelectedFile(null);
    } catch (err) {
      setMessage('Error reading file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = (fileId) => {
    const updated = uploadedFiles.filter((f) => f.id !== fileId);
    setUploadedFiles(updated);

    const updatedProjects = projects.map((p) =>
      p.id === projectId ? { ...p, files: updated } : p
    );
    setProjects(updatedProjects);
    try {
      localStorage.setItem('team_projects', JSON.stringify(updatedProjects));
    } catch (storageErr) {
      // ignore storage errors
    }
  };

  return (
    <div className="file-upload-page">
      <header className="page-header flex-align-center">
        <ChevronLeft
          size={20}
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/student/team/manage')}
        />
        <div className="margin-left-sm">
          <h1>Upload Code Files</h1>
          <p className="subtitle">
            Upload code files for {project.name}. Each file represents a module developed by a team member.
          </p>
        </div>
      </header>

      <div className="dashboard-grid-equal">
        <section className="dashboard-card glass-panel">
          <div className="card-header">
            <Upload size={20} className="card-icon" />
            <h2>Upload Module</h2>
          </div>

          <form onSubmit={handleFileUpload} className="compact-form">
            <div className="form-group">
              <label>Module Name</label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="e.g., auth_service, db_layer, api_gateway"
              />
            </div>

            <div className="form-group">
              <label>Author</label>
              <select value={authorId} onChange={(e) => setAuthorId(e.target.value)}>
                {project.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Code File</label>
              <div className="file-drop-zone">
                <input
                  type="file"
                  id="code-file-input"
                  accept=".py,.js,.ts,.java,.cpp,.go"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden-file-input"
                />
                <label htmlFor="code-file-input" className="drop-zone-label">
                  <Upload size={20} />
                  <span>{selectedFile ? selectedFile.name : 'Click to select file'}</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Module'}
            </button>

            {message && (
              <div className={`alert-banner ${message.startsWith('✓') ? 'success' : 'error'} margin-top-md`}>
                {message.startsWith('✓') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{message}</span>
              </div>
            )}
          </form>
        </section>

        <section className="dashboard-card glass-panel flex-column">
          <div className="card-header">
            <h2>Uploaded Files ({uploadedFiles.length})</h2>
          </div>

          <div className="files-list">
            {uploadedFiles.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: '32px' }}>
                No files uploaded yet.
              </p>
            ) : (
              uploadedFiles.map((file) => (
                <div key={file.id} className="file-item" style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="file-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4>{file.module_name}</h4>
                      <p className="text-sm text-muted">
                        {file.author_name} · {file.line_count} lines · {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {uploadedFiles.length > 0 && (
            <button
              className="btn-primary w-full margin-top-md"
              onClick={() => navigate(`/student/team/analyze/${projectId}`)}
            >
              Proceed to Analysis
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
