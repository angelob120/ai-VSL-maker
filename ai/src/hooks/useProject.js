import { useState, useCallback } from 'react';
import { projectApi } from '../utils/api';

export const useProject = () => {
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectApi.getAll();
      setProjects(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProject = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectApi.getById(id);
      setProject(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectApi.create(data);
      const newProject = response.data.data;
      setProject(newProject);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectApi.update(id, data);
      const updatedProject = response.data.data;
      setProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await projectApi.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (project?.id === id) setProject(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [project]);

  const uploadVideo = useCallback(async (id, file) => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectApi.uploadVideo(id, file);
      const updatedProject = response.data.data;
      setProject(prev => prev?.id === id ? { ...prev, ...updatedProject } : prev);
      return updatedProject;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadCSV = useCallback(async (id, file) => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectApi.uploadCSV(id, file);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateVideos = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectApi.generateVideos(id);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportCSV = useCallback(async (id) => {
    try {
      const response = await projectApi.exportCSV(id);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vsl_export_${id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    }
  }, []);

  return {
    project,
    projects,
    loading,
    error,
    setProject,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    uploadVideo,
    uploadCSV,
    generateVideos,
    exportCSV,
    clearError: () => setError(null)
  };
};

export default useProject;
