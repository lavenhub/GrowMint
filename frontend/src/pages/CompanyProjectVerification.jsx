import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyCompanyProject } from '../utils/companyVerificationApi';
import { ChevronLeft, Upload, ShieldCheck, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function CompanyProjectVerification() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [zipFile, setZipFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!zipFile) {
      setError('Please upload your project repository ZIP file.');
      return;
    }

    setVerifying(true);
    setError(null);
    setResult(null);
    try {
      const data = await verifyCompanyProject({ projectDescription: description, zipFile });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="company-project-page">
      <header className="page-header flex-align-center">
        <button className="btn-back" onClick={() => navigate('/student')}>
          <ChevronLeft size={20} />
        </button>
        <div className="margin-left-sm">
          <h1>Company Project Verification</h1>
          <p className="subtitle">
            Upload your project ZIP and paste the work description. The AI will verify whether the code matches your claim and issue a certificate if approved.
          </p>
        </div>
      </header>

      <div className="dashboard-grid-equal">
        <section className="dashboard-card glass-panel">
          <div className="card-header">
            <ShieldCheck size={20} className="card-icon" />
            <h2>Verify your work</h2>
          </div>

          <form onSubmit={handleSubmit} className="compact-form">
            <div className="form-group">
              <label>Project description</label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the project you did, the features you built, and what the codebase contains."
              />
            </div>

            <div className="form-group">
              <label>Upload project ZIP</label>
              <div className="file-drop-zone" style={{ padding: '20px 16px' }}>
                <input
                  type="file"
                  id="company-zip-upload"
                  accept=".zip"
                  className="hidden-file-input"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="company-zip-upload" className="drop-zone-label">
                  <Upload size={20} className="upload-icon" />
                  <span>{zipFile ? zipFile.name : 'Click to upload project ZIP'}</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={verifying}>
              {verifying ? 'Verifying project…' : 'Verify project and generate certificate'}
            </button>
            {error && (
              <div className="paste-alert-banner margin-top-md">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}
          </form>
        </section>

        <section className="dashboard-card glass-panel">
          <div className="card-header">
            <FileText size={20} className="card-icon" />
            <h2>How it works</h2>
          </div>
          <ul className="bulk-feature-list">
            <li>Describe what you built in plain language.</li>
            <li>Upload the actual codebase as a ZIP file.</li>
            <li>The AI checks whether the code matches your description.</li>
            <li>If the match is strong, a verification certificate is generated.</li>
            <li>If the code does not match, the request is rejected with a reason.</li>
          </ul>
        </section>
      </div>

      {result && (
        <section className="dashboard-card glass-panel margin-top-md">
          <div className="card-header flex-align-center justify-between">
            <div className="flex-align-center" style={{ gap: 8 }}>
              <CheckCircle2 size={20} className="card-icon text-green" />
              <h2>Verification result</h2>
            </div>
          </div>

          <div className="result-summary">
            <p>
              <strong>Status:</strong> {result.status || 'unknown'}
            </p>
            <p>
              <strong>Confidence:</strong> {result.confidence ?? 'n/a'}%
            </p>
            <p>{result.reason}</p>
          </div>

          {result.certificate && (
            <div className="certificate-box margin-top-md">
              <h3>Generated Certificate</h3>
              <pre>{result.certificate}</pre>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
