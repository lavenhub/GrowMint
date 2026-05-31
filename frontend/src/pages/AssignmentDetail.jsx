import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  ShieldCheck,
  FileText,
  ClipboardList,
  Code,
  AlertTriangle,
  CheckCircle2,
  Mic,
} from 'lucide-react';
import { ZKBadge } from '../components/Badge';
import {
  loadAssignments,
  getAssignmentStatus,
  getCodeDraft,
} from '../utils/studentStorage';

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const assignment = useMemo(() => {
    const list = loadAssignments();
    return list.find((a) => a.id === id) || list[0];
  }, [id]);

  if (!assignment) {
    return (
      <div className="assignment-detail-page">
        <header className="page-header">
          <button className="btn-back" onClick={() => navigate('/student')}>
            <ChevronLeft size={20} />
          </button>
          <h1>Assignment not found</h1>
        </header>
        <p className="text-muted">Ask your educator to publish an assignment from the Curriculum Engine.</p>
      </div>
    );
  }

  const { state, submission } = getAssignmentStatus(assignment);
  const hasDraft = Boolean(getCodeDraft(assignment.id));
  const isLocked = state !== 'pending';

  return (
    <div className="assignment-detail-page">
      <header className="page-header flex-align-center">
        <button className="btn-back" onClick={() => navigate('/student')}>
          <ChevronLeft size={20} />
        </button>
        <div className="margin-left-sm">
          <h1>{assignment.title}</h1>
          <p className="subtitle">
            <span style={{ textTransform: 'capitalize' }}>{assignment.type || 'assignment'}</span>
            {' · '}
            <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Due {assignment.deadline || 'TBD'}
          </p>
        </div>
      </header>

      <div className="dashboard-grid-equal">
        <section className="dashboard-card glass-panel">
          <div className="card-header">
            <FileText size={20} className="card-icon" />
            <h2>Assignment brief</h2>
          </div>
          <p className="ass-desc" style={{ lineHeight: 1.7 }}>{assignment.description}</p>

          {assignment.evaluationCriteria && (
            <div className="margin-top-md">
              <div className="flex-align-center margin-bottom-sm" style={{ gap: 8 }}>
                <ClipboardList size={16} className="text-muted" />
                <h3 style={{ fontSize: '0.9rem', margin: 0 }}>Evaluation criteria</h3>
              </div>
              <p className="text-sm" style={{ lineHeight: 1.6 }}>{assignment.evaluationCriteria}</p>
            </div>
          )}

          {assignment.uploadedFiles?.length > 0 && (
            <div className="margin-top-md">
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>Context from educator</h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {assignment.uploadedFiles.map((f, i) => (
                  <span key={i} className="file-item-chip">
                    <FileText size={12} style={{ marginRight: 4 }} />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="dashboard-card glass-panel">
          <div className="card-header">
            <ShieldCheck size={20} className="card-icon" />
            <h2>AI-resistance protocol</h2>
          </div>

          <div className="logic-trap-banner" style={{ margin: 0 }}>
            <p className="code-font" style={{ fontSize: '0.85rem' }}>{assignment.trapQuestion}</p>
            {assignment.trapExplanation && (
              <p className="margin-top-sm text-sm" style={{ lineHeight: 1.6 }}>
                {assignment.trapExplanation}
              </p>
            )}
          </div>

          {(assignment.voiceRequirement !== false) && (
            <div className="voice-requirement-panel margin-top-md">
              <div className="flex-align-center" style={{ gap: 8 }}>
                <Mic size={16} />
                <strong>Voice explanation required</strong>
              </div>
              <p className="text-sm margin-top-xs" style={{ lineHeight: 1.6 }}>
                Record a short spoken explanation describing the problem, your algorithm, and how your code satisfies the assignment trap. This clip is part of the verification workflow.
              </p>
            </div>
          )}

          <div className="paste-alert-banner margin-top-md">
            <AlertTriangle size={14} />
            <span className="text-sm">
              Generic AI tools often miss course-specific traps. Your solution must follow the requirement above.
            </span>
          </div>

          {isLocked && submission && (
            <div className="margin-top-md">
              <div className="flex-align-center margin-bottom-sm" style={{ gap: 8 }}>
                <CheckCircle2 size={18} className="text-green" />
                <strong>Your submission</strong>
              </div>
              <ZKBadge
                status={submission.status}
                score={submission.metrics?.humanScore ?? submission.humanScore}
              />
              <p className="text-xs text-muted margin-top-sm">
                Submitted {submission.submittedAt}
              </p>
            </div>
          )}

          <div className="margin-top-md" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {isLocked ? (
              <button
                className="btn-primary w-full"
                style={{ justifyContent: 'center' }}
                onClick={() => navigate(`/student/assignment/${assignment.id}`)}
              >
                <Code size={16} />
                <span>View submitted work</span>
              </button>
            ) : (
              <button
                className="btn-primary w-full"
                style={{ justifyContent: 'center' }}
                onClick={() => navigate(`/student/assignment/${assignment.id}`)}
              >
                <Code size={16} />
                <span>{hasDraft ? 'Continue in safe editor' : 'Open safe code editor'}</span>
              </button>
            )}
            <button className="btn-secondary w-full" onClick={() => navigate('/student')}>
              Back to assignments
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
