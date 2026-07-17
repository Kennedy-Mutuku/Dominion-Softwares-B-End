const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { sendEmail } = require('../utils/mailer');
const { authenticate, authorize } = require('../middleware/auth');

// POST a new application
router.post('/', async (req, res) => {
  const { 
    clientType, organizationName, organizationType, organizationTypeOther, 
    contactPerson, email, phone, targetAudience, primaryGoal, 
    contentManagement, needAccounts, accountTypes, paymentIntegration, 
    specificFeatures, projectDescription, budget, timeline, additionalNotes 
  } = req.body;

  if (!organizationName || !organizationType || !contactPerson || !email || !phone || !projectDescription) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }

  try {
    const newApplication = new Application({
      clientType, organizationName, organizationType, organizationTypeOther,
      contactPerson, email, phone, targetAudience, primaryGoal,
      contentManagement, needAccounts, accountTypes, paymentIntegration,
      specificFeatures, projectDescription, budget, timeline, additionalNotes
    });

    await newApplication.save();

    // Send email notification
    const emailHtml = `
      <h2>New Software Application Received</h2>
      <p><strong>Organization:</strong> ${organizationName} (${organizationType})</p>
      <p><strong>Contact Person:</strong> ${contactPerson}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Project Description:</strong> ${projectDescription}</p>
      <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
      <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
      <p><br/>Log into the admin dashboard to manage this application.</p>
    `;

    sendEmail('mutukukennedy5@gmail.com', 'New Application: ' + organizationName, emailHtml).catch(console.error);

    res.status(201).json({ success: true, message: 'Application submitted successfully', data: newApplication });
  } catch (error) {
    console.error('Error saving application:', error);
    res.status(500).json({ error: 'Server error saving application' });
  }
});

// GET all applications (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const applications = await Application.find().sort({ createdAt: -1 });
    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching applications' });
  }
});

// PUT /:id/status (Admin only) - Update application status and feedback
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, adminFeedback } = req.body;
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (status) application.status = status;
    if (adminFeedback !== undefined) application.adminFeedback = adminFeedback;

    await application.save();
    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Server error updating application' });
  }
});

module.exports = router;
