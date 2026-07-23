const express = require('express');
const upload = require('../middleware/upload');

const router = express.Router();

// POST /api/uploads/photo - Upload a single attendee photo
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

// POST /api/uploads/media - Upload application media & production assets (video, audio, docs, images)
router.post('/media', upload.single('media'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No media file uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ 
      success: true, 
      data: { 
        url,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        category: req.body.category || 'general'
      } 
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
