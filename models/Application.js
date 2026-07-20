const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  clientType: { type: String },
  organizationName: { type: String, required: true },
  organizationType: { type: String, required: true },
  organizationTypeOther: { type: String },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  targetAudience: { type: String },
  primaryGoal: { type: String },
  contentManagement: { type: String },
  needAccounts: { type: String },
  accountTypes: [{ type: String }],
  paymentIntegration: { type: String },
  specificFeatures: { type: String },
  projectDescription: { type: String, required: true },
  budget: { type: String, default: 'Not specified' },
  timeline: { type: String, default: 'Not specified' },
  deadline: { type: Date },
  additionalNotes: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'feedback', 'contacted', 'closed'], default: 'pending' },
  adminFeedback: { type: String },
  clientFeedback: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
