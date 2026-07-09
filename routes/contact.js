const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { sendEmail } = require('../utils/mailer');
const { authenticate, authorize } = require('../middleware/auth');

// POST a new contact message
router.post('/', async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  try {
    const newContact = new Contact({
      name,
      email,
      phone,
      message,
    });

    await newContact.save();

    // Send email notification
    const emailHtml = `
      <h2>New Contact Message Received</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
      <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>
      <p><br/>Log into the admin dashboard to manage this message.</p>
    `;

    sendEmail('mutukukennedy5@gmail.com', 'New Contact Message from ' + name, emailHtml).catch(console.error);

    res.status(201).json({ success: true, message: 'Message received successfully', data: newContact });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ error: 'Server error saving contact message' });
  }
});

// GET all contact messages (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching contact messages' });
  }
});

module.exports = router;
