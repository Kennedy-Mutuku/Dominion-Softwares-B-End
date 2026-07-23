const express = require('express');
const Review = require('../models/Review');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all active reviews (for public homepage)
// @route   GET /api/reviews
// @access  Public
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'active' })
      .select('-email')
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Get all reviews for admin
// @route   GET /api/reviews/admin
// @access  Private/Admin
router.get('/admin', authenticate, authorize('admin'), async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, org, rating, text } = req.body;
    const review = await Review.create({
      name,
      email,
      org: org || 'Valued Client',
      rating,
      text,
      status: 'active'
    });
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Delete a review (Soft delete)
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Instead of completely removing, just set status to deleted so it hides from public
    review.status = 'deleted';
    await review.save();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
