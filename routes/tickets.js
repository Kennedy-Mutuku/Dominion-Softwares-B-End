const express = require('express');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/tickets - Authenticated: list own tickets
router.get('/', authenticate, async (req, res) => {
  try {
    const tickets = await Ticket.find({ owner: req.user._id })
      .populate('event', 'title slug date venue images ticketTemplate')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tickets/:ticketCode - Get single ticket
router.get('/:ticketCode', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketCode: req.params.ticketCode })
      .populate('event', 'title slug date venue images ticketTemplate registrationFields');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/tickets/validate/qr/:ticketCode - Organizer: validate by QR
router.put('/validate/qr/:ticketCode', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketCode: req.params.ticketCode });
    if (!ticket) {
      return res.status(404).json({ success: false, status: 'invalid', message: 'Ticket not found' });
    }

    // Verify organizer owns this event
    const event = await Event.findById(ticket.event);
    if (!event) {
      return res.status(404).json({ success: false, status: 'invalid', message: 'Event not found' });
    }
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this event' });
    }

    if (ticket.status === 'used') {
      return res.json({
        success: true,
        status: 'already_used',
        message: `Already used at ${ticket.usedAt.toLocaleTimeString()}`,
        data: {
          ticketNumber: ticket.ticketNumber,
          ownerName: ticket.ownerName,
          typeName: ticket.typeName,
          usedAt: ticket.usedAt,
        },
      });
    }

    if (ticket.status === 'cancelled') {
      return res.json({
        success: false,
        status: 'cancelled',
        message: 'This ticket has been cancelled',
      });
    }

    // Mark as used
    ticket.status = 'used';
    ticket.usedAt = new Date();
    ticket.usedBy = req.user._id;
    await ticket.save();

    res.json({
      success: true,
      status: 'valid',
      message: 'Ticket validated successfully',
      data: {
        ticketNumber: ticket.ticketNumber,
        ownerName: ticket.ownerName,
        typeName: ticket.typeName,
        attendeeData: ticket.attendeeData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/tickets/validate/number/:ticketNumber - Organizer: validate by number
router.put('/validate/number/:ticketNumber', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      ticketNumber: req.params.ticketNumber.toUpperCase(),
    });
    if (!ticket) {
      return res.status(404).json({ success: false, status: 'invalid', message: 'Ticket not found' });
    }

    const event = await Event.findById(ticket.event);
    if (!event) {
      return res.status(404).json({ success: false, status: 'invalid', message: 'Event not found' });
    }
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this event' });
    }

    if (ticket.status === 'used') {
      return res.json({
        success: true,
        status: 'already_used',
        message: `Already used at ${ticket.usedAt.toLocaleTimeString()}`,
        data: {
          ticketNumber: ticket.ticketNumber,
          ownerName: ticket.ownerName,
          typeName: ticket.typeName,
          usedAt: ticket.usedAt,
        },
      });
    }

    if (ticket.status === 'cancelled') {
      return res.json({ success: false, status: 'cancelled', message: 'This ticket has been cancelled' });
    }

    ticket.status = 'used';
    ticket.usedAt = new Date();
    ticket.usedBy = req.user._id;
    await ticket.save();

    res.json({
      success: true,
      status: 'valid',
      message: 'Ticket validated successfully',
      data: {
        ticketNumber: ticket.ticketNumber,
        ownerName: ticket.ownerName,
        typeName: ticket.typeName,
        attendeeData: ticket.attendeeData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tickets/search - Organizer: search by ticket number
router.get('/search/lookup', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const { number, eventId } = req.query;
    if (!number) return res.status(400).json({ success: false, message: 'Ticket number required' });

    const query = { ticketNumber: new RegExp(number.toUpperCase(), 'i') };
    if (eventId) {
      const event = await Event.findById(eventId);
      if (event && event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      query.event = eventId;
    }

    const tickets = await Ticket.find(query).limit(10).populate('event', 'title organizer');

    // Filter to only show tickets for organizer's events
    const filtered = tickets.filter(t =>
      t.event?.organizer?.toString() === req.user._id.toString() || req.user.role === 'admin'
    );

    res.json({ success: true, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
