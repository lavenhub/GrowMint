import { BACKEND_BASE_URL } from './apiConfig';

export async function analyzeSubmissionsZip({
  zipFile,
  assignmentTitle,
  assignmentDescription,
  evaluationCriteria,
  trapQuestion,
}) {
  const formData = new FormData();
  formData.append('zip_file', zipFile);
  formData.append('assignment_title', assignmentTitle || 'Class Assignment');
  formData.append('assignment_description', assignmentDescription || '');
  formData.append('evaluation_criteria', evaluationCriteria || '');
  formData.append('trap_question', trapQuestion || '');

  const response = await fetch(`${BACKEND_BASE_URL}/submissions/analyze-zip`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Analysis failed (HTTP ${response.status})`);
  }
  return data;
}
