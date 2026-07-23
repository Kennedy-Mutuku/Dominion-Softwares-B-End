const express = require('express');
const path = require('path');
const upload = require('../middleware/upload');

const router = express.Router();

// POST /api/uploads/photo - Upload a single attendee photo
// Used during event registration when event requires photo
router.post('/photo', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ success: true, data: { url } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
