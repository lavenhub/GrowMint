import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRAG } from '../utils/api';
import { initialAssignments } from '../utils/mockCurriculum';
import { Upload, Sparkles, FileText, Settings, ShieldCheck, HelpCircle, CheckSquare } from 'lucide-react';

export default function TeacherDashboard() {
  const [assignments, setAssignments] = useState(() => {
    const saved = localStorage.getItem('spectra_assignments');
    if (!saved) {
      localStorage.setItem('spectra_assignments', JSON.stringify(initialAssignments));
      return initialAssignments;
    }
    return JSON.parse(saved);
  });
  
  // Knowledge Base State
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  
  // Task Generator State
  const [ragTopic, setRagTopic] = useState('');
  const [taskType, setTaskType] = useState('project'); // project, assignment, test
  const [trapType, setTrapType] = useState('quantum-sync'); // quantum-sync, memory, no-standard-lib, edge-case
  const [generating, setGenerating] = useState(false);
  const [showTrapDetails, setShowTrapDetails] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const assignmentsRef = useRef(null);
  
  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files).map(f => ({
      name: f.name,
      file: f,
      id: `file-${Date.now()}-${Math.random()}`
    }));
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const handleGenerateRAG = async (e) => {
    e.preventDefault();
    if (!ragTopic.trim() || selectedFiles.size === 0) return;

    setGenerating(true);
    setStatusMessage(null);

    const contextFiles = uploadedFiles
      .filter(f => selectedFiles.has(f.id))
      .map(f => f.file);

    try {
      const newTask = await generateRAG(ragTopic, taskType, trapType, contextFiles);
      setAssignments(prev => {
        const next = [newTask, ...prev];
        localStorage.setItem('spectra_assignments', JSON.stringify(next));
        return next;
      });
      setRagTopic('');
      setSelectedFiles(new Set());

      if (newTask.source === 'local-fallback') {
        setStatusMessage({
          type: 'warning',
          text: `Task created using offline template (Gemini unavailable: ${newTask.backendError}). Update GEMINI_API_KEY in backend/.env for live AI generation.`,
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Task "${newTask.title}" created successfully. See it below in Active Generated Tasks.`,
        });
      }

      setTimeout(() => {
        assignmentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error("Failed to generate task:", error);
      setStatusMessage({
        type: 'error',
        text: `Failed to generate task: ${error.message}`,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="teacher-dashboard">
      <header className="page-header">
        <div>
          <h1>AI-Resilient Curriculum Engine</h1>
          <p className="subtitle">Upload knowledge base files, give a topic prompt, and let RAG forge AI-proof tasks.</p>
        </div>
      </header>

      <div className="dashboard-grid-equal">
        
        {/* Left Panel: Knowledge Base */}
        <section className="dashboard-card glass-panel">
          <div className="card-header">
            <Upload className="card-icon" size={20} />
            <h2>Knowledge Base</h2>
          </div>
          
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Upload Lecture Materials</label>
            <div className="file-drop-zone" style={{ padding: '24px 16px' }}>
              <input 
                type="file" 
                id="kb-upload" 
                multiple 
                accept=".pdf,.txt,.md,.pptx"
                onChange={handleFileUpload} 
                className="hidden-file-input"
              />
              <label htmlFor="kb-upload" className="drop-zone-label">
                <Upload size={20} className="upload-icon" />
                <span>Click to <strong>browse files</strong></span>
                <span className="file-specs">PDF, PPTX, TXT. These become RAG context.</span>
              </label>
            </div>
          </div>

          <div className="kb-file-list">
            <h3 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Available Context Files</h3>
            {uploadedFiles.length === 0 ? (
              <p className="text-muted text-sm">No files uploaded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {uploadedFiles.map(file => (
                  <label key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                    />
                    <FileText size={16} className="text-muted" />
                    <span style={{ fontSize: '0.85rem' }}>{file.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right Panel: RAG Task Generator */}
        <section className="dashboard-card glass-panel">
          <div className="card-header">
            <Settings className="card-icon" size={20} />
            <h2>RAG Task Generator</h2>
          </div>
          
          <form onSubmit={handleGenerateRAG} className="compact-form">
            <div className="form-group">
              <label>What to Forge</label>
              <select 
                value={taskType}
                onChange={e => setTaskType(e.target.value)}
              >
                <option value="project">Project / Capstone</option>
                <option value="assignment">Classroom Assignment</option>
                <option value="test">AI-Proof Test</option>
              </select>
            </div>

            <div className="form-group">
              <label>Topics / Key Focus Areas</label>
              <input 
                type="text"
                placeholder="e.g. Dynamic Programming, File I/O, Pointers" 
                value={ragTopic}
                onChange={e => setRagTopic(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Select Built-in Logic Trap</label>
              <select 
                value={trapType}
                onChange={e => setTrapType(e.target.value)}
              >
                <option value="quantum-sync">Local Sync Constraint ('Spectra-Sync Guard')</option>
                <option value="memory">Strict State Buffer Size Limit (127 Bytes)</option>
                <option value="no-standard-lib">Disable Standard Libraries (Force Primitive Helpers)</option>
                <option value="edge-case">Arbitrary Edge Case Constraint (13-Byte Packet Fail)</option>
              </select>
            </div>

            {/* AI-Resistance Strength Meter */}
            <div style={{ margin: '20px 0', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'var(--bg-app)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>AI-Resistance Rating</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  color: selectedFiles.size === 0 ? 'var(--danger)' : selectedFiles.size === 1 ? '#d97706' : 'var(--success)'
                }}>
                  {selectedFiles.size === 0 ? '0% (Vulnerable)' : selectedFiles.size === 1 ? '65% (AI-Resilient)' : '95% (Bulletproof)'}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: selectedFiles.size === 0 ? '0%' : selectedFiles.size === 1 ? '65%' : '95%',
                  height: '100%', 
                  background: selectedFiles.size === 0 ? 'var(--danger)' : selectedFiles.size === 1 ? '#f59e0b' : 'var(--success)',
                  transition: 'all 0.3s ease'
                }}></div>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                {selectedFiles.size === 0 
                  ? '⚠️ Zero files selected as reference. Standard LLMs will solve the task instantly.'
                  : selectedFiles.size === 1 
                  ? '💡 Local reference constraints injected. ChatGPT/Claude will fail basic validations.'
                  : '🔥 Multi-file constraints active. Zero-Knowledge validation guarantees student authorship.'}
              </p>
            </div>

            {selectedFiles.size === 0 && (
              <div className="paste-alert-banner" style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} className="text-red" />
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                  <strong>Context Required:</strong> Please check at least one Knowledge Base file (left panel) to enable generator.
                </span>
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary w-full"
              style={{ justifyContent: 'center' }}
              disabled={generating || !ragTopic.trim() || selectedFiles.size === 0}
            >
              {generating ? (
                <>
                  <span className="spinner"></span>
                  <span>Forging {taskType}...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Forge with RAG</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>

      {statusMessage && (
        <div
          className="dashboard-card glass-panel margin-top-md"
          style={{
            padding: '14px 18px',
            borderColor:
              statusMessage.type === 'success'
                ? 'var(--success)'
                : statusMessage.type === 'warning'
                ? '#f59e0b'
                : 'var(--danger)',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{statusMessage.text}</p>
        </div>
      )}

      {/* Generated Assignments List */}
      <section ref={assignmentsRef} className="dashboard-card glass-panel margin-top-md">
        <div className="card-header">
          <CheckSquare className="card-icon" size={20} />
          <h2>Active Generated Tasks</h2>
        </div>

        <div className="assignments-container">
          {assignments.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <Sparkles size={32} className="text-purple margin-bottom-sm" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>No Classroom Tasks Forged Yet</h3>
              <p style={{ maxWidth: '420px', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Use the RAG Task Generator above to upload lecture materials, select them as context, and forge AI-proof assignments for your students.
              </p>
            </div>
          ) : (
            assignments.map(ass => (
              <div key={ass.id} className="assignment-item-card">
                <div className="ass-header">
                  <h3>{ass.title}</h3>
                  <span className="due-date-tag" style={{ textTransform: 'capitalize' }}>Type: {ass.type || 'Project'}</span>
                </div>
                
                <p className="ass-desc">{ass.description}</p>

                <div className="ass-meta margin-top-sm">
                  <div className="meta-references">
                    <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>RAG Context Provided: </strong> 
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {ass.uploadedFiles.map((file, i) => (
                        <span key={i} className="file-item-chip">
                          <FileText size={12} style={{ marginRight: '4px' }} />
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Logic Trap Visual Indicator */}
                <div className="logic-trap-banner">
                  <div className="trap-summary-header" onClick={() => setShowTrapDetails(showTrapDetails === ass.id ? null : ass.id)}>
                    <div className="flex-align-center text-primary">
                      <ShieldCheck size={16} className="margin-right-xs" />
                      <span><strong>Built-in Logic Trap:</strong> {(ass.trapQuestion || 'No trap defined').substring(0, 45)}{(ass.trapQuestion?.length > 45) ? '...' : ''}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{showTrapDetails === ass.id ? 'Hide' : 'Explain'}</span>
                  </div>
                  
                  {showTrapDetails === ass.id && (
                    <div className="trap-expanded-content">
                      <div className="trap-question-box">
                        <strong style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Question Embedded:</strong>
                        <p className="code-font">{ass.trapQuestion}</p>
                      </div>
                      <div className="trap-explanation-box margin-top-sm">
                        <div className="flex-align-center" style={{ color: 'var(--text-muted)' }}>
                          <HelpCircle size={14} className="margin-right-xs" />
                          <span style={{ fontSize: '0.8rem' }}>Why AI models fail this:</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '4px' }}>{ass.trapExplanation}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ass-actions" style={{ borderTop: '1px solid var(--border-light)', marginTop: '16px', paddingTop: '16px' }}>
                  <button 
                    className="btn-secondary"
                    onClick={() => navigate(`/teacher/submissions/${ass.id}`, { state: { assignment: ass } })}
                  >
                    View Student Submissions ({ass.submissions.length})
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
