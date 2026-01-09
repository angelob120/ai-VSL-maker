const pool = require('../config/database');

class Lead {
  static async create(data) {
    const {
      project_id,
      website_url,
      first_name,
      last_name_or_company,
      phone,
      email,
      custom_fields = {}
    } = data;

    const result = await pool.query(
      `INSERT INTO leads (
        project_id, website_url, first_name, last_name_or_company, phone, email, custom_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [project_id, website_url, first_name, last_name_or_company, phone, email, JSON.stringify(custom_fields)]
    );
    return result.rows[0];
  }

  static async createBulk(projectId, leads) {
    const results = [];
    for (const lead of leads) {
      const result = await this.create({ ...lead, project_id: projectId });
      results.push(result);
    }
    return results;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByProjectId(projectId) {
    const result = await pool.query(
      'SELECT * FROM leads WHERE project_id = $1 ORDER BY created_at ASC',
      [projectId]
    );
    return result.rows;
  }

  static async findAll() {
    const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    return result.rows;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(key === 'custom_fields' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);

    const result = await pool.query(
      `UPDATE leads SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM leads WHERE id = $1', [id]);
    return true;
  }

  static async deleteByProjectId(projectId) {
    await pool.query('DELETE FROM leads WHERE project_id = $1', [projectId]);
    return true;
  }

  static async countByProjectId(projectId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM leads WHERE project_id = $1',
      [projectId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Lead;
