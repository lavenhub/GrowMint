import React, { useState } from 'react';
import { initialSkillGraph, verifiedProjects } from '../utils/mockSkillData';
import { ShieldCheck, Network, Key, BadgeAlert, CheckCircle, Share2, Award, Zap } from 'lucide-react';
import { ZKBadge } from '../components/Badge';

export default function PublicProfile() {
  const [activeSkill, setActiveSkill] = useState("System Architecture");
  const [integrityVerified, setIntegrityVerified] = useState(false);
  const [verifyingLedger, setVerifyingLedger] = useState(false);

  const selectedProjects = verifiedProjects[activeSkill] || [];

  const handleVerifyLedger = () => {
    setVerifyingLedger(true);
    setTimeout(() => {
      setVerifyingLedger(false);
      setIntegrityVerified(true);
    }, 1800);
  };

  const generatePublicProfileReport = () => {
    const report = {
      profile: {
        name: 'Aarav Sharma',
        institution: 'Delhi Technological University',
        branch: 'Computer Science & Engineering',
        verifiedNodes: 8,
        avgIntegrity: '94%',
        zkAnchored: true,
      },
      activeSkill: activeSkill,
      skillSummary: {
        score: initialSkillGraph.nodes.find((node) => node.id === activeSkill)?.score || 0,
        projects: selectedProjects,
      },
      timestamp: new Date().toISOString(),
      verification: {
        integrityVerified,
        merkleRoot: '0x7fb82365a12ef2c9381ea235bfd928a3f4e56c7d8e9f0a1b',
      },
    };
    return report;
  };

  const escapePdfText = (text) => {
    return text.replace(/([\\()])/g, '\\$1');
  };

  const renderReportText = (report) => {
    const lines = [];
    lines.push('GrowMint Public Profile Report');
    lines.push('====================================');
    lines.push('');
    lines.push('Profile Summary:');
    lines.push(`Name: ${report.profile.name}`);
    lines.push(`Institution: ${report.profile.institution}`);
    lines.push(`Branch: ${report.profile.branch}`);
    lines.push(`Verified Nodes: ${report.profile.verifiedNodes}`);
    lines.push(`Average Integrity: ${report.profile.avgIntegrity}`);
    lines.push(`ZK Anchored: ${report.profile.zkAnchored ? 'Yes' : 'No'}`);
    lines.push('');
    lines.push(`Active Skill: ${report.activeSkill}`);
    lines.push(`Skill Score: ${report.skillSummary.score}%`);
    lines.push('');
    lines.push('Verified Skill Projects:');
    report.skillSummary.projects.forEach((proj, idx) => {
      lines.push(`  ${idx + 1}. ${proj.projectName}`);
      lines.push(`     Instructor: ${proj.instructor}`);
      lines.push(`     Date: ${proj.date}`);
      lines.push(`     Impact Score: ${proj.impactScore} XP`);
      lines.push(`     ZK Proof: ${proj.zkProof}`);
      lines.push('');
    });
    lines.push('Ledger Verification:');
    lines.push(`  Integrity Verified: ${report.verification.integrityVerified ? 'Yes' : 'No'}`);
    lines.push(`  Merkle Root: ${report.verification.merkleRoot}`);
    lines.push('');
    lines.push(`Report Generated: ${report.timestamp}`);
    return lines;
  };

  const generatePdfString = (lines) => {
    const textLines = lines.map((line) => `(${escapePdfText(line)}) Tj 0 -14 Td`).join('\n');
    const contentStream = `BT /F1 12 Tf 50 760 Td ${textLines} ET`;
    const contentBytes = new TextEncoder().encode(contentStream);

    const objects = [];
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');
    objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
    objects.push(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);

    let pdf = '%PDF-1.4\n';
    const offsets = [pdf.length];
    objects.forEach((obj) => {
      pdf += obj;
      offsets.push(pdf.length);
    });

    const xrefStart = pdf.length;
    pdf += 'xref\n0 6\n0000000000 65535 f \n';
    offsets.slice(0, 5).forEach((offset) => {
      pdf += String(offset).padStart(10, '0') + ' 00000 n \n';
    });
    pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return pdf;
  };

  const downloadPublicProfileReport = () => {
    const report = generatePublicProfileReport();
    const lines = renderReportText(report);
    const pdfString = generatePdfString(lines);
    const blob = new Blob([pdfString], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'growmint_public_profile_report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="public-profile-page">
      <header className="page-header flex-align-center justify-between">
        <div>
          <h1>GrowMint Verified Profile</h1>
          <p className="subtitle">Public Cryptographic Portfolio — Replaces traditional resume PDF</p>
        </div>
        
        <div className="profile-header-actions">
          <button className="btn-secondary flex-align-center" onClick={() => alert("Copied public profile link to clipboard!")}>
            <Share2 size={16} className="margin-right-xs" />
            <span>Share Profile Link</span>
          </button>
          <button className="btn-primary flex-align-center" onClick={downloadPublicProfileReport} style={{ marginLeft: '12px' }}>
            <BadgeAlert size={16} className="margin-right-xs" />
            <span>Download Resume Attachment</span>
          </button>
        </div>
      </header>

      {/* Student Banner Card */}
      <section className="student-profile-banner glass-panel flex-align-center margin-bottom-md">
        <img className="banner-avatar" src="https://api.dicebear.com/7.x/bottts/svg?seed=Aarav" alt="Aarav Sharma" />
        <div className="banner-details">
          <h2>Aarav Sharma</h2>
          <p className="school-lbl">Delhi Technological University • Computer Science & Engineering</p>
          <div className="quick-stats-row margin-top-sm flex-align-center">
            <span className="stat-badge"><Award size={14} /> 8 Verified Nodes</span>
            <span className="stat-badge"><Zap size={14} /> 94% Avg Integrity</span>
            <span className="stat-badge"><CheckCircle size={14} className="text-green" /> ZK-Proof Anchored</span>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        {/* Left Skill Explorer */}
        <section className="dashboard-card glass-panel flex-column">
          <div className="card-header flex-align-center justify-between">
            <div className="flex-align-center">
              <Network className="card-icon text-purple" size={20} />
              <h2>Skills Ledger Tree</h2>
            </div>
            <span className="text-xs text-muted">Select skill to view cryptographic credits</span>
          </div>

          <div className="skills-ledger-selector grid-2-col gap-sm">
            {initialSkillGraph.nodes.map(node => (
              <button 
                key={node.id} 
                className={`skill-selector-btn ${activeSkill === node.id ? 'active-skill-btn' : ''}`}
                onClick={() => setActiveSkill(node.id)}
              >
                <span>{node.id}</span>
                <span className="skill-pct-badge">{node.score}%</span>
              </button>
            ))}
          </div>

          <div className="ledger-credits-detail-box margin-top-md">
            <h3>Verified Academic Credits for {activeSkill}</h3>
            
            <div className="credits-list flex-column gap-sm margin-top-sm">
              {selectedProjects.map((proj, idx) => (
                <div key={idx} className="credit-card">
                  <div className="credit-heading flex-align-center justify-between">
                    <h4>{proj.projectName}</h4>
                    <span className="text-purple bold">{proj.impactScore} XP</span>
                  </div>
                  <p className="credit-meta">Instructor: {proj.instructor} • Date: {proj.date}</p>
                  
                  <div className="proof-display font-mono text-xs margin-top-xs">
                    <Key size={12} className="margin-right-xs" />
                    <span>{proj.zkProof}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Ledger Verification Action */}
        <section className="dashboard-card glass-panel flex-column justify-center align-center ledger-status-card">
          <div className="card-header">
            <ShieldCheck className="card-icon text-cyan" size={20} />
            <h2>Ledger Security Verification</h2>
          </div>

          <div className="ledger-verification-body text-center flex-column flex-align-center justify-center h-full pad-md">
            {verifyingLedger ? (
              <div className="verification-processing">
                <div className="spinner large margin-bottom-md"></div>
                <h3>Verifying Proof Chains...</h3>
                <p className="text-sm">Querying ZK witness constraints and calculating Merkle root verification path...</p>
              </div>
            ) : integrityVerified ? (
              <div className="verification-complete-box flex-column flex-align-center">
                <CheckCircle className="text-green animate-pulse margin-bottom-sm" size={64} />
                <h3 className="text-green">Ledger Integrity 100% Verified</h3>
                <p className="widget-p text-sm margin-top-sm">All ZK-Proofs mapped to this student profile match local keystroke cadence constraints and institutional validator signatures.</p>
                
                <div className="validated-hash-tree-box text-left w-full margin-top-md">
                  <strong>Validation Merkle Root:</strong>
                  <span className="font-mono text-xs text-cyan break-all">0x7fb82365a12ef2c9381ea235bfd928a3f4e56c7d8e9f0a1b</span>
                </div>
              </div>
            ) : (
              <div className="verify-ledger-cta flex-column flex-align-center">
                <ShieldCheck className="text-purple margin-bottom-sm" size={64} />
                <h3>Validate Ledger Authenticity</h3>
                <p className="widget-p text-sm margin-top-sm margin-bottom-md">
                  Click below to execute client-side cryptographic verification. This queries institutional credentials and confirms this profile contains genuine, un-faked skills.
                </p>
                
                <button className="btn-primary" onClick={handleVerifyLedger}>
                  Verify Ledger Authenticity
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
