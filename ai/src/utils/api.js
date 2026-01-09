import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Project API
export const projectApi = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    return api.post('/projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    return api.put(`/projects/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/projects/${id}`),
  uploadVideo: (id, file) => {
    const formData = new FormData();
    formData.append('intro_video', file);
    return api.post(`/projects/${id}/video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadCSV: (id, file) => {
    const formData = new FormData();
    formData.append('csv_file', file);
    return api.post(`/projects/${id}/csv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  generateVideos: (id) => api.post(`/projects/${id}/generate`),
  exportCSV: (id) => api.get(`/projects/${id}/export`, { responseType: 'blob' })
};

// Lead API
export const leadApi = {
  getByProject: (projectId) => api.get(`/leads/project/${projectId}`),
  getById: (id) => api.get(`/leads/${id}`),
  create: (projectId, data) => api.post(`/leads/project/${projectId}`, data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`)
};

// Landing Page API
export const landingApi = {
  getBySlug: (slug) => api.get(`/landing/${slug}`),
  getVideoStatus: (id) => api.get(`/landing/video/${id}/status`)
};

export default api;
