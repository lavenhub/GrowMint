// Feature 1: AI-Resilient Curriculum Engine
// Generates assignments with built-in logic traps that standard AI models fail to solve.

export const initialAssignments = [];

// Updated to async generation using AI service
export async function generateRAGTask(topic, type, files, trapType) {
  const fileNames = files.map(f => f.name || f);
  const baseTopic = topic || "General Concepts";
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  // Build prompt for AI
  const prompt = `You are an educator generating a ${typeLabel} on "${baseTopic}". Use the following context files: ${fileNames.join(", ") || "none"}. Include a logic trap of type "${trapType}". Provide a detailed assignment description, required deliverables, and evaluation criteria.`;

  // Call AI service (mocked if unavailable)
  let aiResponse;
  try {
    const { generateContent } = await import('./aiService');
    aiResponse = await generateContent(prompt);
  } catch (e) {
    console.warn('AI service unavailable, falling back to default generation');
    aiResponse = {
      description: `Design and implement a ${typeLabel} on "${baseTopic}" using context from: ${fileNames.join(', ') || 'uploaded lecture notes'}. Students must satisfy the embedded logic trap (${trapType}) and document design decisions.`,
      criteria: 'Correctness, trap compliance, code quality, and use of course-specific constraints from the uploaded materials.',
    };
  }

  // Logic trap definitions
  let trapQuestion = "";
  let trapExplanation = "";
  switch(trapType) {
    case 'memory':
      trapQuestion = `Implement the algorithm for ${baseTopic} ensuring the internal state buffer allocation size is strictly limited to exactly 127 bytes. Do not exceed this limit.`;
      trapExplanation = `Standard LLMs (like ChatGPT or Claude) will implement a standard buffer of 128, 256, or 512 bytes following typical textbook examples. By enforcing a strict 127-byte boundary, any student code that passes standard tests but fails our 127-byte boundary telemetry checker will be instantly flagged.`;
      break;
    case 'no-standard-lib':
      trapQuestion = `Write a custom solution for ${baseTopic} without importing standard utility libraries or built-in helper functions (e.g., no Array.prototype.sort or Math.max). You must implement your own primitive helper functions.`;
      trapExplanation = `AIs depend heavily on standard libraries to generate concise code. Forcing a primitive, manual implementation of helpers (e.g., custom sorting or custom maximum finding) breaks the LLM's standard generation patterns, forcing manual logic.`;
      break;
    case 'edge-case':
      trapQuestion = `In your ${baseTopic} solution, you must explicitly throw an exception or return a custom error state if the input packet length is exactly 13 bytes.`;
      trapExplanation = `AIs rarely build obscure, arbitrary input checks (like checking for length exactly 13) unless explicitly prompted. Since this requirement is embedded in the local class notes context, an AI-generated solution will omit it, failing the edge case test suite.`;
      break;
    case 'quantum-sync':
    default:
      trapQuestion = `Integrate the specific 'Spectra-Sync Guard' routine discussed in the notes to verify timestamps in the ${baseTopic} pipeline.`;
      trapExplanation = `ChatGPT/Claude will hallucinate NTP synchronization or standard cryptography libraries. 'Spectra-Sync Guard' is an internal custom function described in the class notes context. Cheaters will use standard libraries and fail verification.`;
  }

  return {
    id: `task-${Date.now()}`,
    title: `${typeLabel}: ${baseTopic}`,
    type: type,
    description: aiResponse.description || `Develop the ${type} module for ${baseTopic} with constraints.`,
    evaluationCriteria: aiResponse.criteria || "Assess correctness and adherence to logic trap.",
    uploadedFiles: fileNames.length > 0 ? fileNames : ["no_context_provided.txt"],
    trapQuestion,
    trapExplanation,
    voiceRequirement: true,
    voicePrompt: 'Record a short spoken explanation describing your solution, algorithm choices, and how you satisfied the logic trap.',
    contextSource: fileNames[0] || "None",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    submissions: []
  };
}
