import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode,
  ArrowRight,
  Clock,
  Award,
  Code,
  Filter,
  Inbox,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ZKBadge } from '../components/Badge';
import {
  loadAssignments,
  getAssignmentStatus,
  getStudentMetrics,
} from '../utils/studentStorage';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'verified', label: 'Verified' },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [assignments, setAssignments] = useState(loadAssignments);

  const metrics = useMemo(() => getStudentMetrics(), [assignments]);

  const enriched = useMemo(
    () =>
      assignments.map((ass) => {
        const { state, submission } = getAssignmentStatus(ass);
        return { ...ass, state, submission };
      }),
    [assignments]
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return enriched;
    if (filter === 'pending') return enriched.filter((a) => a.state === 'pending');
    if (filter === 'verified') return enriched.filter((a) => a.state === 'verified');
    return enriched.filter((a) => a.state === 'submitted' || a.state === 'suspicious');
  }, [enriched, filter]);

  const refreshAssignments = () => setAssignments(loadAssignments());

  return (
    <div className="student-dashboard">
      <header className="page-header">
        <div>
          <h1>Active Learning Assignments</h1>
          <p className="subtitle">
            Assignments from your educator appear here. Open a brief, code in the secure editor, and submit with ZK proof.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={refreshAssignments}>
          Refresh list
        </button>
      </header>

      <div className="student-stats-row">
        <div className="student-stat-pill">
          <span className="stat-num">{metrics.totalAssignments}</span>
          <span className="stat-lbl">Total</span>
        </div>
        <div className="student-stat-pill">
          <span className="stat-num">{metrics.pendingCount}</span>
          <span className="stat-lbl">Pending</span>
        </div>
        <div className="student-stat-pill">
          <span className="stat-num">{metrics.submittedCount}</span>
          <span className="stat-lbl">Submitted</span>
        </div>
        <div className="student-stat-pill">
          <span className="stat-num">{metrics.verifiedCount}</span>
          <span className="stat-lbl">Verified</span>
        </div>
        <div className="student-stat-pill highlight">
          <span className="stat-num">{metrics.avgVerificationScore ?? '—'}</span>
          <span className="stat-lbl">Avg ZK score</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-card glass-panel main-assignments-panel">
          <div className="card-header flex-align-center justify-between">
            <div className="flex-align-center" style={{ gap: 8 }}>
              <FileCode className="card-icon text-purple" size={20} />
              <h2>Classroom tasks</h2>
            </div>
            <div className="student-filter-bar">
              <Filter size={14} className="text-muted" />
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`filter-chip ${filter === f.id ? 'active' : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="assignments-container">
            {assignments.length === 0 ? (
              <div className="empty-state" style={{ padding: '48px 24px' }}>
                <Inbox size={40} className="text-purple margin-bottom-sm" />
                <h3>No assignments yet</h3>
                <p className="text-muted text-sm" style={{ maxWidth: 420, margin: '8px auto 0' }}>
                  Your educator must forge tasks in the Curriculum Engine. Switch to Teacher role, upload notes, and click Forge with RAG — then return here and refresh.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <p className="text-muted">No assignments match this filter.</p>
              </div>
            ) : (
              filtered.map((ass) => {
                const humanScore =
                  ass.submission?.metrics?.humanScore ?? ass.submission?.humanScore;
                return (
                  <div key={ass.id} className="student-ass-card">
                    <div className="ass-status-badge-row">
                      {ass.state === 'pending' ? (
                        <span className="badge-zk badge-open">
                          <Clock size={14} className="margin-right-xs" />
                          <span>Not started</span>
                        </span>
                      ) : ass.state === 'verified' ? (
                        <ZKBadge status="verified" score={humanScore} />
                      ) : ass.state === 'suspicious' ? (
                        <ZKBadge status="suspicious" score={humanScore} />
                      ) : (
                        <ZKBadge status="submitted" score={humanScore} />
                      )}
                    </div>

                    <div className="student-ass-content">
                      <h3>{ass.title}</h3>
                      <p className="description">
                        {(ass.description || '').slice(0, 180)}
                        {(ass.description || '').length > 180 ? '…' : ''}
                      </p>
                      <div className="trap-warning-indicator">
                        <strong>Trap:</strong>{' '}
                        {(ass.trapQuestion || 'Logic trap active').slice(0, 70)}…
                      </div>
                    </div>

                    <div className="student-ass-footer">
                      <span className="deadline-lbl">Due: {ass.deadline || 'TBD'}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn-secondary"
                          onClick={() => navigate(`/student/assignment/${ass.id}/brief`)}
                        >
                          View brief
                        </button>
                        <button
                          className="btn-primary btn-action-card"
                          onClick={() => navigate(`/student/assignment/${ass.id}`)}
                        >
                          <span>{ass.state === 'pending' ? 'Start coding' : 'Open editor'}</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="side-widget-panel flex-column gap-md">
          <div className="dashboard-card glass-panel flex-column">
            <div className="card-header">
              <Award className="card-icon text-cyan" size={20} />
              <h2>Your progress</h2>
            </div>
            <div className="widget-body text-center flex-column flex-align-center">
              {metrics.submittedCount === 0 ? (
                <p className="widget-p text-sm text-muted">
                  Complete an assignment with ZK proof to build your verification history.
                </p>
              ) : (
                <>
                  <div className="metric-display">
                    <span className="value">{metrics.avgVerificationScore ?? 0}%</span>
                    <span className="label">Avg verification score</span>
                  </div>
                  <p className="widget-p text-sm">
                    {metrics.verifiedCount} verified · {metrics.submittedCount} total submissions
                  </p>
                </>
              )}
              <button
                className="btn-secondary w-full margin-top-sm"
                onClick={() => navigate('/student/skillgraph')}
              >
                Explore SkillGraph
              </button>
              <button
                className="btn-primary w-full margin-top-sm"
                onClick={() => navigate('/student/company-verification')}
              >
                Verify company project
              </button>
            </div>
          </div>

          <div className="dashboard-card glass-panel flex-column">
            <div className="card-header">
              <Code className="card-icon text-green" size={20} />
              <h2>Submission tips</h2>
            </div>
            <ul className="bulk-feature-list" style={{ margin: 0 }}>
              <li>Type your solution — avoid large pastes</li>
              <li>Follow the logic trap in the brief</li>
              <li>Submit only when ready (editor locks after ZK proof)</li>
            </ul>
            {metrics.pendingCount > 0 && (
              <div className="paste-alert-banner margin-top-sm" style={{ marginBottom: 0 }}>
                <AlertTriangle size={14} />
                <span className="text-xs">{metrics.pendingCount} assignment(s) due</span>
              </div>
            )}
            {metrics.verifiedCount > 0 && (
              <div className="flex-align-center margin-top-sm text-sm" style={{ gap: 6, color: 'var(--success)' }}>
                <CheckCircle2 size={14} />
                <span>{metrics.verifiedCount} cryptographically verified</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
