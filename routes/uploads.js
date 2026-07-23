const express = require('express');
const path = require('path');
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

// POST /api/uploads/media - Upload single or multiple files for application intake
router.post('/media', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      // Fallback if single file field was used
      if (req.file) {
        const fileData = {
          url: `/uploads/${req.file.filename}`,
          filename: req.file.filename,
          originalName: req.file.originalname,
          fileType: req.file.mimetype,
          size: req.file.size
        };
        return res.status(201).json({ success: true, data: fileData });
      }
      return res.status(400).json({ success: false, message: 'No media files uploaded' });
    }

    const filesData = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      fileType: file.mimetype,
      size: file.size
    }));

    res.status(201).json({ success: true, data: filesData });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error uploading media' });
  }
});

module.exports = router;
