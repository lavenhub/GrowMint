import React, { useState } from 'react';
import { initialTeamProjects, calculateArchitectScores } from '../utils/mockTeamAnalysis';
import { Users, Award, ShieldCheck, GitBranch, ThumbsUp, Code } from 'lucide-react';
import { ArchitectBadge } from '../components/Badge';

export default function TeamContribution() {
  const [projects, setProjects] = useState(initialTeamProjects);
  const [activeProj, setActiveProj] = useState(projects[0]);
  const [teammateVotes, setTeammateVotes] = useState(activeProj.votes);
  const [userVoted, setUserVoted] = useState(false);

  const scores = calculateArchitectScores(activeProj.modules);

  const handleVote = (author) => {
    if (userVoted) return;
    
    setTeammateVotes(prev => {
      const updated = {
        ...prev,
        [author]: (prev[author] || 0) + 1
      };
      
      // Update in active projects list
      setProjects(curr => curr.map(p => p.id === activeProj.id ? { ...p, votes: updated, verifiedByTeammates: true } : p));
      setUserVoted(true);
      return updated;
    });
  };

  return (
    <div className="team-contribution-page">
      <header className="page-header">
        <div>
          <h1>Anonymous Team Architect Verification</h1>
          <p className="subtitle">Backend analyzes repository module import structures. Teammates digitally verify core foundational architects.</p>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Left Dependency Analysis Visualizer */}
        <section className="dashboard-card glass-panel flex-column">
          <div className="card-header">
            <GitBranch className="card-icon text-cyan" size={20} />
            <h2>Repository Import Dependency Graph</h2>
          </div>

          <div className="repo-map-container flex-column justify-center align-center">
            <p className="widget-p text-sm margin-bottom-md">Import dependency chains detected in your <code>main</code> branch commit tree:</p>
            
            <div className="dependency-flow-tree">
              {/* Foundational Module */}
              <div className="module-node core-architect-node">
                <span className="node-crown">👑 Foundational Architecture</span>
                <h3>Core Engine</h3>
                <span className="lbl-author">Authored by: <strong>Aarav Sharma</strong></span>
                <span className="lbl-lines">1,200 lines written</span>
              </div>

              {/* Connecting lines */}
              <div className="connector-lines-down">
                <div className="line"></div>
                <div className="fork-lines">
                  <div className="branch-left"></div>
                  <div className="branch-right"></div>
                </div>
              </div>

              {/* Dependent Modules */}
              <div className="dependent-nodes-row">
                <div className="module-node dependent-node">
                  <h3>REST API Gateway</h3>
                  <span className="lbl-author">Priya Patel</span>
                  <span className="lbl-lines">600 lines</span>
                  <span className="lbl-dep">Depends on: <em>Core Engine</em></span>
                </div>

                <div className="module-node dependent-node">
                  <h3>Caching Layer</h3>
                  <span className="lbl-author">John Doe</span>
                  <span className="lbl-lines">400 lines</span>
                  <span className="lbl-dep">Depends on: <em>Core Engine</em></span>
                </div>
              </div>
            </div>
            
            <div className="graph-subtext-box">
              <Code size={14} className="text-cyan margin-right-xs" />
              <span><strong>Structural Logic:</strong> Because other modules require <code>Core Engine</code>, the system assigns a 4.2x multiplier to Aarav Sharma's architectural integrity rating.</span>
            </div>
          </div>
        </section>

        {/* Right Architect Ratings & Vote */}
        <section className="dashboard-card glass-panel flex-column">
          <div className="card-header">
            <Award className="card-icon text-purple" size={20} />
            <h2>Architect Impact Leaderboard</h2>
          </div>

          <div className="leaderboard-container flex-column gap-md">
            <div className="leaderboard-rows-list">
              {scores.map((scoreCard, index) => {
                const totalVotes = teammateVotes[scoreCard.name] || 0;
                
                return (
                  <div key={scoreCard.name} className="leaderboard-row-item">
                    <div className="rank-badge">{index + 1}</div>
                    
                    <div className="lead-info">
                      <h3>{scoreCard.name}</h3>
                      <span className="subtext">Modules: {scoreCard.contributions.join(', ')}</span>
                    </div>

                    <div className="lead-score-details">
                      <ArchitectBadge score={scoreCard.impactScore} />
                      <span className="votes-lbl">{totalVotes} teammate confirmations</span>
                    </div>

                    <div className="lead-actions">
                      <button 
                        className={`btn-vote ${userVoted ? 'btn-voted-disabled' : ''}`}
                        onClick={() => handleVote(scoreCard.name)}
                        disabled={userVoted}
                        title="Verify teammate contributed the architectural foundation"
                      >
                        <ThumbsUp size={14} />
                        <span>{userVoted ? 'Voted' : 'Confirm'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="collaboration-verification-box">
              <div className="box-header flex-align-center text-green">
                <ShieldCheck size={16} className="margin-right-xs" />
                <span>Teammate Peer Consensus</span>
              </div>
              <p className="widget-p text-sm">When all team members sign off, Aarav's <strong>Architect Score ({scores[0]?.impactScore})</strong> is cemented as a cryptographic achievement on his ZK-Proof SkillGraph.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
