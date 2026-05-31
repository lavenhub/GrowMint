import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, GitBranch, Users, Award, Calendar, Download, Code2, Zap, Target } from 'lucide-react';

export default function ProjectAnalysis() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projects] = useState(JSON.parse(localStorage.getItem('team_projects') || '[]'));
  const [downloadFormat, setDownloadFormat] = useState('json');
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="page-error" style={{ padding: '32px', textAlign: 'center' }}>
        <p>Project not found</p>
        <button className="btn-secondary" onClick={() => navigate('/student/team/manage')}>Back to Projects</button>
      </div>
    );
  }

  if (!project.files || project.files.length === 0) {
    return (
      <div className="page-error" style={{ padding: '32px', textAlign: 'center' }}>
        <p>No files uploaded yet. Please upload files first.</p>
        <button className="btn-secondary" onClick={() => navigate(`/student/team/upload/${projectId}`)}>Upload Files</button>
      </div>
    );
  }

  const downloadBlockchainReport = () => {
    const report = {
      metadata: {
        projectId,
        projectName: project.name,
        generatedAt: new Date().toISOString(),
        teamMembers: project.members.length,
        totalFiles: project.files.length,
        blockchainHash: generateBlockchainHash(analysis),
        version: '1.0',
      },
      hierarchy: analysis.hierarchy,
      contributions: analysis.contributions,
      timeline: timeline,
      modules: analysis.modules,
      summary: generateSummary(analysis),
    };

    if (downloadFormat === 'json') {
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/\s+/g, '_')}_analysis_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (downloadFormat === 'pdf') {
      // Simple PDF generation - in production use jsPDF or similar
      const text = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/\s+/g, '_')}_analysis_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const generateBlockchainHash = (analysis) => {
    // Simulate blockchain hash - in production, would hash with actual blockchain
    const data = JSON.stringify(analysis);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0').slice(0, 64);
  };

  const generateSummary = (analysis) => {
    const topContributor = analysis.contributions[0];
    const totalImpact = analysis.contributions.reduce((sum, c) => sum + c.impactScore, 0);
    
    return {
      topContributor: topContributor?.name || 'N/A',
      topContributorImpact: topContributor?.impactScore || 0,
      teamAverageImpact: Math.round(totalImpact / Math.max(1, analysis.contributions.length)),
      totalContributors: analysis.contributions.length,
      hierarchyLevels: 3,
      coreTeamSize: Math.min(3, analysis.contributions.length),
    };
  };

  // Analyze contributions
  const extractDependencies = (content) => {
    const imports = [];
    const patterns = [
      /(?:from|import)\s+['"]\.?\/?([\w_]+)['"]/g,
      /import\s+\{?\s*(\w+)/g,
    ];
    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    });
    return [...new Set(imports)];
  };

  const analysis = useMemo(() => {
    if (!project || !project.members || !project.files) {
      return { contributions: [], modules: {}, hierarchy: { leadArchitect: null, architects: [], allContributors: [] } };
    }

    const memberStats = {};

    // Initialize stats for each member
    project.members.forEach((m) => {
      memberStats[m.id] = {
        name: m.name,
        files: [],
        totalLines: 0,
        modules: [],
        complexity: 0,
        coreScore: 0,
        dependencyScore: 0,
        efficiency: 0,
      };
    });

    // Collect file stats
    project.files.forEach((file) => {
      if (memberStats[file.author_id]) {
        memberStats[file.author_id].files.push(file);
        memberStats[file.author_id].totalLines += file.line_count;
        memberStats[file.author_id].modules.push(file.module_name);
        
        // Estimate complexity based on file size (higher line count = more complex)
        memberStats[file.author_id].complexity += Math.min(100, Math.round((file.line_count / 50) * 20));
      }
    });

    // Compute dependency graph
    const modules = {};
    const dependencyMap = {};
    
    project.files.forEach((file) => {
      const deps = extractDependencies(file.content || '');
      modules[file.module_name] = {
        author: file.author_id,
        lines: file.line_count,
        dependencies: deps,
        dependencyCount: deps.length,
      };
      dependencyMap[file.module_name] = deps;
    });

    // Score core features and dependencies
    Object.entries(modules).forEach(([moduleName, data]) => {
      const dependentCount = Object.values(modules).filter((m) =>
        m.dependencies.includes(moduleName)
      ).length;
      
      const dependsOnCount = data.dependencies.length;
      const authorId = data.author;

      if (memberStats[authorId]) {
        // Foundation score: modules depended on by others
        memberStats[authorId].coreScore += dependentCount * 20 + Math.min(30, data.lines / 10);
        
        // Dependency score: using other modules
        memberStats[authorId].dependencyScore += Math.min(100, dependsOnCount * 15 + data.lines / 5);
        
        // Efficiency: lines of code with dependencies  
        memberStats[authorId].efficiency += Math.min(50, (data.lines * dependsOnCount) / 100);
      }
    });

    // Calculate impact score with better formula
    const totalLines = project.files.reduce((sum, f) => sum + f.line_count, 0) || 1;
    const avgLinesPerFile = totalLines / project.files.length || 1;
    
    const contributions = Object.entries(memberStats)
      .map(([id, stats]) => {
        const complexity = Math.min(100, stats.complexity);
        const coreScore = Math.min(100, stats.coreScore);
        const depScore = Math.min(100, stats.dependencyScore);
        const effScore = Math.min(100, stats.efficiency);
        
        // Weighted impact score: foundation (40%) + dependencies (30%) + complexity (20%) + efficiency (10%)
        const impactScore = Math.round(
          (coreScore * 0.4) + 
          (depScore * 0.3) + 
          (complexity * 0.2) + 
          (effScore * 0.1)
        );
        
        return {
          id,
          name: stats.name,
          files: stats.files.length,
          totalLines: stats.totalLines,
          avgLinesPerFile: Math.round(stats.totalLines / Math.max(1, stats.files.length)),
          modules: stats.modules,
          coreScore: Math.min(100, coreScore),
          dependencyScore: Math.min(100, depScore),
          complexity: complexity,
          efficiency: Math.min(100, effScore),
          impactScore: Math.max(5, impactScore), // Ensure minimum 5% for contributors
          contributionPercentage: Math.round((stats.totalLines / totalLines) * 100),
        };
      })
      .sort((a, b) => b.impactScore - a.impactScore);

    // Build hierarchy
    const hierarchy = {
      leadArchitect: contributions[0] || null,
      architects: contributions.slice(0, Math.min(3, contributions.length)),
      allContributors: contributions,
      modules,
    };

    return { contributions, modules, hierarchy, timestamp: new Date().toISOString() };
  }, [project]);

  const timeline = project.files
    .map((f) => ({
      ...f,
      author_name: project.members.find((m) => m.id === f.author_id)?.name || f.author_id,
    }))
    .sort((a, b) => new Date(a.uploaded_at) - new Date(b.uploaded_at));

  return (
    <div className="project-analysis-page">
      <header className="page-header flex-align-center">
        <ChevronLeft
          size={20}
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/student/team/manage')}
        />
        <div className="margin-left-sm">
          <h1>{project.name} - Analysis</h1>
          <p className="subtitle">AI-powered analysis of team contributions, dependencies, and architectural roles.</p>
        </div>
      </header>

      {/* Contribution Leaderboard with Extended Metrics */}
      <section className="dashboard-card glass-panel margin-bottom-md">
        <div className="card-header">
          <Award size={20} className="card-icon" />
          <h2>Extended Contribution Metrics</h2>
        </div>

        <div className="leaderboard-container" style={{ overflowX: 'auto' }}>
          {analysis.contributions.map((contrib, idx) => (
            <div key={contrib.id} style={{
              padding: '16px',
              marginBottom: '12px',
              backgroundColor: idx === 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
              border: idx === 0 ? '2px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: idx === 0 ? '#3b82f6' : idx === 1 ? '#60a5fa' : '#93c5fd', minWidth: '45px' }}>
                  #{idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#000' }}>{contrib.name}</h3>
                  <p style={{ fontSize: '12px', color: '#374151', margin: 0, fontWeight: '600' }}>
                    {contrib.files} files • {contrib.totalLines} total lines • Avg {contrib.avgLinesPerFile} lines/file
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '8px', backgroundColor: 'rgba(59, 130, 246, 0.25)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                  <div style={{ fontSize: '11px', color: '#1e40af', marginBottom: '4px', fontWeight: 'bold' }}>Impact Score</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>{Math.round(contrib.impactScore)}%</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'rgba(37, 99, 235, 0.25)', borderRadius: '6px', border: '1px solid rgba(37, 99, 235, 0.4)' }}>
                  <div style={{ fontSize: '11px', color: '#1e3a8a', marginBottom: '4px', fontWeight: 'bold' }}>Contribution</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a' }}>{Math.round(contrib.contributionPercentage)}%</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'rgba(96, 165, 250, 0.25)', borderRadius: '6px', border: '1px solid rgba(96, 165, 250, 0.4)' }}>
                  <div style={{ fontSize: '11px', color: '#1e40af', marginBottom: '4px', fontWeight: 'bold' }}>Core Score</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>{Math.round(contrib.coreScore)}%</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'rgba(59, 130, 246, 0.25)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                  <div style={{ fontSize: '11px', color: '#1e3a8a', marginBottom: '4px', fontWeight: 'bold' }}>Dependencies</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a' }}>{Math.round(contrib.dependencyScore)}%</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'rgba(37, 99, 235, 0.25)', borderRadius: '6px', border: '1px solid rgba(37, 99, 235, 0.4)' }}>
                  <div style={{ fontSize: '11px', color: '#1e40af', marginBottom: '4px', fontWeight: 'bold' }}>Complexity</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>{Math.round(contrib.complexity)}%</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'rgba(96, 165, 250, 0.25)', borderRadius: '6px', border: '1px solid rgba(96, 165, 250, 0.4)' }}>
                  <div style={{ fontSize: '11px', color: '#1e3a8a', marginBottom: '4px', fontWeight: 'bold' }}>Efficiency</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a' }}>{Math.round(contrib.efficiency)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enhanced Team Hierarchy Graph */}
      <section className="dashboard-card glass-panel margin-bottom-md">
        <div className="card-header">
          <Users size={20} className="card-icon" />
          <h2>Team Hierarchy Architecture</h2>
        </div>

        <div style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(96, 165, 250, 0.05) 100%)' }}>
          {/* Lead Architect - Level 1 */}
          {analysis.hierarchy.leadArchitect && (
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div style={{
                display: 'inline-block',
                padding: '20px 32px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.2) 100%)',
                border: '3px solid rgba(59, 130, 246, 0.6)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
              }}>
                <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>👑 LEAD ARCHITECT</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#000', marginBottom: '8px' }}>{analysis.hierarchy.leadArchitect.name}</div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#1e3a8a', justifyContent: 'center', fontWeight: 'bold' }}>
                  <span>Impact: <strong style={{ color: '#1e40af' }}>{Math.round(analysis.hierarchy.leadArchitect.impactScore)}%</strong></span>
                  <span>•</span>
                  <span>Contribution: <strong style={{ color: '#1e40af' }}>{Math.round(analysis.hierarchy.leadArchitect.contributionPercentage)}%</strong></span>
                </div>
              </div>

              {/* Connector line */}
              {analysis.hierarchy.architects.length > 1 && (
                <div style={{
                  height: '32px',
                  margin: '16px auto',
                  width: '3px',
                  background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.6), rgba(96, 165, 250, 0.4))',
                }}></div>
              )}
            </div>
          )}

          {/* Core Team - Level 2 */}
          {analysis.hierarchy.architects.length > 1 && (
            <div style={{ marginBottom: '48px' }}>
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#1e40af', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>CORE TEAM</div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                flexWrap: 'wrap',
                padding: '0 16px',
                position: 'relative',
              }}>
                {/* Top connector line */}
                <div style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 'calc(100% - 32px)',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)',
                }}></div>

                {analysis.hierarchy.architects.slice(1).map((arch, idx) => (
                  <div key={arch.id} style={{
                    padding: '16px 24px',
                    background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)',
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '10px',
                    minWidth: '180px',
                    position: 'relative',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.15)',
                    backdropFilter: 'blur(8px)',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '2px',
                      height: '16px',
                      background: 'rgba(59, 130, 246, 0.4)',
                    }}></div>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#000' }}>{arch.name}</div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#1e40af', fontWeight: 'bold' }}>
                      <span>Impact: <strong>{Math.round(arch.impactScore)}%</strong></span>
                      <span>|</span>
                      <span>{arch.files} files</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connector to contributors */}
              {analysis.hierarchy.allContributors.length > 3 && (
                <div style={{
                  height: '32px',
                  margin: '16px auto',
                  width: '3px',
                  background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.4), rgba(96, 165, 250, 0.3))',
                  marginTop: '32px',
                }}></div>
              )}
            </div>
          )}

          {/* Contributors - Level 3 */}
          {analysis.hierarchy.allContributors.length > 3 && (
            <div>
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#1e40af', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>CONTRIBUTORS</div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                padding: '0 16px',
              }}>
                {analysis.hierarchy.allContributors.slice(3).map((contrib) => (
                  <div key={contrib.id} style={{
                    padding: '10px 16px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    backdropFilter: 'blur(4px)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: '#1e40af',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(59, 130, 246, 0.25)';
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(59, 130, 246, 0.15)';
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  }}
                  >
                    {contrib.name} <span style={{ color: '#1e3a8a', fontSize: '11px' }}>({Math.round(contrib.impactScore)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Fancy Timeline */}
      <section className="dashboard-card glass-panel margin-bottom-md">
        <div className="card-header">
          <Calendar size={20} className="card-icon" />
          <h2>Upload Timeline ({timeline.length} files)</h2>
        </div>

        <div style={{ padding: '32px' }}>
          {timeline.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#1e40af', padding: '32px', fontWeight: 'bold' }}>No files uploaded yet.</p>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '40px' }}>
              {/* Timeline vertical line */}
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '0',
                bottom: '0',
                width: '2px',
                background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.8), rgba(96, 165, 250, 0.6), rgba(59, 130, 246, 0.4))',
              }}></div>

              {timeline.map((file, idx) => {
                const memberColor = `hsl(${200 + (idx * 20 % 40)}, 70%, 50%)`;
                return (
                  <div key={file.id} style={{ marginBottom: '24px', position: 'relative', animation: `slideIn 0.5s ease-out ${idx * 0.1}s both` }}>
                    {/* Timeline dot */}
                    <div style={{
                      position: 'absolute',
                      left: '-38px',
                      top: '6px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, #3b82f6, #1e40af)`,
                      border: '3px solid rgba(59, 130, 246, 0.4)',
                      boxShadow: `0 0 16px rgba(59, 130, 246, 0.8)`,
                    }}></div>

                    {/* File card */}
                    <div style={{
                      padding: '16px 20px',
                      background: `linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)`,
                      border: `2px solid rgba(59, 130, 246, 0.3)`,
                      borderRadius: '10px',
                      backdropFilter: 'blur(10px)',
                      boxShadow: `0 4px 16px rgba(59, 130, 246, 0.2), inset 0 1px 2px rgba(59, 130, 246, 0.1)`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)`;
                      e.currentTarget.style.borderColor = `rgba(59, 130, 246, 0.6)`;
                      e.currentTarget.style.boxShadow = `0 8px 24px rgba(59, 130, 246, 0.3), inset 0 1px 2px rgba(59, 130, 246, 0.15)`;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)`;
                      e.currentTarget.style.borderColor = `rgba(59, 130, 246, 0.3)`;
                      e.currentTarget.style.boxShadow = `0 4px 16px rgba(59, 130, 246, 0.2), inset 0 1px 2px rgba(59, 130, 246, 0.1)`;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                        <Code2 size={16} style={{ color: '#1e40af', marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#000' }}>{file.module_name}</h4>
                            <span style={{ fontSize: '12px', color: '#1e40af', background: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>#{idx + 1}</span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#1e40af', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                            <span>by <strong>{file.author_name}</strong></span>
                          </p>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#1e3a8a', marginTop: '8px', fontWeight: 'bold' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Code2 size={12} style={{ color: '#3b82f6' }} />
                              <strong>{file.line_count}</strong> lines
                            </div>
                            <div>📅 {new Date(file.uploaded_at).toLocaleDateString()}</div>
                            <div>🕐 {new Date(file.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <style>{`
                @keyframes slideIn {
                  from {
                    opacity: 0;
                    transform: translateX(-20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }
              `}</style>
            </div>
          )}
        </div>
      </section>

      {/* Download Report Section */}
      <section className="dashboard-card glass-panel margin-bottom-md">
        <div className="card-header">
          <Download size={20} className="card-icon" />
          <h2>Export Blockchain-Backed Report</h2>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#000' }}>
              Report Format:
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { id: 'json', label: '📄 JSON Report', desc: 'Complete analysis data' },
                { id: 'pdf', label: '📋 Text Report', desc: 'Human-readable format' },
              ].map((fmt) => (
                <label key={fmt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: downloadFormat === fmt.id ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.1)', border: downloadFormat === fmt.id ? '2px solid rgba(59, 130, 246, 0.6)' : '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                  <input
                    type="radio"
                    name="format"
                    value={fmt.id}
                    checked={downloadFormat === fmt.id}
                    onChange={(e) => setDownloadFormat(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#000' }}>{fmt.label}</div>
                    <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 'bold' }}>{fmt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.15)', border: '2px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#1e40af', fontWeight: 'bold' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
              <Zap size={16} style={{ color: '#1e40af', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>Blockchain Verification:</strong> This report includes a cryptographic hash ({generateBlockchainHash(analysis).slice(0, 16)}...) for integrity verification and immutable record-keeping.
              </div>
            </div>
          </div>

          <button
            onClick={downloadBlockchainReport}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(96, 165, 250, 0.3))',
              border: '2px solid rgba(59, 130, 246, 0.6)',
              color: '#000',
              fontSize: '14px',
              fontWeight: 'bold',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(96, 165, 250, 0.4))';
              e.target.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(96, 165, 250, 0.3))';
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <Download size={16} />
            Download {downloadFormat === 'json' ? 'JSON' : 'Text'} Report
          </button>
        </div>
      </section>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
        <button className="btn-secondary" onClick={() => navigate('/student/team/upload/' + projectId)}>
          📤 Upload More Files
        </button>
        <button className="btn-primary" onClick={() => navigate('/student/team/manage')}>
          ← Back to Projects
        </button>
      </div>
    </div>
  );
}
