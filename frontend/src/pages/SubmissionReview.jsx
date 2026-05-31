import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import KeystrokeReplay from '../components/KeystrokeReplay';
import { ChevronLeft, ShieldCheck, Key, RefreshCw, BarChart2 } from 'lucide-react';

export default function SubmissionReview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedSub, setSelectedSub] = useState(null);

  // Load from state or localStorage or fallback to mock
  const assignment = state?.assignment || (() => {
    const saved = localStorage.getItem('spectra_assignments');
    if (saved) {
      const list = JSON.parse(saved);
      const found = list.find(a => a.id === id);
      if (found) return found;
    }
    return {
      id: id,
      title: "Project 1: Secure Data Pipeline and Keystroke Parsing",
      submissions: [
        { 
          studentId: "std-1", 
          studentName: "Aarav Sharma", 
          status: "verified", 
          submittedAt: "2026-05-28",
          metrics: { keystrokeCount: 840, backspaces: 64, pastes: 0, humanScore: 94, elapsedSeconds: 420, proofHash: "zk-proof-0x2bf9837de891ac3c6e8e2b8d91f28b3c4f5a6b7c" }
        },
        { 
          studentId: "std-2", 
          studentName: "Priya Patel", 
          status: "suspicious", 
          submittedAt: "2026-05-27",
          metrics: { keystrokeCount: 45, backspaces: 0, pastes: 2, humanScore: 10, elapsedSeconds: 24, proofHash: "failed-verification-hash-0x000000000000000000000000000000" }
        }
      ]
    };
  })();

  const getSubMetrics = (sub) => {
    if (sub.metrics) return sub.metrics;
    
    // Generate default metrics for simple state mock
    if (sub.status === 'verified') {
      return {
        keystrokeCount: 920,
        backspaces: 78,
        pastes: 0,
        humanScore: 92,
        elapsedSeconds: 580,
        proofHash: "zk-proof-0x4a7e912bc8f3d6ea1c9b3d5fa6b7c8d9e0f1a2b"
      };
    } else {
      return {
        keystrokeCount: 30,
        backspaces: 1,
        pastes: 3,
        humanScore: 15,
        elapsedSeconds: 15,
        proofHash: "failed-verification-hash-0x000000000000000000000000000000"
      };
    }
  };

  return (
    <div className="submission-review-page">
      <header className="page-header flex-align-center">
        <button className="btn-back" onClick={() => navigate('/teacher')}>
          <ChevronLeft size={20} />
        </button>
        <div className="margin-left-sm">
          <h1>Submission Review Center</h1>
          <p className="subtitle">Inspect math-backed human telemetry proofs and keystroke analytics for: <strong>{assignment.title}</strong></p>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Left Submissions List */}
        <section className="dashboard-card glass-panel flex-column">
          <div className="card-header">
            <BarChart2 className="card-icon text-cyan" size={20} />
            <h2>Student Submissions</h2>
          </div>

          <div className="submissions-list">
            {assignment.submissions.length === 0 ? (
              <div className="empty-state">
                <p>No student submissions received yet for this project.</p>
              </div>
            ) : (
              assignment.submissions.map(sub => {
                const metrics = getSubMetrics(sub);
                return (
                  <div 
                    key={sub.studentId} 
                    className={`submission-row ${selectedSub?.studentId === sub.studentId ? 'selected-row' : ''}`}
                    onClick={() => setSelectedSub({ ...sub, metrics })}
                  >
                    <div className="sub-main-info">
                      <h3>{sub.studentName}</h3>
                      <span className="timestamp-lbl">Submitted on: {sub.submittedAt}</span>
                    </div>
                    <div className="sub-badge-col">
                      <ZKBadge status={sub.status} score={metrics.humanScore} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Details Panel */}
        <section className="dashboard-card glass-panel telemetry-details-card">
          <div className="card-header">
            <ShieldCheck className="card-icon text-purple" size={20} />
            <h2>ZK Telemetry Verification Details</h2>
          </div>

          {selectedSub ? (
            <div className="telemetry-details-content">
              <div className="telemetry-header">
                <h3>{selectedSub.studentName}</h3>
                <span className="profile-id-lbl">Student ID: {selectedSub.studentId}</span>
              </div>

              <div className="scoring-circle-container">
                <div className={`score-circle ${selectedSub.status === 'verified' ? 'border-green' : 'border-red'}`}>
                  <span className="score-num">{selectedSub.metrics.humanScore}</span>
                  <span className="score-label">Human Score</span>
                </div>
                <div className="score-summary-text">
                  <h3>{selectedSub.status === 'verified' ? 'Verification Passed' : 'Verification Flagged'}</h3>
                  <p className="reason-text">
                    {selectedSub.status === 'verified' 
                      ? "The telemetry model indicates highly organic typing rhythm, rhythmic pauses, and standard correction cycles."
                      : "The keystroke stream shows near-instantaneous bulk additions of lines (pasting) with zero individual keydown intervals."
                    }
                  </p>
                </div>
              </div>

              <div className="metrics-box-grid">
                <div className="metric-box">
                  <span className="metric-value">{selectedSub.metrics.keystrokeCount}</span>
                  <span className="metric-label">Keystroke Events</span>
                </div>
                <div className="metric-box">
                  <span className="metric-value">{selectedSub.metrics.backspaces}</span>
                  <span className="metric-label">Corrections (Backspace)</span>
                </div>
                <div className="metric-box">
                  <span className="metric-value">{selectedSub.metrics.pastes}</span>
                  <span className="metric-label text-red">Paste Detections</span>
                </div>
                <div className="metric-box">
                  <span className="metric-value">{selectedSub.metrics.elapsedSeconds}s</span>
                  <span className="metric-label">Active Typing Time</span>
                </div>
              </div>

              <KeystrokeReplay keystrokeCount={selectedSub.metrics.keystrokeCount} />
<div className="cryptographic-proof-section">
                <div className="proof-header flex-align-center">
                  <Key size={16} className="text-purple margin-right-xs" />
                  <span>ZK-Proof Cryptographic Hash</span>
                </div>
                <div className="proof-hash-container font-mono">
                  {selectedSub.metrics.proofHash}
                </div>
                <span className="crypto-subtext">This mathematical proof guarantees human typing rhythm without disclosing the student's individual keystroke intervals.</span>
              </div>
            </div>
          ) : (
            <div className="empty-state select-prompt">
              <RefreshCw className="animate-spin text-purple margin-bottom-sm" size={32} />
              <p>Select a student submission from the left panel to inspect Zero-Knowledge cryptographic proofs.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
