const express = require('express');
const Event = require('../models/Event');
const TicketType = require('../models/TicketType');
const Ticket = require('../models/Ticket');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const generateSlug = require('../utils/generateSlug');

const router = express.Router();

// GET /api/events - Public: list published events
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, city } = req.query;
    // Show events whose END date hasn't passed yet (so today's events still show)
    const query = { status: 'published', 'date.end': { $gte: new Date() } };

    if (category) query.category = category;
    if (city) query['venue.city'] = new RegExp(city, 'i');
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
      ];
    }

    const events = await Event.find(query)
      .sort({ 'date.start': 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('organizer', 'name organization');

    // Attach ticket types with min price for each event
    const eventsWithPrices = await Promise.all(
      events.map(async (event) => {
        const ticketTypes = await TicketType.find({ event: event._id }).sort({ sortOrder: 1 });
        return { ...event.toObject(), ticketTypes };
      })
    );

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: {
        events: eventsWithPrices,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events/featured - Public: featured/upcoming for homepage
router.get('/featured', async (req, res) => {
  try {
    const query = {
      status: 'published',
      'date.end': { $gte: new Date() },
    };

    // Prefer featured events, fallback to upcoming
    let events = await Event.find({ ...query, isFeatured: true })
      .sort({ 'date.start': 1 })
      .limit(4)
      .populate('organizer', 'name organization');

    if (events.length < 4) {
      const moreEvents = await Event.find({
        ...query,
        _id: { $nin: events.map(e => e._id) },
      })
        .sort({ 'date.start': 1 })
        .limit(4 - events.length)
        .populate('organizer', 'name organization');
      events = [...events, ...moreEvents];
    }

    const eventsWithPrices = await Promise.all(
      events.map(async (event) => {
        const ticketTypes = await TicketType.find({ event: event._id }).sort({ sortOrder: 1 });
        return { ...event.toObject(), ticketTypes };
      })
    );

    res.json({ success: true, data: eventsWithPrices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events/s/:slug - Public: single event by slug (shareable link)
router.get('/s/:slug', async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug, status: 'published' })
      .populate('organizer', 'name organization avatar');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const ticketTypes = await TicketType.find({ event: event._id }).sort({ sortOrder: 1 });

    res.json({
      success: true,
      data: { event, ticketTypes },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/events - Organizer: create event
router.post('/', authenticate, authorize('organizer', 'admin'), upload.single('cover'), async (req, res) => {
  try {
    const eventData = JSON.parse(req.body.eventData || '{}');
    eventData.organizer = req.user._id;
    eventData.slug = generateSlug(eventData.title);

    if (req.file) {
      eventData.images = { cover: `/uploads/${req.file.filename}` };
    }

    const event = await Event.create(eventData);

    // Create ticket types if provided
    if (eventData.ticketTypes && Array.isArray(eventData.ticketTypes)) {
      const types = eventData.ticketTypes.map((tt, i) => ({
        ...tt,
        event: event._id,
        sortOrder: i,
      }));
      await TicketType.insertMany(types);
    }

    const populatedEvent = await Event.findById(event._id).populate('organizer', 'name organization');
    const ticketTypes = await TicketType.find({ event: event._id }).sort({ sortOrder: 1 });

    res.status(201).json({
      success: true,
      data: { event: populatedEvent, ticketTypes },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/events/:id - Organizer: update own event
router.put('/:id', authenticate, authorize('organizer', 'admin'), upload.single('cover'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = JSON.parse(req.body.eventData || '{}');
    if (req.file) {
      updates.images = { ...event.images, cover: `/uploads/${req.file.filename}` };
    }

    // Handle ticket types update
    if (updates.ticketTypes) {
      // Remove old types that aren't in the update
      const newTypeIds = updates.ticketTypes.filter(t => t._id).map(t => t._id);
      await TicketType.deleteMany({ event: event._id, _id: { $nin: newTypeIds } });

      for (let i = 0; i < updates.ticketTypes.length; i++) {
        const tt = updates.ticketTypes[i];
        if (tt._id) {
          await TicketType.findByIdAndUpdate(tt._id, { ...tt, sortOrder: i });
        } else {
          await TicketType.create({ ...tt, event: event._id, sortOrder: i });
        }
      }
      delete updates.ticketTypes;
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('organizer', 'name organization');
    const ticketTypes = await TicketType.find({ event: event._id }).sort({ sortOrder: 1 });

    res.json({ success: true, data: { event: updated, ticketTypes } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/events/:id - Organizer: delete own draft event
router.delete('/:id', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (event.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft events can be deleted' });
    }

    await TicketType.deleteMany({ event: event._id });
    await Event.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/events/:id/status - Organizer: publish/cancel event
router.patch('/:id/status', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status } = req.body;
    const validTransitions = {
      draft: ['published'],
      published: ['cancelled', 'completed'],
      cancelled: ['draft'],
    };

    if (!validTransitions[event.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot change from ${event.status} to ${status}` });
    }

    event.status = status;
    await event.save();

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events/:id/attendees - Organizer: attendee list
router.get('/:id/attendees', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const tickets = await Ticket.find({ event: req.params.id })
      .populate('ticketType', 'name price')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
