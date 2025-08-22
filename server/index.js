const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days

// JWT Helper Functions
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      userType: user.userType 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
}

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

// Initialize with demo users (passwords will be hashed on first run)
users.push({
  id: 'demo-client',
  fullName: 'Demo Client',
  email: 'demo@socialstudio.com',
  phone: '+1234567890',
  password: '$2a$10$demo.hash.for.Demo123!', // Will be updated with real hash
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
  password: '$2a$10$demo.hash.for.Demo123!', // Will be updated with real hash
  userType: 'intern',
  profile: {
    university: 'Demo University',
    graduationYear: '2025',
    skills: ['JavaScript', 'React', 'SEO']
  },
  createdAt: new Date().toISOString()
});

users.push({
  id: 'demo-admin',
  fullName: 'Admin User',
  email: 'admin@socialstudio.com',
  phone: '+1234567890',
  password: '$2a$10$demo.hash.for.Admin123!', // Will be updated with real hash
  userType: 'admin',
  profile: {
    role: 'System Administrator',
    permissions: ['users', 'applications', 'prototypes', 'settings']
  },
  createdAt: new Date().toISOString()
});

// Hash demo passwords on first run
async function initializeDemoPasswords() {
  const demoPasswords = {
    'demo@socialstudio.com': 'Demo123!',
    'intern@socialstudio.com': 'Demo123!',
    'admin@socialstudio.com': 'Admin123!'
  };

  for (const user of users) {
    if (demoPasswords[user.email] && user.password.startsWith('$2a$10$demo.hash.for.')) {
      user.password = await bcrypt.hash(demoPasswords[user.email], 10);
      console.log(`Hashed password for ${user.email}`);
    }
  }
}

// Initialize passwords
initializeDemoPasswords();

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
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now().toString(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
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

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType
      },
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Dashboard redirects
app.get('/dashboard', (req, res) => {
  res.redirect('/dashboard.html');
});

app.get('/intern-dashboard', (req, res) => {
  res.redirect('/intern-dashboard.html');
});

app.get('/admin-dashboard', (req, res) => {
  res.redirect('/admin-dashboard.html');
});

// User profile endpoint
app.get('/api/user/profile', (req, res) => {
  // In production, verify JWT token
  const userId = req.headers.authorization?.split(' ')[1];
  
  if (!userId || userId === 'demo-token') {
    // Return demo user data
    const demoUser = users.find(u => u.email === 'demo@socialstudio.com');
    if (demoUser) {
      return res.json({
        fullName: demoUser.fullName,
        email: demoUser.email,
        phone: demoUser.phone,
        profile: demoUser.profile
      });
    }
  }
  
  res.status(401).json({ error: 'Unauthorized' });
});

// Update user profile endpoint
app.put('/api/user/profile', (req, res) => {
  const { fullName, email, phone, companyName, industry } = req.body;
  
  // In production, verify JWT token and update user
  const userId = req.headers.authorization?.split(' ')[1];
  
  if (!userId || userId === 'demo-token') {
    // Update demo user
    const demoUser = users.find(u => u.email === 'demo@socialstudio.com');
    if (demoUser) {
      demoUser.fullName = fullName;
      demoUser.email = email;
      demoUser.phone = phone;
      demoUser.profile = {
        companyName,
        industry
      };
      
      return res.json({ success: true, message: 'Profile updated successfully' });
    }
  }
  
  res.status(401).json({ error: 'Unauthorized' });
});

// Get user prototypes endpoint
app.get('/api/prototypes', (req, res) => {
  // In production, verify JWT token and get user-specific prototypes
  const userId = req.headers.authorization?.split(' ')[1];
  
  if (!userId || userId === 'demo-token') {
    // Return demo prototypes
    const demoPrototypes = [
      {
        id: '1',
        business: 'Tech Startup',
        industry: 'Technology',
        status: 'completed',
        message: 'Website redesign for our SaaS platform',
        createdAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-20T15:00:00Z'
      },
      {
        id: '2',
        business: 'Local Restaurant',
        industry: 'Food & Beverage',
        status: 'in_progress',
        message: 'Social media marketing campaign',
        createdAt: '2024-01-25T14:00:00Z'
      }
    ];
    
    return res.json(demoPrototypes);
  }
  
  res.status(401).json({ error: 'Unauthorized' });
});

// Submit new prototype request endpoint
app.post('/api/prototype-request', postLimiter, async (req, res) => {
  const { business, industry, phone, message } = req.body;
  
  // Validation
  if (!business || business.trim().length < 2) {
    return res.status(400).json({ error: 'Business name must be at least 2 characters' });
  }
  
  if (!industry) {
    return res.status(400).json({ error: 'Please select an industry' });
  }
  
  if (!phone || phone.trim().length < 10) {
    return res.status(400).json({ error: 'Please provide a valid phone number' });
  }
  
  if (!message || message.trim().length < 10) {
    return res.status(400).json({ error: 'Project description must be at least 10 characters' });
  }
  
  try {
    // In production, get user from JWT token
    const userId = req.headers.authorization?.split(' ')[1];
    
    // Create new prototype request
    const newPrototype = {
      id: Date.now().toString(),
      business: business.trim(),
      industry,
      phone: phone.trim(),
      message: message.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // Send email notification
    const htmlContent = `
      <h2>New Prototype Request</h2>
      <p><strong>Business:</strong> ${newPrototype.business}</p>
      <p><strong>Industry:</strong> ${newPrototype.industry}</p>
      <p><strong>Phone:</strong> ${newPrototype.phone}</p>
      <p><strong>Project Description:</strong></p>
      <p>${newPrototype.message}</p>
      <p><strong>Status:</strong> Pending</p>
      <p><strong>Request ID:</strong> ${newPrototype.id}</p>
    `;
    
    await sendEmail('New Prototype Request', htmlContent);
    
    res.json({ 
      success: true, 
      message: 'Prototype request submitted successfully!',
      prototype: newPrototype
    });
    
  } catch (error) {
    console.error('Prototype request error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Get internship applications endpoint
app.get('/api/internship-applications', (req, res) => {
  // In production, verify JWT token and get user-specific applications
  const userId = req.headers.authorization?.split(' ')[1];
  
  if (!userId || userId === 'demo-token') {
    // Return demo applications for intern user
    const demoApplications = [
      {
        id: '1',
        track: 'Social Media Marketing',
        status: 'accepted',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        track: 'Web Development',
        status: 'interview_scheduled',
        createdAt: '2024-01-25T14:00:00Z'
      }
    ];
    
    return res.json(demoApplications);
  }
  
  res.status(401).json({ error: 'Unauthorized' });
});

// Submit internship application endpoint (for dashboard)
app.post('/api/internship-application-dashboard', postLimiter, async (req, res) => {
  const { name, email, phone, track, portfolio, about } = req.body;
  
  // Validation
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }
  
  if (!phone || phone.trim().length < 10) {
    return res.status(400).json({ error: 'Please provide a valid phone number' });
  }
  
  if (!track) {
    return res.status(400).json({ error: 'Please select an internship track' });
  }
  
  if (!portfolio || !portfolio.includes('http')) {
    return res.status(400).json({ error: 'Please provide a valid portfolio or LinkedIn URL' });
  }
  
  if (!about || about.trim().length < 20) {
    return res.status(400).json({ error: 'Please provide a detailed response (at least 20 characters)' });
  }
  
  try {
    // In production, get user from JWT token
    const userId = req.headers.authorization?.split(' ')[1];
    
    // Create new application
    const newApplication = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      track,
      portfolio: portfolio.trim(),
      about: about.trim(),
      status: 'submitted',
      createdAt: new Date().toISOString()
    };
    
    // Send email notification
    const htmlContent = `
      <h2>New Internship Application (Dashboard)</h2>
      <p><strong>Name:</strong> ${newApplication.name}</p>
      <p><strong>Email:</strong> ${newApplication.email}</p>
      <p><strong>Phone:</strong> ${newApplication.phone}</p>
      <p><strong>Track:</strong> ${newApplication.track}</p>
      <p><strong>Portfolio:</strong> <a href="${newApplication.portfolio}">${newApplication.portfolio}</a></p>
      <p><strong>About:</strong></p>
      <p>${newApplication.about}</p>
      <p><strong>Status:</strong> Submitted</p>
      <p><strong>Application ID:</strong> ${newApplication.id}</p>
    `;
    
    await sendEmail('New Internship Application (Dashboard)', htmlContent);
    
    res.json({ 
      success: true, 
      message: 'Application submitted successfully!',
      application: newApplication
    });
    
  } catch (error) {
    console.error('Internship application error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Password reset endpoints
app.post('/api/forgot-password', postLimiter, async (req, res) => {
  const { email } = req.body;

  // Validation
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  try {
    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        success: true, 
        message: 'If an account with this email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token (in production, use a more secure method)
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, type: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send password reset email
    const resetLink = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
    const htmlContent = `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.fullName},</p>
      <p>You requested a password reset for your Social Studio account.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetLink}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this reset, please ignore this email.</p>
      <p>Best regards,<br>The Social Studio Team</p>
    `;

    await sendEmail('Password Reset Request', htmlContent);

    res.json({ 
      success: true, 
      message: 'If an account with this email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.post('/api/reset-password', postLimiter, async (req, res) => {
  const { token, newPassword } = req.body;

  // Validation
  if (!token) {
    return res.status(400).json({ error: 'Reset token is required' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Verify reset token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const users = readUsers();
    const user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Send confirmation email
    const htmlContent = `
      <h2>Password Reset Successful</h2>
      <p>Hi ${user.fullName},</p>
      <p>Your password has been successfully reset.</p>
      <p>You can now log in with your new password.</p>
      <p>If you didn't request this change, please contact us immediately.</p>
      <p>Best regards,<br>The Social Studio Team</p>
    `;

    await sendEmail('Password Reset Successful', htmlContent);

    res.json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now log in with your new password.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Admin endpoints
app.get('/api/admin/users', (req, res) => {
  // In production, verify admin JWT token
  const userId = req.headers.authorization?.split(' ')[1];
  
  if (!userId || userId === 'demo-token') {
    // Return all users for admin
    const adminUsers = users.map(user => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      userType: user.userType,
      createdAt: user.createdAt,
      status: 'active'
    }));
    
    return res.json(adminUsers);
  }
  
  res.status(401).json({ error: 'Unauthorized' });
});

app.get('/api/admin/applications', (req, res) => {
  // In production, verify admin JWT token
  const userId = req.headers.authorization?.split(' ')[1];
  
  if (!userId || userId === 'demo-token') {
    // Return all applications for admin
    const adminApplications = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        track: 'Social Media Marketing',
        status: 'submitted',
        createdAt: '2024-01-25T10:00:00Z',
        about: 'Passionate about social media marketing with experience in content creation and analytics.'
      },
      {
        id: '2',
        name: 'Mike Chen',
        email: 'mike@example.com',
        track: 'Web Development',
        status: 'interview_scheduled',
        createdAt: '2024-01-24T14:00:00Z',
        about: 'Computer Science student with strong programming skills in JavaScript, React, and Node.js.'
      },
      {
        id: '3',
        name: 'Emily Davis',
        email: 'emily@example.com',
        track: 'SEO Optimization',
        status: 'accepted',
        createdAt: '2024-01-23T09:00:00Z',
        about: 'Marketing graduate with strong analytical skills and experience in digital marketing.'
      }
    ];
    
    return res.json(adminApplications);
  }
  
  res.status(401).json({ error: 'Unauthorized' });
});

app.get('/api/admin/prototypes', (req, res) => {
  // In production, verify admin JWT token
  const userId = req.headers.authorization?.split(' ')[1];
  
  if (!userId || userId === 'demo-token') {
    // Return all prototypes for admin
    const adminPrototypes = [
      {
        id: '1',
        business: 'Tech Startup',
        industry: 'Technology',
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-20T15:00:00Z'
      },
      {
        id: '2',
        business: 'Local Restaurant',
        industry: 'Food & Beverage',
        status: 'in_progress',
        createdAt: '2024-01-25T14:00:00Z'
      },
      {
        id: '3',
        business: 'Healthcare Clinic',
        industry: 'Healthcare',
        status: 'pending',
        createdAt: '2024-01-26T11:00:00Z'
      }
    ];
    
    return res.json(adminPrototypes);
  }
  
  res.status(401).json({ error: 'Unauthorized' });
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

app.get('/forgot-password', (req, res) => {
  res.redirect('/forgot-password.html');
});

app.get('/reset-password', (req, res) => {
  res.redirect('/reset-password.html');
});

app.get('/analytics', (req, res) => {
  res.redirect('/analytics-dashboard.html');
});

app.get('/messaging', (req, res) => {
  res.redirect('/messaging.html');
});

// Analytics endpoints
app.get('/api/analytics/dashboard', authenticateToken, (req, res) => {
  try {
    // In production, fetch real analytics data from database
    const analyticsData = {
      stats: {
        totalUsers: users.length,
        totalApplications: 89, // Demo data
        totalPrototypes: 156, // Demo data
        conversionRate: 23.5, // Demo data
        activeUsers: 342 // Demo data
      },
      userGrowth: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [850, 920, 1050, 1120, 1180, users.length]
      },
      applicationStatus: {
        labels: ['Pending', 'Under Review', 'Interview', 'Accepted', 'Rejected'],
        data: [23, 34, 12, 15, 5]
      },
      recentActivity: [
        { type: 'user', message: 'New user registered: john.doe@example.com', time: '2 minutes ago' },
        { type: 'application', message: 'Application submitted for Frontend Development', time: '5 minutes ago' },
        { type: 'prototype', message: 'Prototype request: E-commerce website', time: '12 minutes ago' },
        { type: 'admin', message: 'Admin reviewed application #1234', time: '1 hour ago' },
        { type: 'system', message: 'System backup completed successfully', time: '2 hours ago' }
      ]
    };
    
    res.json(analyticsData);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics data' });
  }
});

// Messaging endpoints
app.get('/api/messaging/conversations', authenticateToken, (req, res) => {
  try {
    // In production, fetch real conversations from database
    const conversations = [
      {
        id: 1,
        name: 'Admin Team',
        lastMessage: 'Your application has been reviewed',
        timestamp: '2 minutes ago',
        unread: 2,
        avatar: 'fas fa-user-shield'
      },
      {
        id: 2,
        name: 'Support Team',
        lastMessage: 'We\'re here to help with any questions',
        timestamp: '1 hour ago',
        unread: 0,
        avatar: 'fas fa-headset'
      }
    ];
    
    res.json(conversations);
  } catch (error) {
    console.error('Messaging error:', error);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

app.get('/api/messaging/messages/:conversationId', authenticateToken, (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // In production, fetch real messages from database
    const messages = [
      { id: 1, sender: 'them', message: 'Hello! How can we help you today?', timestamp: '10:30 AM' },
      { id: 2, sender: 'me', message: 'Hi! I have a question about my application.', timestamp: '10:32 AM' },
      { id: 3, sender: 'them', message: 'Of course! What would you like to know?', timestamp: '10:33 AM' }
    ];
    
    res.json(messages);
  } catch (error) {
    console.error('Messages error:', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

app.post('/api/messaging/send', authenticateToken, (req, res) => {
  try {
    const { conversationId, message } = req.body;
    
    // In production, save message to database
    const newMessage = {
      id: Date.now(),
      sender: 'me',
      message: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
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
