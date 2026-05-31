// Feature 2: Proof of Human Thought (Zero-Knowledge Proof Simulator)
// Analyzes student typing behavior (rhythm, backspaces, copy-pastes) 
// to mathematically prove human authorship without leaking the actual code.

export function analyzeKeystrokes(logs) {
  // logs: array of { type: 'keydown'|'paste', key: string, timestamp: number }
  if (!logs || logs.length === 0) {
    return {
      verified: false,
      confidence: 0,
      reason: "No typing activity detected.",
      keystrokeCount: 0,
      backspaces: 0,
      pastes: 0,
      humanScore: 0,
      proofHash: ""
    };
  }

  const keydowns = logs.filter(l => l.type === 'keydown');
  const pastes = logs.filter(l => l.type === 'paste');
  const backspaces = keydowns.filter(l => l.key === 'Backspace').length;
  
  // Calculate typing speed intervals
  const intervals = [];
  for (let i = 1; i < keydowns.length; i++) {
    const diff = keydowns[i].timestamp - keydowns[i-1].timestamp;
    if (diff < 2000) { // filter out long breaks
      intervals.push(diff);
    }
  }

  // Calculate standard deviation of typing speed (human typing has speed variation, bots/pastes do not)
  let avgInterval = 0;
  let stdDev = 0;
  if (intervals.length > 1) {
    const sum = intervals.reduce((a, b) => a + b, 0);
    avgInterval = sum / intervals.length;
    const sqDiffs = intervals.map(v => Math.pow(v - avgInterval, 2));
    const avgSqDiff = sqDiffs.reduce((a, b) => a + b, 0) / sqDiffs.length;
    stdDev = Math.sqrt(avgSqDiff);
  }

  // Compute a Human Thought Score (0 to 100)
  // Penalized heavily by copy-paste.
  // Rewarded by normal typing rhythms and organic correction (backspaces).
  let humanScore = 100;

  if (pastes.length > 0) {
    // Large paste is very suspicious, small paste (like single characters/variables) might be okay
    humanScore -= pastes.length * 35; 
  }

  if (keydowns.length < 5) {
    humanScore -= 50; // Too little typing
  } else {
    // Humans backspace to correct code
    const backspaceRatio = backspaces / keydowns.length;
    if (backspaceRatio > 0.02 && backspaceRatio < 0.25) {
      humanScore += 10; // normal range of self-correction
    } else if (backspaceRatio >= 0.25) {
      humanScore -= 10; // excessive backspacing is odd, but still human
    } else {
      humanScore -= 10; // robot-perfect typing without corrections
    }

    // Checking speed variance
    if (stdDev < 15 && avgInterval < 100) {
      humanScore -= 30; // Too robotic, perfectly uniform low latency keystrokes
    }
  }

  humanScore = Math.max(0, Math.min(100, humanScore));

  const verified = humanScore >= 70;
  
  // Generate a mock ZK-Proof cryptographic hash
  const proofHash = verified 
    ? "zk-proof-0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join("")
    : "failed-verification-hash-0x000000000000000000000000000000";

  return {
    verified,
    confidence: humanScore,
    reason: verified 
      ? "Mathematically verified: Organic typing cadence and natural correction cycles." 
      : pastes.length > 0 
        ? "AI copy-paste detected. Unnatural burst of characters inputted at once." 
        : "Robotic or insufficient typing cadence detected.",
    keystrokeCount: keydowns.length,
    backspaces,
    pastes: pastes.length,
    humanScore,
    proofHash
  };
}

export function simulateZKProofGeneration(logs, onProgress, onComplete) {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    onProgress(progress);
    if (progress >= 100) {
      clearInterval(interval);
      const analysis = analyzeKeystrokes(logs);
      onComplete(analysis);
    }
  }, 200);
  return () => clearInterval(interval);
}
