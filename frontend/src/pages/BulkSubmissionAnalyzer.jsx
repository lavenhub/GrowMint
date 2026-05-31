import React, { useState } from 'react';
import { analyzeSubmissionsZip } from '../utils/bulkAnalysisApi';
import {
  Archive,
  Upload,
  FileSearch,
  Users,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react';

const STATUS_LABELS = {
  up_to_mark: { label: 'Up to mark', color: 'var(--success)' },
  incomplete: { label: 'Incomplete', color: 'var(--danger)' },
  needs_review: { label: 'Needs review', color: '#f59e0b' },
  suspicious: { label: 'Suspicious', color: '#ef4444' },
};

function StatCard({ icon: Icon, title, value, sub }) {
  return (
    <div className="bulk-stat-card">
      <Icon size={20} className="text-purple" />
      <div>
        <span className="bulk-stat-value">{value}</span>
        <span className="bulk-stat-title">{title}</span>
        {sub && <span className="bulk-stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

export default function BulkSubmissionAnalyzer() {
  const [zipFile, setZipFile] = useState(null);
  const [assignmentTitle, setAssignmentTitle] = useState('Spectra-Sync Guard Protocol');
  const [assignmentDescription, setAssignmentDescription] = useState(
    'Implement Spectra-Sync Guard, 127-byte parser buffer, and RouterHardwareFaultException for 13-byte packets.'
  );
  const [evaluationCriteria, setEvaluationCriteria] = useState(
    'Trap compliance, correctness, code structure, documentation, and originality.'
  );
  const [trapQuestion, setTrapQuestion] = useState(
    "Integrate the 'Spectra-Sync Guard' routine with manual XOR decryption (key 0x4A)."
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!zipFile) return;
    setAnalyzing(true);
    setError(null);
    setReport(null);
    try {
      const result = await analyzeSubmissionsZip({
        zipFile,
        assignmentTitle,
        assignmentDescription,
        evaluationCriteria,
        trapQuestion,
      });
      setReport(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadReportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = report?.classSummary;

  return (
    <div className="bulk-analyzer-page">
      <header className="page-header">
        <div>
          <h1>Class Submission Intelligence</h1>
          <p className="subtitle">
            Upload one ZIP of all student submissions. AI produces a class-wide integrity report and probable grades per student.
          </p>
        </div>
      </header>

      <div className="dashboard-grid-equal">
        <section className="dashboard-card glass-panel">
          <div className="card-header">
            <Archive size={20} className="card-icon" />
            <h2>Upload Class ZIP</h2>
          </div>

          <form onSubmit={handleAnalyze} className="compact-form">
            <div className="form-group">
              <label>ZIP structure</label>
              <p className="text-sm text-muted" style={{ marginBottom: 12, lineHeight: 1.5 }}>
                One folder per student: <code>aarav_sharma/solution.py</code>, <code>priya_patel/main.js</code>, etc.
                Sample: <code>test_data/class_submissions.zip</code>
              </p>
              <div className="file-drop-zone" style={{ padding: '20px 16px' }}>
                <input
                  type="file"
                  id="zip-upload"
                  accept=".zip"
                  className="hidden-file-input"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="zip-upload" className="drop-zone-label">
                  <Upload size={20} className="upload-icon" />
                  <span>{zipFile ? zipFile.name : 'Click to upload class ZIP'}</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Assignment title</label>
              <input value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Assignment description</label>
              <textarea
                rows={3}
                value={assignmentDescription}
                onChange={(e) => setAssignmentDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Evaluation criteria</label>
              <textarea
                rows={2}
                value={evaluationCriteria}
                onChange={(e) => setEvaluationCriteria(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Logic trap (optional)</label>
              <input value={trapQuestion} onChange={(e) => setTrapQuestion(e.target.value)} />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              style={{ justifyContent: 'center' }}
              disabled={!zipFile || analyzing}
            >
              {analyzing ? (
                <>
                  <span className="spinner" />
                  <span>Analyzing class submissions…</span>
                </>
              ) : (
                <>
                  <FileSearch size={18} />
                  <span>Run Class Analysis</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="paste-alert-banner margin-top-md">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </section>

        <section className="dashboard-card glass-panel">
          <div className="card-header">
            <ClipboardList size={20} className="card-icon" />
            <h2>What the report includes</h2>
          </div>
          <ul className="bulk-feature-list">
            <li>Completeness & quality scores per student</li>
            <li>Probable letter grade + numeric score</li>
            <li>Copy/similarity detection between pairs</li>
            <li>Incomplete vs up-to-mark vs suspicious flags</li>
            <li>Logic-trap compliance (pass / partial / fail)</li>
            <li>AI-risk level & educator action notes</li>
            <li>Class executive summary + recommendations</li>
          </ul>
        </section>
      </div>

      {report && summary && (
        <>
          <section className="dashboard-card glass-panel margin-top-md">
            <div className="card-header flex-align-center justify-between">
              <div className="flex-align-center" style={{ gap: 10 }}>
                <Users size={20} className="card-icon" />
                <h2>Class Executive Report</h2>
              </div>
              <button type="button" className="btn-secondary" onClick={downloadReportJson}>
                <Download size={14} />
                <span>Export JSON</span>
              </button>
            </div>

            <p className="bulk-executive-summary">{summary.executiveSummary}</p>
            {summary.integrityNarrative && (
              <p className="bulk-integrity-narrative">{summary.integrityNarrative}</p>
            )}

            <div className="bulk-stats-grid margin-top-md">
              <StatCard icon={Users} title="Submissions" value={summary.totalSubmissions} />
              <StatCard icon={CheckCircle2} title="Up to mark" value={summary.upToMark} />
              <StatCard icon={AlertTriangle} title="Incomplete" value={summary.incomplete} />
              <StatCard icon={ShieldAlert} title="Suspicious" value={summary.suspicious} />
              <StatCard
                icon={ClipboardList}
                title="Avg probable grade"
                value={summary.averageProbableGrade}
                sub="out of 100"
              />
            </div>

            {summary.topRecommendations?.length > 0 && (
              <div className="margin-top-md">
                <h3 style={{ fontSize: '0.9rem', marginBottom: 8 }}>Top recommendations</h3>
                <ul className="bulk-recommendations">
                  {summary.topRecommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.similarityPairs?.length > 0 && (
              <div className="margin-top-md">
                <h3 style={{ fontSize: '0.9rem', marginBottom: 8 }}>Similarity alerts</h3>
                <div className="bulk-similarity-table">
                  {report.similarityPairs.map((p, i) => (
                    <div key={i} className="bulk-sim-row">
                      <span>{p.studentA.replace(/_/g, ' ')} ↔ {p.studentB.replace(/_/g, ' ')}</span>
                      <span className={`sim-badge sim-${p.risk}`}>{p.similarityPercent}% similar</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-muted margin-top-sm">
              Source: {report.source} · {report.generatedAt}
              {report.geminiError && ` · Gemini note: ${report.geminiError}`}
            </p>
          </section>

          <section className="dashboard-card glass-panel margin-top-md">
            <div className="card-header">
              <FileSearch size={20} className="card-icon" />
              <h2>Per-Student Grade Reports</h2>
            </div>

            <div className="bulk-student-list">
              {report.students?.map((student) => {
                const st = STATUS_LABELS[student.status] || STATUS_LABELS.needs_review;
                const open = expandedStudent === student.studentId;
                return (
                  <div key={student.studentId} className="bulk-student-card">
                    <button
                      type="button"
                      className="bulk-student-header"
                      onClick={() =>
                        setExpandedStudent(open ? null : student.studentId)
                      }
                    >
                      <div className="bulk-student-title">
                        <strong>{student.displayName}</strong>
                        <span className="bulk-grade-pill">{student.probableGrade}</span>
                        <span className="bulk-grade-num">{student.probableGradeNumeric}/100</span>
                      </div>
                      <div className="flex-align-center" style={{ gap: 12 }}>
                        <span className="bulk-status-tag" style={{ color: st.color }}>
                          {st.label}
                        </span>
                        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    <div className="bulk-student-metrics">
                      <span>Complete: {student.completenessScore}%</span>
                      <span>Quality: {student.qualityScore}%</span>
                      <span>Integrity: {student.integrityScore}%</span>
                      <span>Trap: {student.trapCompliance || 'unknown'}</span>
                      <span>AI risk: {student.aiRiskLevel}</span>
                    </div>

                    {open && (
                      <div className="bulk-student-detail">
                        <p><strong>Files:</strong> {(student.files || []).join(', ') || '—'}</p>
                        <p><strong>Educator note:</strong> {student.educatorNote}</p>
                        {student.strengths?.length > 0 && (
                          <p><strong>Strengths:</strong> {student.strengths.join('; ')}</p>
                        )}
                        {student.weaknesses?.length > 0 && (
                          <p><strong>Weaknesses:</strong> {student.weaknesses.join('; ')}</p>
                        )}
                        {student.similarityFlags?.length > 0 && (
                          <div className="margin-top-sm">
                            <strong>Similarity flags:</strong>
                            <ul>
                              {student.similarityFlags.map((f, i) => (
                                <li key={i}>
                                  {f.withStudent?.replace(/_/g, ' ')} — {f.similarityPercent}% ({f.risk})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
