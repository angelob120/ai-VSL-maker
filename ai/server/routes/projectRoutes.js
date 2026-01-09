const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const projectController = require('../controllers/projectController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const videoUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  }
});

const csvUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Project CRUD routes
router.post('/', videoUpload.single('intro_video'), (req, res) => projectController.createProject(req, res));
router.get('/', (req, res) => projectController.getProjects(req, res));
router.get('/:id', (req, res) => projectController.getProject(req, res));
router.put('/:id', videoUpload.single('intro_video'), (req, res) => projectController.updateProject(req, res));
router.delete('/:id', (req, res) => projectController.deleteProject(req, res));

// Video upload route
router.post('/:id/video', videoUpload.single('intro_video'), (req, res) => projectController.uploadVideo(req, res));

// CSV upload route
router.post('/:id/csv', csvUpload.single('csv_file'), (req, res) => projectController.uploadCSV(req, res));

// Generate videos route
router.post('/:id/generate', (req, res) => projectController.generateVideos(req, res));

// Export CSV route
router.get('/:id/export', (req, res) => projectController.exportCSV(req, res));

module.exports = router;
