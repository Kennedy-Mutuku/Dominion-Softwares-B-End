const express = require('express');
const router = express.Router();

const messages = [];

router.post('/', (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const newMessage = {
    id: Date.now().toString(),
    name,
    email,
    phone: phone || '',
    message,
    createdAt: new Date().toISOString()
  };

  messages.push(newMessage);
  res.status(201).json({ success: true, message: 'Message received successfully', data: newMessage });
});

router.get('/', (req, res) => {
  res.json({ success: true, data: messages });
});

module.exports = router;
