const { Project, Lead, GeneratedVideo } = require('../models');
const csvService = require('../services/csvService');
const videoProcessingService = require('../services/videoProcessing');
const path = require('path');
const fs = require('fs').promises;

class ProjectController {
  /**
   * Create a new project
   */
  async createProject(req, res) {
    try {
      const projectData = {
        name: req.body.name || 'Untitled Project',
        ...req.body
      };

      // Handle video upload
      if (req.file) {
        projectData.intro_video_filename = req.file.filename;
        projectData.intro_video_url = `/uploads/${req.file.filename}`;
      }

      const project = await Project.create(projectData);
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get all projects
   */
  async getProjects(req, res) {
    try {
      const projects = await Project.findAll();
      res.json({ success: true, data: projects });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get single project with leads and videos
   */
  async getProject(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const leads = await Lead.findByProjectId(id);
      const videos = await GeneratedVideo.findByProjectId(id);
      const stats = await GeneratedVideo.getStats(id);

      res.json({ 
        success: true, 
        data: { 
          ...project, 
          leads, 
          videos,
          stats
        } 
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Update project settings
   */
  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Handle video upload
      if (req.file) {
        updateData.intro_video_filename = req.file.filename;
        updateData.intro_video_url = `/uploads/${req.file.filename}`;
      }

      const project = await Project.update(id, updateData);
      
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      res.json({ success: true, data: project });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Delete project
   */
  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      await Project.delete(id);
      res.json({ success: true, message: 'Project deleted' });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Upload intro video
   */
  async uploadVideo(req, res) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No video file uploaded' });
      }

      const project = await Project.update(id, {
        intro_video_filename: req.file.filename,
        intro_video_url: `/uploads/${req.file.filename}`
      });

      res.json({ success: true, data: project });
    } catch (error) {
      console.error('Error uploading video:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Upload CSV and parse leads
   */
  async uploadCSV(req, res) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
      }

      // Parse CSV
      const leads = await csvService.parseLeadsCSV(req.file.path);
      const { valid, invalid } = csvService.validateLeads(leads);

      // Clear existing leads for this project
      await Lead.deleteByProjectId(id);
      await GeneratedVideo.deleteByProjectId(id);

      // Insert valid leads
      const insertedLeads = [];
      for (const lead of valid) {
        const normalizedLead = {
          ...lead,
          website_url: csvService.normalizeUrl(lead.website_url)
        };
        const inserted = await Lead.create({ ...normalizedLead, project_id: id });
        insertedLeads.push(inserted);

        // Create placeholder generated_video record
        const baseUrl = process.env.APP_URL || 'http://localhost:5000';
        const slug = GeneratedVideo.generateSlug();
        await GeneratedVideo.create({
          project_id: id,
          lead_id: inserted.id,
          landing_page_slug: slug,
          landing_page_url: `${baseUrl}/#${slug}`
        });
      }

      // Clean up uploaded file
      await fs.unlink(req.file.path);

      res.json({ 
        success: true, 
        data: {
          totalUploaded: leads.length,
          validLeads: valid.length,
          invalidLeads: invalid.length,
          leads: insertedLeads,
          invalidDetails: invalid
        }
      });
    } catch (error) {
      console.error('Error uploading CSV:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Generate videos for all leads in project
   */
  async generateVideos(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      if (!project.intro_video_url) {
        return res.status(400).json({ success: false, error: 'No intro video uploaded' });
      }

      const leads = await Lead.findByProjectId(id);
      
      if (leads.length === 0) {
        return res.status(400).json({ success: false, error: 'No leads found' });
      }

      // Start async video generation
      res.json({ 
        success: true, 
        message: `Started generating ${leads.length} videos`,
        data: { totalLeads: leads.length }
      });

      // Process videos in background
      this.processVideosInBackground(project, leads);
    } catch (error) {
      console.error('Error generating videos:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Process videos in background
   */
  async processVideosInBackground(project, leads) {
    const introVideoPath = path.join(process.env.UPLOAD_DIR || './uploads', project.intro_video_filename);

    for (const lead of leads) {
      const video = await GeneratedVideo.findByLeadId(lead.id);
      
      if (!video) continue;

      try {
        await GeneratedVideo.updateStatus(video.id, 'processing');

        const outputFilename = `vsl_${video.landing_page_slug}.mp4`;
        
        const outputPath = await videoProcessingService.generateVideoForLead({
          introVideoPath,
          websiteUrl: lead.website_url,
          position: project.position,
          shape: project.shape,
          bubbleSize: project.display_mode === 'small_bubble' ? 150 : 250,
          bubbleDuration: 5,
          outputFilename
        });

        const videoUrl = `/outputs/${outputFilename}`;
        
        await GeneratedVideo.update(video.id, {
          video_url: videoUrl,
          video_filename: outputFilename,
          status: 'completed',
          processing_completed_at: new Date().toISOString()
        });

        console.log(`✅ Generated video for ${lead.website_url}`);
      } catch (error) {
        console.error(`❌ Failed to generate video for ${lead.website_url}:`, error);
        await GeneratedVideo.updateStatus(video.id, 'failed', error.message);
      }
    }

    console.log('Video generation completed for project:', project.id);
  }

  /**
   * Export CSV with video links
   */
  async exportCSV(req, res) {
    try {
      const { id } = req.params;
      const videos = await GeneratedVideo.findByProjectId(id);
      
      const baseUrl = process.env.APP_URL || 'http://localhost:5000';
      
      const exportData = videos.map(v => ({
        website_url: v.website_url,
        first_name: v.first_name,
        last_name_or_company: v.last_name_or_company,
        landing_page_url: `${baseUrl}/#${v.landing_page_slug}`,
        video_url: v.video_url ? `${baseUrl}${v.video_url}` : '',
        status: v.status
      }));

      const csvContent = await csvService.generateOutputCSV(exportData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=vsl_export_${id}.csv`);
      res.send(csvContent);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new ProjectController();
