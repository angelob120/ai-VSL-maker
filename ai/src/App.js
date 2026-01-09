import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Rocket, Download, RefreshCw } from 'lucide-react';
import {
  VideoUpload,
  LeadDataUpload,
  VideoDisplay,
  PageCustomization,
  LeadsTable,
  Preview,
  SavedVideos,
  LandingPage
} from './components';
import { useProject } from './hooks/useProject';
import { leadApi } from './utils/api';
import './App.css';

// Check if we're viewing a landing page
const getLandingSlug = () => {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#site-')) {
    return hash.substring(1); // Remove the #
  }
  return null;
};

const defaultSettings = {
  display_mode: 'small_bubble',
  position: 'bottom_right',
  shape: 'circle',
  video_title: 'A video for you 👋',
  button_text: 'Book a Call',
  button_link: 'https://calendly.com/',
  accent_color: '#6366f1',
  text_color: '#ffffff',
  background_color: '#3b82f6',
  dark_mode: true
};

function App() {
  // Check for landing page slug first
  const [landingSlug, setLandingSlug] = useState(getLandingSlug);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setLandingSlug(getLandingSlug());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // If we have a landing slug, render the landing page
  if (landingSlug) {
    return <LandingPage slug={landingSlug} />;
  }

  return <MainApp />;
}

function MainApp() {
  const {
    project,
    loading,
    error,
    fetchProject,
    createProject,
    updateProject,
    uploadVideo,
    uploadCSV,
    generateVideos,
    exportCSV,
    clearError
  } = useProject();

  const [videoFile, setVideoFile] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [leads, setLeads] = useState([]);
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState(null);
  const [csvUploadResult, setCsvUploadResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize or load existing project
  useEffect(() => {
    const initProject = async () => {
      try {
        // Try to get existing project from URL or create new one
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('project');

        if (projectId) {
          const data = await fetchProject(projectId);
          setSettings({ ...defaultSettings, ...data });
          setLeads(data.leads || []);
          setVideos(data.videos || []);
          setStats(data.stats || null);
        } else {
          // Create a new project
          const newProject = await createProject({ name: 'New VSL Project' });
          window.history.replaceState(null, '', `?project=${newProject.id}`);
        }
      } catch (err) {
        console.error('Failed to initialize project:', err);
        // Create new project on error
        try {
          const newProject = await createProject({ name: 'New VSL Project' });
          window.history.replaceState(null, '', `?project=${newProject.id}`);
        } catch (createErr) {
          toast.error('Failed to create project');
        }
      }
    };

    initProject();
  }, []);

  // Handle video upload
  const handleVideoUpload = useCallback(async (file) => {
    setVideoFile(file);
    
    if (project?.id) {
      try {
        await uploadVideo(project.id, file);
        toast.success('Video uploaded successfully');
      } catch (err) {
        toast.error('Failed to upload video');
      }
    }
  }, [project, uploadVideo]);

  // Handle video removal
  const handleVideoRemove = useCallback(async () => {
    setVideoFile(null);
    if (project?.id) {
      try {
        await updateProject(project.id, { intro_video_url: null, intro_video_filename: null });
        toast.success('Video removed');
      } catch (err) {
        toast.error('Failed to remove video');
      }
    }
  }, [project, updateProject]);

  // Handle CSV upload
  const handleCSVUpload = useCallback(async (file) => {
    if (!project?.id) return;

    try {
      const result = await uploadCSV(project.id, file);
      setCsvUploadResult(result);
      
      // Refresh project data
      const data = await fetchProject(project.id);
      setLeads(data.leads || []);
      setVideos(data.videos || []);
      setStats(data.stats || null);
      
      toast.success(`Loaded ${result.validLeads} leads`);
    } catch (err) {
      toast.error('Failed to upload CSV');
    }
  }, [project, uploadCSV, fetchProject]);

  // Handle settings change
  const handleSettingsChange = useCallback(async (newSettings) => {
    setSettings(newSettings);
    
    if (project?.id) {
      try {
        await updateProject(project.id, newSettings);
      } catch (err) {
        console.error('Failed to save settings:', err);
      }
    }
  }, [project, updateProject]);

  // Handle add lead
  const handleAddLead = useCallback(async (leadData) => {
    if (!project?.id) return;

    try {
      await leadApi.create(project.id, leadData);
      const data = await fetchProject(project.id);
      setLeads(data.leads || []);
      setVideos(data.videos || []);
      toast.success('Lead added');
    } catch (err) {
      toast.error('Failed to add lead');
    }
  }, [project, fetchProject]);

  // Handle remove lead
  const handleRemoveLead = useCallback(async (leadId) => {
    if (!project?.id) return;

    try {
      await leadApi.delete(leadId);
      const data = await fetchProject(project.id);
      setLeads(data.leads || []);
      setVideos(data.videos || []);
      toast.success('Lead removed');
    } catch (err) {
      toast.error('Failed to remove lead');
    }
  }, [project, fetchProject]);

  // Handle generate videos
  const handleGenerateVideos = useCallback(async () => {
    if (!project?.id) return;

    setIsGenerating(true);
    try {
      await generateVideos(project.id);
      toast.success('Video generation started!');
      
      // Poll for status updates
      const pollInterval = setInterval(async () => {
        const data = await fetchProject(project.id);
        setVideos(data.videos || []);
        setStats(data.stats || null);
        
        // Stop polling when all videos are processed
        if (data.stats?.pending === 0 && data.stats?.processing === 0) {
          clearInterval(pollInterval);
          setIsGenerating(false);
          toast.success('All videos generated!');
        }
      }, 3000);
    } catch (err) {
      setIsGenerating(false);
      toast.error('Failed to start video generation');
    }
  }, [project, generateVideos, fetchProject]);

  // Handle export CSV
  const handleExportCSV = useCallback(async () => {
    if (!project?.id) return;

    try {
      await exportCSV(project.id);
      toast.success('CSV exported');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  }, [project, exportCSV]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    if (!project?.id) return;

    try {
      const data = await fetchProject(project.id);
      setLeads(data.leads || []);
      setVideos(data.videos || []);
      setStats(data.stats || null);
      toast.success('Data refreshed');
    } catch (err) {
      toast.error('Failed to refresh');
    }
  }, [project, fetchProject]);

  // Get intro video URL
  const introVideoUrl = videoFile 
    ? URL.createObjectURL(videoFile) 
    : project?.intro_video_url;

  const canGenerate = leads.length > 0 && (introVideoUrl || project?.intro_video_url);

  return (
    <div className="app">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }
        }}
      />

      <header className="app-header">
        <h1 className="gradient-text">AI VSL Creator</h1>
        <div className="header-actions">
          <button className="icon-btn" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          {videos.length > 0 && (
            <button className="export-btn" onClick={handleExportCSV}>
              <Download size={16} />
              Export CSV
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <VideoUpload 
            videoUrl={project?.intro_video_url}
            videoFile={videoFile}
            onUpload={handleVideoUpload}
            onRemove={handleVideoRemove}
            disabled={loading}
          />

          <LeadDataUpload 
            onUpload={handleCSVUpload}
            disabled={loading}
            uploadResult={csvUploadResult}
          />

          {leads.length > 0 && (
            <LeadsTable 
              leads={leads}
              videos={videos}
              onAddLead={handleAddLead}
              onRemoveLead={handleRemoveLead}
              disabled={loading || isGenerating}
            />
          )}

          <VideoDisplay 
            settings={settings}
            onChange={handleSettingsChange}
            disabled={loading}
          />

          <PageCustomization 
            settings={settings}
            onChange={handleSettingsChange}
            disabled={loading}
          />

          <button 
            className="generate-btn"
            onClick={handleGenerateVideos}
            disabled={!canGenerate || loading || isGenerating}
          >
            <Rocket size={20} />
            {isGenerating 
              ? 'Generating...' 
              : `Create ${leads.length} Video Landing Pages`}
          </button>
        </div>

        <div className="right-panel">
          <Preview 
            leads={leads}
            videos={videos}
            settings={settings}
            introVideoUrl={introVideoUrl}
          />

          <SavedVideos 
            videos={videos}
            stats={stats}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
