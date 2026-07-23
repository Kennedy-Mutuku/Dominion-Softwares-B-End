const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  items: [{
    ticketType: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', required: true },
    typeName: { type: String },
    price: { type: Number },
    quantity: { type: Number, required: true, min: 1 },
  }],
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'KES' },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'pending',
  },
  payment: {
    method: { type: String, default: 'mock' },
    transactionId: { type: String },
    paidAt: { type: Date },
  },
  attendeeDetails: { type: mongoose.Schema.Types.Mixed },
  attendeePhoto: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
