const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true,
  },
  name: { type: String, required: [true, 'Ticket type name is required'] },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'KES' },
  quantity: { type: Number, required: true, min: 1 },
  sold: { type: Number, default: 0 },
  maxPerOrder: { type: Number, default: 10 },
  salesStart: { type: Date },
  salesEnd: { type: Date },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

ticketTypeSchema.virtual('available').get(function () {
  return this.quantity - this.sold;
});

ticketTypeSchema.set('toJSON', { virtuals: true });
ticketTypeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TicketType', ticketTypeSchema);
