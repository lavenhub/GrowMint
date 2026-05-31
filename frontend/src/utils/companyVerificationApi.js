import { BACKEND_BASE_URL } from './apiConfig';

export async function verifyCompanyProject({ projectDescription, zipFile }) {
  const formData = new FormData();
  formData.append('project_description', projectDescription);
  formData.append('project_zip', zipFile);

  const response = await fetch(`${BACKEND_BASE_URL}/company/verify`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Verification failed (HTTP ${response.status})`);
  }
  return data;
}
