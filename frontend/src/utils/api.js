import { generateRAGTask } from './mockCurriculum';
import { BACKEND_BASE_URL } from './apiConfig';

function mapBackendResponse(data, taskType, topic, files) {
  return {
    id: `task-${Date.now()}`,
    title: data.title || `${taskType.charAt(0).toUpperCase() + taskType.slice(1)}: ${topic}`,
    type: taskType,
    description: data.description,
    evaluationCriteria:
      data.evaluationCriteria ||
      data.evaluation_criteria ||
      'Assess correctness and adherence to logic trap.',
    uploadedFiles: data.uploadedFiles || files.map((f) => f.name),
    trapQuestion: data.trapQuestion || '',
    trapExplanation: data.trapExplanation || '',
    contextSource: data.uploadedFiles?.[0] || 'None',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    submissions: [],
    source: 'gemini',
  };
}

export const generateRAG = async (topic, taskType, trapType, files) => {
  const formData = new FormData();
  formData.append('topic', topic);
  formData.append('task_type', taskType);
  formData.append('trap_type', trapType);
  files.forEach((file) => formData.append('files', file));

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/rag/generate`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const reason = data.error || `HTTP ${response.status}`;
      console.warn('Backend RAG failed, using local fallback:', reason);
      const fallback = await generateRAGTask(topic, taskType, files, trapType);
      return { ...fallback, source: 'local-fallback', backendError: reason };
    }

    return mapBackendResponse(data, taskType, topic, files);
  } catch (error) {
    console.warn('Backend unreachable, using local fallback:', error.message);
    const fallback = await generateRAGTask(topic, taskType, files, trapType);
    return { ...fallback, source: 'local-fallback', backendError: error.message };
  }
};
