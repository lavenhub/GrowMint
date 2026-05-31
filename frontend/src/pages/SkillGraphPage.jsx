import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { initialSkillGraph, verifiedProjects } from '../utils/mockSkillData';
import { Network, ShieldCheck, Key, ExternalLink, Calendar, CheckSquare, Award } from 'lucide-react';
import { ZKBadge } from '../components/Badge';

export default function SkillGraphPage() {
  const [graphData, setGraphData] = useState(initialSkillGraph);
  const [selectedNode, setSelectedNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 450 });
  const containerRef = useRef(null);

  // Fallback to pre-selected node if none is selected
  useEffect(() => {
    if (!selectedNode && graphData.nodes.length > 0) {
      setSelectedNode(graphData.nodes[0]);
    }
  }, [graphData]);

  // Adjust graph size to container
  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth || 600,
        height: containerRef.current.clientHeight || 450
      });
    }
  }, []);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const getProjectsForSkill = (skillId) => {
    return verifiedProjects[skillId] || [];
  };

  return (
    <div className="skillgraph-page">
      <header className="page-header">
        <div>
          <h1>ZK-Proof Interactive SkillGraph</h1>
          <p className="subtitle">Every node represents a skill backed by mathematics. Zoom, drag, and click nodes to verify cryptographic proofs.</p>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Left SkillGraph Interactive View */}
        <section className="dashboard-card glass-panel flex-column graph-display-card" ref={containerRef}>
          <div className="card-header flex-align-center justify-between">
            <div className="flex-align-center">
              <Network className="card-icon text-purple animate-pulse" size={20} />
              <h2>Interactive Ledger Graph</h2>
            </div>
            <span className="secure-tag-lbl">⛓️ Live Blockchain Nodes</span>
          </div>

          <div className="graph-container-canvas">
            <ForceGraph2D
              graphData={graphData}
              width={dimensions.width}
              height={dimensions.height}
              nodeColor={(node) => {
                if (selectedNode?.id === node.id) return '#06b6d4'; // Glowing Cyan for active node
                return node.group === 1 ? '#7c3aed' : node.group === 2 ? '#a855f7' : node.group === 3 ? '#ec4899' : '#3b82f6';
              }}
              nodeVal={(node) => node.size}
              nodeLabel={(node) => `${node.id} (${node.score}%)`}
              linkColor={() => 'rgba(124, 58, 237, 0.25)'}
              linkWidth={2}
              onNodeClick={handleNodeClick}
              backgroundColor="#0a0514"
            />
          </div>
          
          <div className="graph-hint-lbl">
            💡 Drag nodes to rearrange. Scroll to zoom. Click nodes to inspect.
          </div>
        </section>

        {/* Right Node Inspector */}
        <section className="dashboard-card glass-panel flex-column inspector-card">
          <div className="card-header">
            <ShieldCheck className="card-icon text-cyan" size={20} />
            <h2>Skill Cryptographic Inspector</h2>
          </div>

          {selectedNode ? (
            <div className="inspector-content flex-column gap-md">
              <div className="selected-skill-header flex-align-center justify-between">
                <div>
                  <h3 className="skill-title-lbl">{selectedNode.id}</h3>
                  <span className="badge-zk badge-open">Node Score: {selectedNode.score}%</span>
                </div>
                <div className="status-orb active"></div>
              </div>

              <div className="verified-projects-section">
                <div className="lbl-title flex-align-center">
                  <CheckSquare size={16} className="text-cyan margin-right-xs" />
                  <span>Verified Credentials Mapping ({getProjectsForSkill(selectedNode.id).length})</span>
                </div>

                <div className="projects-list-scroll gap-sm">
                  {getProjectsForSkill(selectedNode.id).length === 0 ? (
                    <div className="empty-state">
                      <p>No verified assignments recorded yet for this skill.</p>
                    </div>
                  ) : (
                    getProjectsForSkill(selectedNode.id).map((proj, idx) => (
                      <div key={idx} className="project-proof-item">
                        <div className="proj-heading flex-align-center justify-between">
                          <h4>{proj.projectName}</h4>
                          <span className="score-lead">+{proj.impactScore} XP</span>
                        </div>
                        
                        <div className="proj-metadata">
                          <span className="lbl"><Calendar size={12} /> {proj.date}</span>
                          <span className="lbl"><Award size={12} /> {proj.instructor}</span>
                        </div>

                        <div className="proof-hash-box margin-top-xs font-mono">
                          <Key size={12} className="margin-right-xs" />
                          <span className="hash-txt">{proj.zkProof}</span>
                        </div>

                        <div className="verification-foot flex-align-center text-green margin-top-xs text-xs">
                          <ShieldCheck size={12} className="margin-right-xs" />
                          <span>Status: {proj.verificationStatus}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="shareable-embed-section margin-top-auto">
                <p className="widget-p text-xs">This node is cryptographically anchored. Anyone checking your public resume profile can verify these proofs instantly.</p>
              </div>
            </div>
          ) : (
            <div className="empty-state text-center">
              <p>Select a skill node from the graph to inspect cryptographically verified classroom credits.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
