const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const User = require('../models/User');
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

    // Auto-create a client user account if one doesn't exist
    let clientAccountCreated = false;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      const newClient = new User({
        name: contactPerson,
        email: email.toLowerCase(),
        password: 'happyclient',
        role: 'client',
        phone,
        organization: organizationName,
      });
      await newClient.save();
      clientAccountCreated = true;
    }

    // Build email HTML for the applicant
    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
    const portalUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/client-portal`;

    const applicantEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B1B1B; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #F97316; margin: 0; font-size: 22px;">Dominion Softwares Ltd</h1>
          <p style="color: #aaa; margin: 4px 0 0 0; font-size: 13px;">Software Development Application Received</p>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #333;">Dear <strong>${contactPerson}</strong>,</p>
          <p style="color: #555; line-height: 1.6;">
            Thank you for choosing Dominion Softwares Ltd! We have received your project application for 
            <strong>${organizationName}</strong>. Our team will carefully review your requirements and get back to you 
            within <strong>24–48 hours</strong>.
          </p>

          <div style="background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 10px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #C2410C; margin: 0 0 12px 0; font-size: 15px;">📋 Your Client Portal Credentials</h3>
            <p style="color: #555; margin: 0 0 8px 0; font-size: 14px;">
              We've created a dedicated client portal account for you to track your project status and provide feedback.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
              <tr>
                <td style="padding: 8px 12px; background: #fff; border-radius: 6px 6px 0 0; border: 1px solid #FED7AA; font-size: 13px; color: #888; font-weight: bold;">LOGIN URL</td>
                <td style="padding: 8px 12px; background: #fff; border-radius: 0 0 0 0; border: 1px solid #FED7AA; border-left: none; font-size: 13px;"><a href="${loginUrl}" style="color: #F97316;">${loginUrl}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #FED7AA; border-top: none; font-size: 13px; color: #888; font-weight: bold;">USERNAME</td>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #FED7AA; border-top: none; border-left: none; font-size: 13px; font-weight: bold; color: #333;">${email.toLowerCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #fff; border-radius: 0 0 0 6px; border: 1px solid #FED7AA; border-top: none; font-size: 13px; color: #888; font-weight: bold;">PASSWORD</td>
                <td style="padding: 8px 12px; background: #fff; border-radius: 0 0 6px 0; border: 1px solid #FED7AA; border-top: none; border-left: none; font-size: 13px; font-weight: bold; color: #F97316; letter-spacing: 1px;">happyclient</td>
              </tr>
            </table>
            <p style="color: #888; font-size: 12px; margin-top: 12px;">⚠️ We recommend changing your password after your first login.</p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: #F97316; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 15px;">Sign In to Client Portal →</a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <h4 style="color: #333; margin-bottom: 12px;">Your Application Summary</h4>
          <p style="margin: 4px 0; color: #555; font-size: 13px;"><strong>Organization:</strong> ${organizationName} (${organizationType})</p>
          <p style="margin: 4px 0; color: #555; font-size: 13px;"><strong>Budget:</strong> ${budget || 'Not specified'}</p>
          <p style="margin: 4px 0; color: #555; font-size: 13px;"><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
          <p style="margin: 16px 0 0 0; color: #888; font-size: 12px;">
            If you have any immediate questions, feel free to reach out to us directly.<br/>
            — The Dominion Softwares Team
          </p>
        </div>
      </div>
    `;

    // Send email to the applicant with credentials
    sendEmail(email, `Application Received + Your Login Credentials — ${organizationName}`, applicantEmailHtml).catch(console.error);

    // Notify admin
    const adminEmailHtml = `
      <h2>New Software Application Received</h2>
      <p><strong>Organization:</strong> ${organizationName} (${organizationType})</p>
      <p><strong>Contact Person:</strong> ${contactPerson}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Project Description:</strong> ${projectDescription}</p>
      <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
      <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
      <p><strong>Client Account Created:</strong> ${clientAccountCreated ? 'Yes (new user created)' : 'No (existing user)'}</p>
      <p><br/>Log into the admin dashboard to manage this application.</p>
    `;
    sendEmail('mutukukennedy5@gmail.com', 'New Application: ' + organizationName, adminEmailHtml).catch(console.error);

    res.status(201).json({ 
      success: true, 
      message: 'Application submitted successfully', 
      data: newApplication,
      clientAccountCreated 
    });
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

// GET /my-applications — client sees their own applications
router.get('/my-applications', authenticate, authorize('client'), async (req, res) => {
  try {
    const applications = await Application.find({ email: req.user.email }).sort({ createdAt: -1 });
    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching your applications' });
  }
});

// PUT /:id/status (Admin only) - Update application status and feedback
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, adminFeedback, deadline } = req.body;
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (status) application.status = status;
    if (adminFeedback !== undefined && adminFeedback.trim() !== '') {
      application.adminFeedback = adminFeedback; // Keep for backward compatibility
      application.messages.push({ sender: 'admin', text: adminFeedback });
    }
    if (deadline !== undefined) application.deadline = deadline;

    await application.save();
    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Server error updating application' });
  }
});

// PUT /:id/feedback — client submits feedback
router.put('/:id/feedback', authenticate, authorize('client'), async (req, res) => {
  try {
    const { clientFeedback } = req.body;
    const application = await Application.findOne({ _id: req.params.id, email: req.user.email });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or not yours' });
    }

    if (clientFeedback && clientFeedback.trim() !== '') {
      application.clientFeedback = clientFeedback; // Keep for backward compatibility
      application.messages.push({ sender: 'client', text: clientFeedback });
    }

    await application.save();
    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Server error submitting feedback' });
  }
});

module.exports = router;
