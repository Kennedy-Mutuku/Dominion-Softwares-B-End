const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true },
  ticketCode: { type: String, required: true, unique: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  ticketType: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  eventTitle: { type: String },
  typeName: { type: String },
  ownerName: { type: String },
  ownerEmail: { type: String },
  attendeeData: { type: mongoose.Schema.Types.Mixed },
  attendeePhoto: { type: String },
  status: {
    type: String,
    enum: ['valid', 'used', 'cancelled'],
    default: 'valid',
  },
  usedAt: { type: Date },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ticketNumber and ticketCode indexes already defined via unique:true on the fields

module.exports = mongoose.model('Ticket', ticketSchema);
