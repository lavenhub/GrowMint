// Feature 3: Anonymous Team Architect Verification
// Analyzes shared repository contributions, building a dependency map 
// to reveal who authored the core system architecture that others integrated with.

export const initialTeamProjects = [
  {
    id: "team-project-1",
    name: "Distributed DB Indexer",
    teamName: "ByteStorm",
    modules: [
      { id: "mod-1", name: "Core Engine", author: "Aarav Sharma", codeLines: 1200, dependentModules: [] },
      { id: "mod-2", name: "REST API Gateway", author: "Priya Patel", codeLines: 600, dependentModules: ["Core Engine"] },
      { id: "mod-3", name: "Caching Layer (Redis)", author: "John Doe", codeLines: 400, dependentModules: ["Core Engine"] },
      { id: "mod-4", name: "OAuth Auth Handler", author: "Sara Smith", codeLines: 350, dependentModules: ["REST API Gateway"] }
    ],
    verifiedByTeammates: false,
    votes: { "Aarav Sharma": 1, "Priya Patel": 0, "John Doe": 0, "Sara Smith": 0 } // initial votes
  }
];

export function calculateArchitectScores(modules) {
  // Modules: { id, name, author, codeLines, dependentModules: [moduleName] }
  // Architect Impact Score calculations:
  // - Base lines of code written.
  // - High multipliers for modules that other modules depend on (foundational modules).
  
  const authorScores = {};
  
  // Initialize
  modules.forEach(m => {
    if (!authorScores[m.author]) {
      authorScores[m.author] = {
        name: m.author,
        linesWritten: 0,
        dependencyCount: 0,
        impactScore: 0,
        contributions: []
      };
    }
    authorScores[m.author].linesWritten += m.codeLines;
    authorScores[m.author].contributions.push(m.name);
  });

  // Calculate dependencies
  modules.forEach(m => {
    m.dependentModules.forEach(depName => {
      // Find the author of the dependency module
      const depModule = modules.find(mod => mod.name === depName);
      if (depModule) {
        authorScores[depModule.author].dependencyCount += 1;
      }
    });
  });

  // Calculate final Architect Impact Score:
  // Formula: (linesWritten * 0.05) + (dependencyCount * 25)
  // Max score capped at 99.
  Object.keys(authorScores).forEach(auth => {
    const data = authorScores[auth];
    let score = Math.round((data.linesWritten * 0.04) + (data.dependencyCount * 22));
    data.impactScore = Math.min(99, Math.max(10, score));
  });

  // Sort by impact score descending
  return Object.values(authorScores).sort((a, b) => b.impactScore - a.impactScore);
}
