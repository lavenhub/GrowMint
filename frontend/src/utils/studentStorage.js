import { initialAssignments } from './mockCurriculum';

const ASSIGNMENTS_KEY = 'spectra_assignments';
const STUDENT_ID = 'std-1';

export function loadAssignments() {
  try {
    const saved = localStorage.getItem(ASSIGNMENTS_KEY);
    return saved ? JSON.parse(saved) : initialAssignments;
  } catch {
    return initialAssignments;
  }
}

export function getSubmission(assignmentId) {
  try {
    const raw = localStorage.getItem(`submitted_${assignmentId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStudentSubmissionFromAssignment(assignment) {
  const local = getSubmission(assignment.id);
  if (local) return local;
  return assignment.submissions?.find((s) => s.studentId === STUDENT_ID) || null;
}

export function getAssignmentStatus(assignment) {
  const sub = getStudentSubmissionFromAssignment(assignment);
  if (!sub) return { state: 'pending', submission: null };
  return {
    state: sub.status === 'verified' ? 'verified' : sub.status === 'suspicious' ? 'suspicious' : 'submitted',
    submission: sub,
  };
}

export function getStudentMetrics() {
  const assignments = loadAssignments();
  const subs = assignments
    .map((a) => getStudentSubmissionFromAssignment(a))
    .filter(Boolean);

  const verified = subs.filter((s) => s.status === 'verified');
  const avgScore =
    subs.length > 0
      ? Math.round(
          subs.reduce((sum, s) => sum + (s.metrics?.humanScore ?? s.humanScore ?? 0), 0) / subs.length
        )
      : null;

  return {
    totalAssignments: assignments.length,
    submittedCount: subs.length,
    verifiedCount: verified.length,
    pendingCount: assignments.length - subs.length,
    avgVerificationScore: avgScore,
  };
}

export function getCodeDraft(assignmentId) {
  return localStorage.getItem(`code_${assignmentId}`) || '';
}

export function getStarterCode(assignment) {
  const trap = assignment.trapQuestion || '';
  const topic = assignment.title || 'assignment';
  return `// ${topic}
// Logic trap requirement:
// ${trap}

// Implement your solution below. Type naturally — keystrokes are logged for ZK proof.

function solution(input) {
  
}
`;
}
