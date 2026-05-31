import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

export function ZKBadge({ status, score }) {
  if (status === 'verified') {
    return (
      <span className="badge-zk badge-verified">
        <ShieldCheck className="badge-icon" size={16} />
        <span>ZK-Proof Verified {score ? `(${score}%)` : ''}</span>
      </span>
    );
  }

  if (status === 'suspicious') {
    return (
      <span className="badge-zk badge-suspicious">
        <ShieldAlert className="badge-icon" size={16} />
        <span>AI Copypaste Detected</span>
      </span>
    );
  }

  return (
      <span className="badge-zk badge-pending">
      <Cpu className="badge-icon" size={16} />
      <span>ZK Validation Pending</span>
    </span>
  );
}

export function ArchitectBadge({ score }) {
  return (
    <span className="badge-zk badge-architect">
      <span className="architect-star">★</span>
      <span>Architect Score: <strong>{score}</strong></span>
    </span>
  );
}
