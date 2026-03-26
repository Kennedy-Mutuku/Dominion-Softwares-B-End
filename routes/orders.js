const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const TicketType = require('../models/TicketType');
const Event = require('../models/Event');
const { authenticate, optionalAuth } = require('../middleware/auth');
const generateOrderNumber = require('../utils/generateOrderNumber');
const generateTicketNumber = require('../utils/generateTicketNumber');

const router = express.Router();

// POST /api/orders - Create order (guest or authenticated)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { eventId, items, attendeeDetails, attendeePhoto } = req.body;

    if (!eventId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Event and tickets are required' });
    }

    const event = await Event.findById(eventId);
    if (!event || event.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Event not found or not available' });
    }

    // Atomic ticket decrement — prevents overselling
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      // First check availability
      const ticketType = await TicketType.findOne({ _id: item.ticketTypeId, event: eventId });
      if (!ticketType) {
        return res.status(400).json({ success: false, message: `Ticket type not found` });
      }

      const available = ticketType.quantity - ticketType.sold;
      if (available < item.quantity) {
        // Rollback previously incremented
        for (const processed of processedItems) {
          await TicketType.findByIdAndUpdate(processed.ticketType, { $inc: { sold: -processed.quantity } });
        }
        return res.status(400).json({
          success: false,
          message: `Not enough tickets available for ${ticketType.name}. Only ${available} left.`,
        });
      }

      // Atomic increment
      const result = await TicketType.findByIdAndUpdate(
        item.ticketTypeId,
        { $inc: { sold: item.quantity } },
        { new: true }
      );

      processedItems.push({
        ticketType: result._id,
        typeName: result.name,
        price: result.price,
        quantity: item.quantity,
      });
      totalAmount += result.price * item.quantity;
    }

    // Create order
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      buyer: req.user?._id || null,
      event: eventId,
      items: processedItems,
      totalAmount,
      status: 'completed', // mock payment — auto-complete
      payment: {
        method: 'mock',
        transactionId: `MOCK-${uuidv4().slice(0, 8).toUpperCase()}`,
        paidAt: new Date(),
      },
      attendeeDetails,
      attendeePhoto,
    });

    // Create individual tickets
    const tickets = [];
    for (const item of processedItems) {
      for (let i = 0; i < item.quantity; i++) {
        const ticket = await Ticket.create({
          ticketNumber: generateTicketNumber(),
          ticketCode: uuidv4(),
          order: order._id,
          event: eventId,
          ticketType: item.ticketType,
          owner: req.user?._id || null,
          eventTitle: event.title,
          typeName: item.typeName,
          ownerName: attendeeDetails?.['Full Name'] || attendeeDetails?.['Name'] || req.user?.name || 'Guest',
          ownerEmail: attendeeDetails?.['Email'] || req.user?.email || '',
          attendeeData: attendeeDetails,
          attendeePhoto,
        });
        tickets.push(ticket);
      }
    }

    res.status(201).json({
      success: true,
      data: { order, tickets },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders - Authenticated: list own orders
router.get('/', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('event', 'title slug date venue images')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id - Get order with tickets
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('event', 'title slug date venue images ticketTemplate registrationFields');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const tickets = await Ticket.find({ order: order._id });
    const event = await Event.findById(order.event._id);

    res.json({
      success: true,
      data: { order, tickets, event },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
