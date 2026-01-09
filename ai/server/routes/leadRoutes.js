const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

// Lead routes
router.get('/project/:projectId', (req, res) => leadController.getLeadsByProject(req, res));
router.get('/:id', (req, res) => leadController.getLead(req, res));
router.post('/project/:projectId', (req, res) => leadController.addLead(req, res));
router.put('/:id', (req, res) => leadController.updateLead(req, res));
router.delete('/:id', (req, res) => leadController.deleteLead(req, res));

module.exports = router;
