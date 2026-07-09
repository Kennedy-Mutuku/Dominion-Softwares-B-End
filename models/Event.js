const mongoose = require('mongoose');

const registrationFieldSchema = new mongoose.Schema({
  fieldName: { type: String, required: true },
  fieldType: { type: String, enum: ['text', 'email', 'phone', 'select', 'textarea'], default: 'text' },
  required: { type: Boolean, default: false },
  options: [{ type: String }],
  order: { type: Number, default: 0 },
}, { _id: false });

const ticketTemplateSchema = new mongoose.Schema({
  logo: { type: String },
  headerColor: { type: String, default: '#E8820C' },
  showFields: [{ type: String }],
  requirePhoto: { type: Boolean, default: false },
  customMessage: { type: String },
  showVenue: { type: Boolean, default: true },
  showDate: { type: Boolean, default: true },
  showPrice: { type: Boolean, default: true },
}, { _id: false });

const eventSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: { type: String, required: [true, 'Event title is required'] },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: [true, 'Description is required'] },
  category: {
    type: String,
    required: true,
    enum: ['conference', 'concert', 'workshop', 'seminar', 'church-event', 'sports', 'charity', 'festival', 'networking', 'other'],
  },
  venue: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
  },
  date: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    doorsOpen: { type: Date },
  },
  images: {
    cover: { type: String },
    gallery: [{ type: String }],
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft',
  },
  isFeatured: { type: Boolean, default: false },
  tags: [{ type: String }],
  registrationFields: {
    type: [registrationFieldSchema],
    default: [
      { fieldName: 'Full Name', fieldType: 'text', required: true, order: 0 },
      { fieldName: 'Email', fieldType: 'email', required: true, order: 1 },
      { fieldName: 'Phone', fieldType: 'phone', required: true, order: 2 },
    ],
  },
  ticketTemplate: {
    type: ticketTemplateSchema,
    default: () => ({}),
  },
}, { timestamps: true });

eventSchema.index({ status: 1, 'date.start': 1 });
eventSchema.index({ category: 1, 'venue.city': 1 });
// slug index already defined via unique:true on the field — no duplicate needed

module.exports = mongoose.model('Event', eventSchema);
