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
    console.log('Attempting to send email...');
    console.log('GMAIL_USER:', process.env.GMAIL_USER);
    console.log('GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);
    
    const mailOptions = {
      from: process.env.GMAIL_USER || 'pv.socialstudio@gmail.com',
      to: 'pv.socialstudio@gmail.com',
      subject: subject,
      html: htmlContent
    };

    console.log('Mail options:', { from: mailOptions.from, to: mailOptions.to, subject: mailOptions.subject });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending failed with error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return false;
  }
}

// In-memory user storage (for serverless compatibility)
// In production, use a proper database like MongoDB, PostgreSQL, or Vercel KV
let users = [];

// Initialize with demo users
users.push({
  id: 'demo-client',
  fullName: 'Demo Client',
  email: 'demo@socialstudio.com',
  phone: '+1234567890',
  password: 'Demo123!',
  userType: 'client',
  profile: {
    companyName: 'Demo Company',
    industry: 'Technology'
  },
  createdAt: new Date().toISOString()
});

users.push({
  id: 'demo-intern',
  fullName: 'Demo Intern',
  email: 'intern@socialstudio.com',
  phone: '+1234567890',
  password: 'Demo123!',
  userType: 'intern',
  profile: {
    university: 'Demo University',
    graduationYear: '2025',
    skills: ['JavaScript', 'React', 'SEO']
  },
  createdAt: new Date().toISOString()
});

// Helper function to read users
function readUsers() {
  return users;
}

// Helper function to write users
function writeUsers(newUsers) {
  users = newUsers;
  return true;
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
    console.log('Preparing to send email notification...');
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

    console.log('Calling sendEmail function...');
    const emailResult = await sendEmail(emailSubject, emailHtml);
    console.log('Email send result:', emailResult);
    
    if (emailResult) {
      res.json({ ok: true, message: 'Prototype request submitted successfully' });
    } else {
      res.json({ ok: true, message: 'Prototype request submitted successfully (email notification failed)' });
    }

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

    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide a valid phone number (at least 10 digits)' });
    }

    if (!track) {
      return res.status(400).json({ error: 'Please select a track' });
    }

    if (!portfolio_or_linkedin || portfolio_or_linkedin.trim() === '') {
      return res.status(400).json({ error: 'Please provide your Portfolio or LinkedIn profile URL' });
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

// Signup endpoint
app.post('/api/signup', postLimiter, async (req, res) => {
  const { 
    fullName, 
    email, 
    phone, 
    password, 
    userType,
    companyName,
    industry,
    university,
    graduationYear,
    skills
  } = req.body;

  // Validation
  if (!fullName || fullName.trim().length < 2) {
    return res.status(400).json({ error: 'Please provide your full name (at least 2 characters)' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  if (!phone || phone.trim().length < 10) {
    return res.status(400).json({ error: 'Please provide a valid phone number (at least 10 digits)' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  if (!userType || !['client', 'intern'].includes(userType)) {
    return res.status(400).json({ error: 'Please select a valid user type' });
  }

  // Client-specific validation
  if (userType === 'client') {
    if (!companyName || companyName.trim().length < 2) {
      return res.status(400).json({ error: 'Company name must be at least 2 characters' });
    }
    if (!industry) {
      return res.status(400).json({ error: 'Please select your industry' });
    }
  }

  // Intern-specific validation
  if (userType === 'intern') {
    if (!university || university.trim().length < 2) {
      return res.status(400).json({ error: 'University name must be at least 2 characters' });
    }
    if (!graduationYear) {
      return res.status(400).json({ error: 'Please select your graduation year' });
    }
  }

  try {
    const users = readUsers();
    
    // Check if user already exists
    const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Create new user (in production, hash the password!)
    const newUser = {
      id: Date.now().toString(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: password, // In production, use bcrypt to hash passwords
      userType: userType,
      profile: userType === 'client' ? {
        companyName: companyName.trim(),
        industry: industry
      } : {
        university: university.trim(),
        graduationYear: graduationYear,
        skills: skills ? skills.split(',').map(s => s.trim()) : []
      },
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);
    
    // Log the new user for debugging
    console.log('New user created:', { id: newUser.id, email: newUser.email, fullName: newUser.fullName });
    
    // Send welcome email
    const htmlContent = `
      <h2>Welcome to Social Studio!</h2>
      <p>Hi ${fullName},</p>
      <p>Thank you for creating your account with Social Studio. You now have access to exclusive digital marketing resources and tools.</p>
      <p><strong>Account Details:</strong></p>
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p>You can now sign in to your account and start exploring our services.</p>
      <p>Best regards,<br>The Social Studio Team</p>
    `;

    await sendEmail('Welcome to Social Studio!', htmlContent);

          res.json({ 
        success: true, 
        message: 'Account created successfully! Welcome to Social Studio.',
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          userType: newUser.userType
        }
      });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Login endpoint
app.post('/api/login', postLimiter, async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  if (!password || password.length < 1) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    const users = readUsers();
    
    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password (in production, use bcrypt to compare hashed passwords)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // For demo purposes, also allow the demo credentials
    if (email === 'demo@socialstudio.com' && password === 'Demo123!') {
      return res.json({
        success: true,
        message: 'Login successful!',
        user: {
          id: 'demo-client',
          fullName: 'Demo Client',
          email: 'demo@socialstudio.com',
          userType: 'client'
        }
      });
    }

    if (email === 'intern@socialstudio.com' && password === 'Demo123!') {
      return res.json({
        success: true,
        message: 'Login successful!',
        user: {
          id: 'demo-intern',
          fullName: 'Demo Intern',
          email: 'intern@socialstudio.com',
          userType: 'intern'
        }
      });
    }

    res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Redirect /interns to /interns.html
app.get('/interns', (req, res) => {
  res.redirect('/interns.html');
});

// Service page redirects
app.get('/social-media-marketing', (req, res) => {
  res.redirect('/social-media-marketing.html');
});

app.get('/google-ads-management', (req, res) => {
  res.redirect('/google-ads-management.html');
});

app.get('/seo-optimization', (req, res) => {
  res.redirect('/seo-optimization.html');
});

app.get('/website-design', (req, res) => {
  res.redirect('/website-design.html');
});

app.get('/web-applications', (req, res) => {
  res.redirect('/web-applications.html');
});

app.get('/mobile-apps', (req, res) => {
  res.redirect('/mobile-apps.html');
});

// Auth page redirects
app.get('/login', (req, res) => {
  res.redirect('/login.html');
});

app.get('/signup', (req, res) => {
  res.redirect('/signup.html');
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
