const express = require('express');
const router = express.Router();

const applications = [];

router.post('/', (req, res) => {
  const { organizationName, organizationType, contactPerson, email, phone, projectDescription, budget, timeline } = req.body;

  if (!organizationName || !organizationType || !contactPerson || !email || !phone || !projectDescription) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }

  const newApplication = {
    id: Date.now().toString(),
    organizationName,
    organizationType,
    contactPerson,
    email,
    phone,
    projectDescription,
    budget: budget || 'Not specified',
    timeline: timeline || 'Not specified',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  applications.push(newApplication);
  res.status(201).json({ success: true, message: 'Application submitted successfully', data: newApplication });
});

router.get('/', (req, res) => {
  res.json({ success: true, data: applications });
});

module.exports = router;
