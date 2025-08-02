const express = require('express');
const router = express.Router();
const PrototypeRequest = require('../models/PrototypeRequest');
const ContactMessage = require('../models/ContactMessage');
const { body, validationResult } = require('express-validator');

// POST /api/prototype-request
router.post('/prototype-request', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('business_type').trim().notEmpty().withMessage('Business type is required'),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
  body('message').optional().trim()
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, email, business_type, website, message } = req.body;
    const newRequest = new PrototypeRequest({ name, email, business_type, website, message });
    await newRequest.save();
    res.status(201).json({ message: 'Prototype request submitted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/contact-message
router.post('/contact-message', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, email, message } = req.body;
    const newMessage = new ContactMessage({ name, email, message });
    await newMessage.save();
    res.status(201).json({ message: 'Contact message submitted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
