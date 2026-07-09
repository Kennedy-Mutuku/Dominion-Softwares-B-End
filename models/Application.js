const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  organizationName: { type: String, required: true },
  organizationType: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  projectDescription: { type: String, required: true },
  budget: { type: String, default: 'Not specified' },
  timeline: { type: String, default: 'Not specified' },
  status: { type: String, enum: ['pending', 'contacted', 'closed'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
