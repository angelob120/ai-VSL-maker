require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const initializeDatabase = require('./config/initDb');
const { projectRoutes, leadRoutes, landingPageRoutes } = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Create necessary directories
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const outputDir = process.env.OUTPUT_DIR || './outputs';
const tempDir = './temp';

[uploadDir, outputDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, uploadDir)));
app.use('/outputs', express.static(path.join(__dirname, outputDir)));

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/landing', landingPageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📁 Upload directory: ${path.resolve(uploadDir)}`);
      console.log(`📁 Output directory: ${path.resolve(outputDir)}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
