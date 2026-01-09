const pool = require('../config/database');

class Project {
  static async create(data) {
    const {
      name,
      intro_video_url,
      intro_video_filename,
      display_mode = 'small_bubble',
      position = 'bottom_right',
      shape = 'circle',
      video_title = 'A video for you 👋',
      button_text = 'Book a Call',
      button_link = 'https://calendly.com/',
      accent_color = '#6366f1',
      text_color = '#ffffff',
      background_color = '#3b82f6',
      dark_mode = true
    } = data;

    const result = await pool.query(
      `INSERT INTO projects (
        name, intro_video_url, intro_video_filename, display_mode, position, shape,
        video_title, button_text, button_link, accent_color, text_color, background_color, dark_mode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        name, intro_video_url, intro_video_filename, display_mode, position, shape,
        video_title, button_text, button_link, accent_color, text_color, background_color, dark_mode
      ]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    return result.rows;
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

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    return true;
  }
}

module.exports = Project;
