const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'pv.socialstudio@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Email sending function
async function sendEmail(subject, htmlContent) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER || 'pv.socialstudio@gmail.com',
      to: 'pv.socialstudio@gmail.com',
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting for POST routes
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (increased for testing)
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to POST routes
app.use('/api', postLimiter);

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// API Routes

// POST /api/prototype-request
app.post('/api/prototype-request', async (req, res) => {
  try {
    const { name, email, business, industry, message, phone, company_website } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (!business || business.trim().length < 2) {
      return res.status(400).json({ error: 'Business name must be at least 2 characters' });
    }

    if (!industry) {
      return res.status(400).json({ error: 'Please select an industry' });
    }

    // Honeypot validation - if company_website is filled, it's likely a bot
    if (company_website && company_website.trim()) {
      console.log('Bot detected via honeypot field');
      return res.status(400).json({ error: 'Invalid submission' });
    }

    if (message && message.length > 2000) {
      return res.status(400).json({ error: 'Message must be less than 2000 characters' });
    }

    // Log the request
    console.log('Prototype request received:', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      business: business.trim(),
      industry,
      phone: phone ? phone.trim() : '',
      message: message ? message.trim() : '',
      timestamp: new Date().toISOString()
    });

    // Send email notification
    const emailSubject = `New Prototype Request - ${business.trim()}`;
    const emailHtml = `
      <h2>New Prototype Request</h2>
      <p><strong>Name:</strong> ${name.trim()}</p>
      <p><strong>Email:</strong> ${email.trim().toLowerCase()}</p>
      <p><strong>Business:</strong> ${business.trim()}</p>
      <p><strong>Industry:</strong> ${industry}</p>
      <p><strong>Phone:</strong> ${phone ? phone.trim() : 'Not provided'}</p>
      <p><strong>Message:</strong> ${message ? message.trim() : 'No message provided'}</p>
      <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
    `;

    await sendEmail(emailSubject, emailHtml);
    res.json({ ok: true, message: 'Prototype request submitted successfully' });

  } catch (error) {
    console.error('Error processing prototype request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/internship-application
app.post('/api/internship-application', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      track, 
      portfolio_or_linkedin, 
      availability, 
      location, 
      about, 
      website 
    } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (!track) {
      return res.status(400).json({ error: 'Please select a track' });
    }

    if (!availability) {
      return res.status(400).json({ error: 'Please specify your availability' });
    }

    if (!about || about.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide more details about yourself (at least 10 characters)' });
    }

    // Honeypot validation
    if (website && website.trim()) {
      console.log('Bot detected via honeypot field');
      return res.status(400).json({ error: 'Invalid submission' });
    }

    // Prepare data for n8n
    const n8nData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      track: track.trim(),
      portfolio_or_linkedin: portfolio_or_linkedin ? portfolio_or_linkedin.trim() : '',
      availability: availability.trim(),
      location: location ? location.trim() : '',
      about: about.trim(),
      website: '' // Always empty for honeypot
    };

    // Log the application
    console.log('Internship application received:', n8nData);

    // Send email notification
    const emailSubject = `New Internship Application - ${n8nData.name}`;
    const emailHtml = `
      <h2>New Internship Application</h2>
      <p><strong>Name:</strong> ${n8nData.name}</p>
      <p><strong>Email:</strong> ${n8nData.email}</p>
      <p><strong>Phone:</strong> ${n8nData.phone || 'Not provided'}</p>
      <p><strong>Track:</strong> ${n8nData.track}</p>
      <p><strong>Availability:</strong> ${n8nData.availability}</p>
      <p><strong>Location:</strong> ${n8nData.location || 'Not provided'}</p>
      <p><strong>Portfolio/LinkedIn:</strong> ${n8nData.portfolio_or_linkedin || 'Not provided'}</p>
      <p><strong>About:</strong> ${n8nData.about}</p>
      <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
    `;

    await sendEmail(emailSubject, emailHtml);
    res.json({ ok: true });

  } catch (error) {
    console.error('Error processing internship application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/contact-message
app.post('/api/contact-message', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (!message || message.trim().length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters' });
    }

    // Log the contact message
    console.log('Contact message received:', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject ? subject.trim() : 'No subject',
      message: message.trim(),
      timestamp: new Date().toISOString()
    });

    // Send email notification
    const emailSubject = `Contact Form - ${subject ? subject.trim() : 'No Subject'}`;
    const emailHtml = `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${name.trim()}</p>
      <p><strong>Email:</strong> ${email.trim().toLowerCase()}</p>
      <p><strong>Subject:</strong> ${subject ? subject.trim() : 'No subject'}</p>
      <p><strong>Message:</strong></p>
      <p>${message.trim()}</p>
      <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
    `;

    await sendEmail(emailSubject, emailHtml);
    res.json({ ok: true, message: 'Message sent successfully' });

  } catch (error) {
    console.error('Error processing contact message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Catch-all route to serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Email notifications: ${process.env.GMAIL_APP_PASSWORD ? 'Configured' : 'Not configured'}`);
  console.log(`Contact Email: ${process.env.CONTACT_EMAIL || 'pv.socialstudio@gmail.com'}`);
});
