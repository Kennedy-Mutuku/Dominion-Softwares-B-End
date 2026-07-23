const express = require('express');
const Event = require('../models/Event');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const TicketType = require('../models/TicketType');
const Application = require('../models/Application');
const Contact = require('../models/Contact');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/admin-stats - Admin overview stats for sidebar and dashboard
router.get('/admin-stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const newApplicationsCount = await Application.countDocuments({ status: 'pending' });
    const unattendedMessagesCount = await Contact.countDocuments({ status: 'new' });
    
    // We can also fetch totals for the dashboard
    const totalApplications = await Application.countDocuments();
    const totalMessages = await Contact.countDocuments();
    const activeTickets = await Ticket.countDocuments({ status: 'valid' });

    res.json({
      success: true,
      data: {
        newApplications: newApplicationsCount,
        unattendedMessages: unattendedMessagesCount,
        totalApplications,
        totalMessages,
        activeTickets
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/dashboard/stats - Organizer overview stats
router.get('/stats', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const organizerFilter = req.user.role === 'admin' ? {} : { organizer: req.user._id };
    const events = await Event.find(organizerFilter);
    const eventIds = events.map(e => e._id);

    const totalEvents = events.length;
    const publishedEvents = events.filter(e => e.status === 'published').length;

    const orders = await Order.find({ event: { $in: eventIds }, status: 'completed' });
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;

    const totalTicketsSold = await Ticket.countDocuments({ event: { $in: eventIds } });
    const ticketsUsed = await Ticket.countDocuments({ event: { $in: eventIds }, status: 'used' });

    res.json({
      success: true,
      data: {
        totalEvents,
        publishedEvents,
        totalRevenue,
        totalOrders,
        totalTicketsSold,
        ticketsUsed,
        currency: 'KES',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/dashboard/events - Organizer's events with sale info
router.get('/events', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const organizerFilter = req.user.role === 'admin' ? {} : { organizer: req.user._id };
    const events = await Event.find(organizerFilter).sort({ createdAt: -1 });

    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const ticketTypes = await TicketType.find({ event: event._id });
        const totalSold = ticketTypes.reduce((sum, tt) => sum + tt.sold, 0);
        const totalCapacity = ticketTypes.reduce((sum, tt) => sum + tt.quantity, 0);
        const orders = await Order.find({ event: event._id, status: 'completed' });
        const revenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

        return {
          ...event.toObject(),
          ticketTypes,
          stats: { totalSold, totalCapacity, revenue, orders: orders.length },
        };
      })
    );

    res.json({ success: true, data: eventsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/dashboard/sales/:eventId - Detailed sales for event
router.get('/sales/:eventId', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const ticketTypes = await TicketType.find({ event: event._id });
    const orders = await Order.find({ event: event._id, status: 'completed' })
      .sort({ createdAt: -1 })
      .populate('buyer', 'name email');

    // Sales by date (for chart)
    const salesByDate = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!salesByDate[date]) salesByDate[date] = { date, revenue: 0, tickets: 0 };
      salesByDate[date].revenue += order.totalAmount;
      salesByDate[date].tickets += order.items.reduce((s, i) => s + i.quantity, 0);
    });

    res.json({
      success: true,
      data: {
        event,
        ticketTypes,
        orders,
        salesByDate: Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
