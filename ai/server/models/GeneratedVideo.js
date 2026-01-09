const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class GeneratedVideo {
  static generateSlug() {
    return `site-${uuidv4().split('-').slice(0, 2).join('')}`;
  }

  static async create(data) {
    const {
      project_id,
      lead_id,
      video_url = null,
      video_filename = null,
      landing_page_url = null,
      landing_page_slug = this.generateSlug(),
      status = 'pending'
    } = data;

    const result = await pool.query(
      `INSERT INTO generated_videos (
        project_id, lead_id, video_url, video_filename, landing_page_url, landing_page_slug, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [project_id, lead_id, video_url, video_filename, landing_page_url, landing_page_slug, status]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM generated_videos WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findBySlug(slug) {
    const result = await pool.query(
      `SELECT gv.*, l.website_url, l.first_name, l.last_name_or_company, l.phone, l.email,
        p.video_title, p.button_text, p.button_link, p.accent_color, p.text_color, 
        p.background_color, p.dark_mode, p.display_mode, p.position, p.shape,
        p.intro_video_url
      FROM generated_videos gv
      JOIN leads l ON gv.lead_id = l.id
      JOIN projects p ON gv.project_id = p.id
      WHERE gv.landing_page_slug = $1`,
      [slug]
    );
    return result.rows[0];
  }

  static async findByProjectId(projectId) {
    const result = await pool.query(
      `SELECT gv.*, l.website_url, l.first_name, l.last_name_or_company
      FROM generated_videos gv
      JOIN leads l ON gv.lead_id = l.id
      WHERE gv.project_id = $1
      ORDER BY gv.created_at ASC`,
      [projectId]
    );
    return result.rows;
  }

  static async findByLeadId(leadId) {
    const result = await pool.query(
      'SELECT * FROM generated_videos WHERE lead_id = $1',
      [leadId]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);

    const result = await pool.query(
      `UPDATE generated_videos SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async updateStatus(id, status, errorMessage = null) {
    const updates = { status };
    
    if (status === 'processing') {
      updates.processing_started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      updates.processing_completed_at = new Date().toISOString();
    }
    
    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    return this.update(id, updates);
  }

  static async delete(id) {
    await pool.query('DELETE FROM generated_videos WHERE id = $1', [id]);
    return true;
  }

  static async deleteByProjectId(projectId) {
    await pool.query('DELETE FROM generated_videos WHERE project_id = $1', [projectId]);
    return true;
  }

  static async getStats(projectId) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM generated_videos WHERE project_id = $1`,
      [projectId]
    );
    return result.rows[0];
  }
}

module.exports = GeneratedVideo;
