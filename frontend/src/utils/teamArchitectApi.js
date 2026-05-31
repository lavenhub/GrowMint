import { BACKEND_BASE_URL } from './apiConfig';

export async function createTeamProject({ name, description, host_id, host_name }) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('host_id', host_id);
  formData.append('host_name', host_name);

  const response = await fetch(`${BACKEND_BASE_URL}/team/project/create`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Failed to create project (HTTP ${response.status})`);
  }
  return data;
}

export async function addTeamMember({ projectId, member_id, member_name, role = 'contributor' }) {
  const formData = new FormData();
  formData.append('member_id', member_id);
  formData.append('member_name', member_name);
  formData.append('role', role);

  const response = await fetch(`${BACKEND_BASE_URL}/team/project/${projectId}/member/add`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Failed to add member (HTTP ${response.status})`);
  }
  return data;
}

export async function uploadProjectFile({ projectId, module_name, author_id, file }) {
  const formData = new FormData();
  formData.append('module_name', module_name);
  formData.append('author_id', author_id);
  formData.append('file', file);

  const response = await fetch(`${BACKEND_BASE_URL}/team/project/${projectId}/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Failed to upload file (HTTP ${response.status})`);
  }
  return data;
}

export async function analyzeTeamProject(projectId) {
  const response = await fetch(`${BACKEND_BASE_URL}/team/project/${projectId}/analyze`, {
    method: 'POST',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Failed to analyze project (HTTP ${response.status})`);
  }
  return data;
}

export async function getTeamProject(projectId) {
  const response = await fetch(`${BACKEND_BASE_URL}/team/project/${projectId}`);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Failed to fetch project (HTTP ${response.status})`);
  }
  return data;
}

export async function listTeamProjects(host_id) {
  const params = new URLSearchParams();
  if (host_id) params.append('host_id', host_id);

  const response = await fetch(`${BACKEND_BASE_URL}/team/projects?${params}`);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Failed to list projects (HTTP ${response.status})`);
  }
  return data;
}
