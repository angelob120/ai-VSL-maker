const { Lead, GeneratedVideo } = require('../models');
const csvService = require('../services/csvService');

class LeadController {
  /**
   * Get all leads for a project
   */
  async getLeadsByProject(req, res) {
    try {
      const { projectId } = req.params;
      const leads = await Lead.findByProjectId(projectId);
      res.json({ success: true, data: leads });
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get single lead
   */
  async getLead(req, res) {
    try {
      const { id } = req.params;
      const lead = await Lead.findById(id);
      
      if (!lead) {
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }

      const video = await GeneratedVideo.findByLeadId(id);
      
      res.json({ success: true, data: { ...lead, video } });
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Add a single lead
   */
  async addLead(req, res) {
    try {
      const { projectId } = req.params;
      const leadData = {
        ...req.body,
        project_id: projectId,
        website_url: csvService.normalizeUrl(req.body.website_url)
      };

      const lead = await Lead.create(leadData);

      // Create placeholder generated_video record
      const baseUrl = process.env.APP_URL || 'http://localhost:5000';
      const slug = GeneratedVideo.generateSlug();
      await GeneratedVideo.create({
        project_id: projectId,
        lead_id: lead.id,
        landing_page_slug: slug,
        landing_page_url: `${baseUrl}/#${slug}`
      });

      res.status(201).json({ success: true, data: lead });
    } catch (error) {
      console.error('Error adding lead:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Update lead
   */
  async updateLead(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.website_url) {
        updateData.website_url = csvService.normalizeUrl(updateData.website_url);
      }

      const lead = await Lead.update(id, updateData);
      
      if (!lead) {
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }

      res.json({ success: true, data: lead });
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Delete lead
   */
  async deleteLead(req, res) {
    try {
      const { id } = req.params;
      await Lead.delete(id);
      res.json({ success: true, message: 'Lead deleted' });
    } catch (error) {
      console.error('Error deleting lead:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new LeadController();
