const express = require('express');
const router = express.Router();
const landingPageController = require('../controllers/landingPageController');

// Landing page routes
router.get('/:slug', (req, res) => landingPageController.getLandingPage(req, res));

// Video status route
router.get('/video/:id/status', (req, res) => landingPageController.getVideoStatus(req, res));

module.exports = router;
