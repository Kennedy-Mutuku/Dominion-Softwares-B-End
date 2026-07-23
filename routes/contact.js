const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const { sendEmail } = require('../utils/mailer');
const { authenticate, authorize } = require('../middleware/auth');

// In-memory fallback store when MongoDB is disconnected
const inMemoryContacts = [];

// POST a new contact message
router.post('/', async (req, res) => {
  const { name, email, phone, subject, category, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const contactData = {
    _id: new mongoose.Types.ObjectId().toString(),
    name,
    email,
    phone: phone || '',
    subject: subject || category || 'General Inquiry',
    category: category || subject || 'General Inquiry',
    message,
    status: 'unread',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let savedContact = contactData;

  try {
    if (mongoose.connection.readyState === 1) {
      const newContact = new Contact(contactData);
      savedContact = await newContact.save();
    } else {
      console.warn('[Contact Route] MongoDB offline, caching message in memory.');
      inMemoryContacts.unshift(contactData);
    }

    // Send email notification
    const emailHtml = `
      <h2>New Contact / Feedback Message Received</h2>
      <p><strong>Category/Subject:</strong> ${contactData.subject}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
      <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>
      <p><br/>Log into the admin dashboard to manage this message.</p>
    `;

    sendEmail('mutukukennedy5@gmail.com', `[Contact] ${contactData.subject} from ${name}`, emailHtml).catch(console.error);

    res.status(201).json({ success: true, message: 'Message received successfully', data: savedContact });
  } catch (error) {
    console.error('Error saving contact message:', error);
    inMemoryContacts.unshift(contactData);
    res.status(201).json({ success: true, message: 'Message received successfully', data: contactData });
  }
});

// GET all contact messages (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    let dbMessages = [];
    if (mongoose.connection.readyState === 1) {
      dbMessages = await Contact.find().sort({ createdAt: -1 });
    }
    const combined = [...inMemoryContacts, ...dbMessages];
    res.json({ success: true, data: combined });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.json({ success: true, data: inMemoryContacts });
  }
});

module.exports = router;
