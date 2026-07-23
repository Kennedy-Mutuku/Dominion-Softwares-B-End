const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  clientType: { type: String }, // 'ministry' or 'business'
  organizationName: { type: String, required: true },
  organizationType: { type: String, required: true },
  organizationTypeOther: { type: String },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  targetAudience: { type: String },
  primaryGoal: { type: String },
  contentManagement: { type: String },
  selectedFeatures: [{ type: String }],
  
  // Category A: Design & Layout Inspirations (Scope Discovery)
  designInspirations: {
    images: [{
      url: { type: String },
      filename: { type: String }
    }],
    videoUrl: { type: String }
  },

  // Category B: Ready-to-Use Brand Assets (Production Content)
  brandAssets: {
    files: [{
      url: { type: String },
      filename: { type: String },
      fileType: { type: String }
    }],
    externalDriveUrl: { type: String }
  },

  needAccounts: { type: String },
  accountTypes: [{ type: String }],
  paymentIntegration: { type: String },
  specificFeatures: { type: String },
  
  // Requirements Engineering Guidance (NFRs)
  nfr: {
    expectedUserCapacity: { type: String },
    securityRequirements: [{ type: String }],
    thirdPartyIntegrations: [{ type: String }],
    additionalNfrNotes: { type: String }
  },

  projectDescription: { type: String, required: true },
  budget: { type: String, default: 'Not specified' },
  timeline: { type: String, default: 'Not specified' },
  deadline: { type: Date },
  additionalNotes: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'feedback', 'contacted', 'closed'], default: 'pending' },
  adminFeedback: { type: String },
  clientFeedback: { type: String },
  messages: [{
    sender: { type: String, enum: ['admin', 'client'], required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
