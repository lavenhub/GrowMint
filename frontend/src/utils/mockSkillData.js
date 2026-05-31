// Feature 4: ZK-Proof SkillGraph Data
// Simulates cryptographic nodes and links representing the verified skill tree of a student.

export const initialSkillGraph = {
  nodes: [
    { id: "System Architecture", group: 1, size: 24, val: 24, score: 94 },
    { id: "API Design", group: 1, size: 18, val: 18, score: 88 },
    { id: "Cryptography", group: 2, size: 20, val: 20, score: 90 },
    { id: "Zero-Knowledge Proofs", group: 2, size: 22, val: 22, score: 92 },
    { id: "Distributed Systems", group: 3, size: 26, val: 26, score: 96 },
    { id: "Fault Tolerance", group: 3, size: 16, val: 16, score: 85 },
    { id: "Database Indexing", group: 4, size: 14, val: 14, score: 80 },
    { id: "Low Latency Networking", group: 4, size: 15, val: 15, score: 82 }
  ],
  links: [
    { source: "System Architecture", target: "API Design" },
    { source: "System Architecture", target: "Distributed Systems" },
    { source: "Distributed Systems", target: "Fault Tolerance" },
    { source: "Distributed Systems", target: "Database Indexing" },
    { source: "Cryptography", target: "Zero-Knowledge Proofs" },
    { source: "System Architecture", target: "Cryptography" },
    { source: "Distributed Systems", target: "Low Latency Networking" },
    { source: "Zero-Knowledge Proofs", target: "System Architecture" }
  ]
};

export const verifiedProjects = {
  "System Architecture": [
    {
      assignmentId: "assignment-1",
      projectName: "Secure Data Pipeline & Parser",
      instructor: "Prof. Kabir",
      date: "2026-05-28",
      impactScore: 94,
      zkProof: "zk-proof-0x2bf9837de891ac3c6e8e2b8d91f28b3c4f5a6b7c",
      verificationStatus: "Verified Human Thought"
    },
    {
      assignmentId: "team-project-1",
      projectName: "Distributed DB Indexer",
      instructor: "Prof. Kabir",
      date: "2026-05-26",
      impactScore: 98,
      zkProof: "zk-proof-0x5f7a2d8e9c1b3f4a5b6c7d8e9f0a1b2c3d4e5f6g",
      verificationStatus: "Verified Team Architect"
    }
  ],
  "API Design": [
    {
      assignmentId: "assignment-1",
      projectName: "Secure Data Pipeline & Parser",
      instructor: "Prof. Kabir",
      date: "2026-05-28",
      impactScore: 88,
      zkProof: "zk-proof-0x2bf9837de891ac3c6e8e2b8d91f28b3c4f5a6b7c",
      verificationStatus: "Verified Human Thought"
    }
  ],
  "Cryptography": [
    {
      assignmentId: "assignment-1",
      projectName: "Secure Data Pipeline & Parser",
      instructor: "Prof. Kabir",
      date: "2026-05-28",
      impactScore: 90,
      zkProof: "zk-proof-0x2bf9837de891ac3c6e8e2b8d91f28b3c4f5a6b7c",
      verificationStatus: "Verified Human Thought"
    }
  ],
  "Zero-Knowledge Proofs": [
    {
      assignmentId: "assignment-1",
      projectName: "Secure Data Pipeline & Parser",
      instructor: "Prof. Kabir",
      date: "2026-05-28",
      impactScore: 92,
      zkProof: "zk-proof-0x2bf9837de891ac3c6e8e2b8d91f28b3c4f5a6b7c",
      verificationStatus: "Verified Human Thought"
    }
  ],
  "Distributed Systems": [
    {
      assignmentId: "team-project-1",
      projectName: "Distributed DB Indexer",
      instructor: "Prof. Kabir",
      date: "2026-05-26",
      impactScore: 96,
      zkProof: "zk-proof-0x5f7a2d8e9c1b3f4a5b6c7d8e9f0a1b2c3d4e5f6g",
      verificationStatus: "Verified Team Architect"
    }
  ],
  "Fault Tolerance": [
    {
      assignmentId: "team-project-1",
      projectName: "Distributed DB Indexer",
      instructor: "Prof. Kabir",
      date: "2026-05-26",
      impactScore: 85,
      zkProof: "zk-proof-0x5f7a2d8e9c1b3f4a5b6c7d8e9f0a1b2c3d4e5f6g",
      verificationStatus: "Verified Team Architect"
    }
  ],
  "Database Indexing": [
    {
      assignmentId: "team-project-1",
      projectName: "Distributed DB Indexer",
      instructor: "Prof. Kabir",
      date: "2026-05-26",
      impactScore: 80,
      zkProof: "zk-proof-0x5f7a2d8e9c1b3f4a5b6c7d8e9f0a1b2c3d4e5f6g",
      verificationStatus: "Verified Team Architect"
    }
  ],
  "Low Latency Networking": [
    {
      assignmentId: "team-project-1",
      projectName: "Distributed DB Indexer",
      instructor: "Prof. Kabir",
      date: "2026-05-26",
      impactScore: 82,
      zkProof: "zk-proof-0x5f7a2d8e9c1b3f4a5b6c7d8e9f0a1b2c3d4e5f6g",
      verificationStatus: "Verified Team Architect"
    }
  ]
};
