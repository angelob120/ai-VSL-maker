const pool = require('./database');

const initializeDatabase = async () => {
  try {
    // Create projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        intro_video_url TEXT,
        intro_video_filename VARCHAR(255),
        display_mode VARCHAR(50) DEFAULT 'small_bubble',
        position VARCHAR(50) DEFAULT 'bottom_right',
        shape VARCHAR(50) DEFAULT 'circle',
        video_title VARCHAR(255) DEFAULT 'A video for you 👋',
        button_text VARCHAR(100) DEFAULT 'Book a Call',
        button_link TEXT DEFAULT 'https://calendly.com/',
        accent_color VARCHAR(20) DEFAULT '#6366f1',
        text_color VARCHAR(20) DEFAULT '#ffffff',
        background_color VARCHAR(20) DEFAULT '#3b82f6',
        dark_mode BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create leads table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        website_url TEXT NOT NULL,
        first_name VARCHAR(100),
        last_name_or_company VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        custom_fields JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create generated_videos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS generated_videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
        video_url TEXT,
        video_filename VARCHAR(255),
        landing_page_url TEXT,
        landing_page_slug VARCHAR(100) UNIQUE,
        status VARCHAR(50) DEFAULT 'pending',
        error_message TEXT,
        processing_started_at TIMESTAMP,
        processing_completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create website_screenshots table for caching
    await pool.query(`
      CREATE TABLE IF NOT EXISTS website_screenshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url TEXT NOT NULL UNIQUE,
        screenshot_data BYTEA,
        scroll_video_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
      )
    `);

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_project ON leads(project_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_videos_project ON generated_videos(project_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_videos_lead ON generated_videos(lead_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_videos_slug ON generated_videos(landing_page_slug)`);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

module.exports = initializeDatabase;
