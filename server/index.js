const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const emailTemplates = require('./email-templates');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Environment Configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// Security Configuration
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

// 2FA Configuration
const TWO_FACTOR_APP_NAME = 'Social Studio';

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

// 2FA Helper Functions
function generateTwoFactorSecret(user) {
  return speakeasy.generateSecret({
    name: `${TWO_FACTOR_APP_NAME} (${user.email})`,
    issuer: TWO_FACTOR_APP_NAME
  });
}

function verifyTwoFactorToken(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps for clock skew
  });
}

function generateQRCode(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl);
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

// Enhanced Email sending function with templates
async function sendEmail(subject, htmlContent, to = null) {
  try {
    console.log('Attempting to send email...');
    console.log('GMAIL_USER:', process.env.GMAIL_USER);
    console.log('GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);
    
    const mailOptions = {
      from: `"Social Studio" <${process.env.GMAIL_USER || 'pv.socialstudio@gmail.com'}>`,
      to: to || process.env.CONTACT_EMAIL || 'pv.socialstudio@gmail.com',
      subject: subject,
      html: htmlContent,
      replyTo: process.env.CONTACT_EMAIL || 'pv.socialstudio@gmail.com'
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

// Template-based email functions
async function sendWelcomeEmail(userData) {
  const template = emailTemplates.welcome(userData);
  return await sendEmail(template.subject, template.html, userData.email);
}

async function sendPasswordResetEmail(userData) {
  const template = emailTemplates.passwordReset(userData);
  return await sendEmail(template.subject, template.html, userData.email);
}

async function sendPrototypeRequestEmail(data) {
  const template = emailTemplates.prototypeRequest(data);
  return await sendEmail(template.subject, template.html);
}

async function sendInternshipApplicationEmail(data) {
  const template = emailTemplates.internshipApplication(data);
  return await sendEmail(template.subject, template.html);
}

async function sendVerificationSuccessEmail(userData) {
  const template = emailTemplates.verificationSuccess(userData);
  return await sendEmail(template.subject, template.html, userData.email);
}

async function sendTwoFactorSetupEmail(userData) {
  const template = emailTemplates.twoFactorSetup(userData);
  return await sendEmail(template.subject, template.html, userData.email);
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
  emailVerified: true,
  twoFactorEnabled: false,
  twoFactorSecret: null,
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
  emailVerified: true,
  twoFactorEnabled: false,
  twoFactorSecret: null,
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
  emailVerified: true,
  twoFactorEnabled: true,
  twoFactorSecret: 'demo-secret-key-for-admin', // In production, this would be generated
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
      user.password = await bcrypt.hash(demoPasswords[user.email], BCRYPT_ROUNDS);
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

// Enhanced Security Middleware
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

    }
  },
  hsts: {
    maxAge: parseInt(process.env.HELMET_HSTS_MAX_AGE) || 31536000,
    includeSubDomains: process.env.HELMET_HSTS_INCLUDE_SUBDOMAINS === 'true',
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  xssFilter: true,
  hidePoweredBy: true
}));
// Enhanced CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'https://socialstudio.in', 'https://www.socialstudio.in'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// Input sanitization and validation middleware
app.use(express.json({ limit: '10mb' }));

// Input sanitization middleware
app.use((req, res, next) => {
  if (req.body) {
    // Sanitize string inputs
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .trim()
          .replace(/[<>]/g, '') // Remove potential HTML tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+=/gi, ''); // Remove event handlers
      }
    });
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  next();
});

// Enhanced Rate Limiting Configuration
const postLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

// Stricter rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per 15 minutes
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

// Apply rate limiting
app.use('/api', postLimiter);
app.use('/api/login', authLimiter);
app.use('/api/signup', authLimiter);
app.use('/api/forgot-password', authLimiter);
app.use('/api/reset-password', authLimiter);

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

    // Send email notification using template
    console.log('Preparing to send email notification...');
    const emailResult = await sendPrototypeRequestEmail({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      business: business.trim(),
      industry: industry,
      phone: phone ? phone.trim() : 'Not provided',
      message: message ? message.trim() : 'No message provided'
    });
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

    // Send email notification using template
    await sendInternshipApplicationEmail({
      name: n8nData.name,
      email: n8nData.email,
      phone: n8nData.phone,
      track: n8nData.track,
      portfolio_or_linkedin: n8nData.portfolio_or_linkedin,
      why_you: n8nData.about
    });
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
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newUser = {
      id: Date.now().toString(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      userType: userType,
      emailVerified: false,
      twoFactorEnabled: false,
      twoFactorSecret: null,
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
    
    // Generate verification token
    const verificationToken = jwt.sign(
      { id: newUser.id, email: newUser.email, type: 'email-verification' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send welcome and verification email using template
    const verificationLink = `${req.protocol}://${req.get('host')}/verify-email.html?token=${verificationToken}`;
    await sendWelcomeEmail({
      fullName: fullName,
      email: email,
      phone: phone,
      userType: userType,
      verificationLink: verificationLink
    });

          res.json({ 
        success: true, 
        message: 'Account created successfully! Please check your email for verification.',
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

    // Send password reset email using template
    const resetLink = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
    await sendPasswordResetEmail({
      fullName: user.fullName,
      resetLink: resetLink
    });

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
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.password = hashedPassword;

    // Send confirmation email using template
    await sendVerificationSuccessEmail({
      fullName: user.fullName,
      email: user.email
    });

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

app.get('/verify-email', (req, res) => {
  res.redirect('/verify-email.html');
});

app.get('/2fa-setup', (req, res) => {
  res.redirect('/2fa-setup.html');
});

app.get('/analytics', (req, res) => {
  res.redirect('/analytics-dashboard.html');
});

app.get('/messaging', (req, res) => {
  res.redirect('/messaging.html');
});

// 2FA endpoints
app.post('/api/2fa/setup', authenticateToken, async (req, res) => {
  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new 2FA secret
    const secret = generateTwoFactorSecret(user);
    const qrCode = await generateQRCode(secret.otpauth_url);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCode,
      otpauthUrl: secret.otpauth_url
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

app.post('/api/2fa/verify', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA not set up' });
    }

    const isValid = verifyTwoFactorToken(user.twoFactorSecret, token);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 2FA token' });
    }

    res.json({ success: true, message: '2FA token verified' });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA token' });
  }
});

app.post('/api/2fa/enable', authenticateToken, async (req, res) => {
  try {
    const { token, secret } = req.body;
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify the token
    const isValid = verifyTwoFactorToken(secret, token);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 2FA token' });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorSecret = secret;

    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

app.post('/api/2fa/disable', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA not enabled' });
    }

    // Verify the token
    const isValid = verifyTwoFactorToken(user.twoFactorSecret, token);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 2FA token' });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// Email verification endpoints
app.post('/api/email/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify verification token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'email-verification') {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const users = readUsers();
    const user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Mark email as verified
    user.emailVerified = true;

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Verification token has expired' });
    }
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

app.post('/api/email/resend-verification', authenticateToken, async (req, res) => {
  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { id: user.id, email: user.email, type: 'email-verification' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send verification email
    const verificationLink = `${req.protocol}://${req.get('host')}/verify-email.html?token=${verificationToken}`;
    const htmlContent = `
      <h2>Email Verification</h2>
      <p>Hi ${user.fullName},</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationLink}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
      <p>Best regards,<br>The Social Studio Team</p>
    `;

    await sendEmail('Verify Your Email Address', htmlContent);

    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
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

// Additional security headers middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
});

// 2FA Setup endpoint
app.post('/api/2fa/setup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Social Studio (${user.email})`,
      issuer: 'Social Studio'
    });
    
    // Store secret temporarily (in production, store in database)
    user.temp2FASecret = secret.base32;
    
    // Generate QR code
    const qrCodeUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: user.email,
      issuer: 'Social Studio',
      algorithm: 'sha1'
    });
    
    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// 2FA Verify and Enable endpoint
app.post('/api/2fa/enable', authenticateToken, async (req, res) => {
  try {
    const { token, secret } = req.body;
    const userId = req.user.id;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.temp2FASecret) {
      return res.status(400).json({ error: 'No pending 2FA setup found' });
    }
    
    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.temp2FASecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps for clock skew
    });
    
    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Enable 2FA for user
    user.twoFactorEnabled = true;
    user.twoFactorSecret = user.temp2FASecret;
    delete user.temp2FASecret;
    
    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
    user.backupCodes = backupCodes;
    
    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
      backupCodes
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// 2FA Verify endpoint (for login)
app.post('/api/2fa/verify', async (req, res) => {
  try {
    const { email, token } = req.body;
    const user = users.find(u => u.email === email);
    
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });
    
    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    res.json({
      success: true,
      message: '2FA verification successful'
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

// 2FA Backup Code Verify endpoint
app.post('/api/2fa/backup-verify', async (req, res) => {
  try {
    const { email, backupCode } = req.body;
    const user = users.find(u => u.email === email);
    
    if (!user || !user.twoFactorEnabled || !user.backupCodes) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    // Check if backup code exists and remove it (one-time use)
    const codeIndex = user.backupCodes.indexOf(backupCode);
    if (codeIndex === -1) {
      return res.status(400).json({ error: 'Invalid backup code' });
    }
    
    // Remove used backup code
    user.backupCodes.splice(codeIndex, 1);
    
    res.json({
      success: true,
      message: 'Backup code verification successful',
      remainingCodes: user.backupCodes.length
    });
  } catch (error) {
    console.error('Backup code verify error:', error);
    res.status(500).json({ error: 'Failed to verify backup code' });
  }
});

// Generate new backup codes
app.post('/api/2fa/backup-codes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = users.find(u => u.id === userId);
    
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA not enabled' });
    }
    
    // Generate new backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
    
    user.backupCodes = backupCodes;
    
    res.json({
      success: true,
      backupCodes
    });
  } catch (error) {
    console.error('Generate backup codes error:', error);
    res.status(500).json({ error: 'Failed to generate backup codes' });
  }
});

// Disable 2FA
app.post('/api/2fa/disable', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.backupCodes = null;
    
    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// Email verification endpoint
app.post('/api/email/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    // In production, verify token from database
    // For demo, accept any token
    if (!token || token.length < 6) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }
    
    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend email verification
app.post('/api/email/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    // In production, generate and send new verification email
    // For demo, just return success
    
    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Don't leak error details in production
  const errorMessage = isProduction ? 'Internal server error' : error.message;
  const statusCode = error.statusCode || 500;
  
  res.status(statusCode).json({
    error: errorMessage,
    ...(isProduction ? {} : { stack: error.stack })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Catch-all route to serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔒 Security: Enhanced security features enabled`);
  console.log(`📧 Email notifications: ${process.env.GMAIL_APP_PASSWORD ? 'Configured' : 'Not configured'}`);
  console.log(`📞 Contact Email: ${process.env.CONTACT_EMAIL || 'pv.socialstudio@gmail.com'}`);
  console.log(`⚡ Rate limiting: ${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW_MS/1000/60} minutes`);
  console.log(`🔐 JWT expiry: ${JWT_EXPIRES_IN}`);
  console.log(`🛡️ Bcrypt rounds: ${BCRYPT_ROUNDS}`);
});
