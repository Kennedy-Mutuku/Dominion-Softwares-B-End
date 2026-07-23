const express = require('express');
const TicketType = require('../models/TicketType');
const Event = require('../models/Event');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/events/:eventId/ticket-types
router.get('/events/:eventId/ticket-types', async (req, res) => {
  try {
    const ticketTypes = await TicketType.find({ event: req.params.eventId }).sort({ sortOrder: 1 });
    res.json({ success: true, data: ticketTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/events/:eventId/ticket-types
router.post('/events/:eventId/ticket-types', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const ticketType = await TicketType.create({ ...req.body, event: req.params.eventId });
    res.status(201).json({ success: true, data: ticketType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/ticket-types/:id
router.put('/ticket-types/:id', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const ticketType = await TicketType.findById(req.params.id);
    if (!ticketType) return res.status(404).json({ success: false, message: 'Ticket type not found' });

    const event = await Event.findById(ticketType.event);
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await TicketType.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/ticket-types/:id
router.delete('/ticket-types/:id', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const ticketType = await TicketType.findById(req.params.id);
    if (!ticketType) return res.status(404).json({ success: false, message: 'Ticket type not found' });

    const event = await Event.findById(ticketType.event);
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (ticketType.sold > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete ticket type with sales' });
    }

    await TicketType.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Ticket type deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
