# Social Studio Website

A modern, interactive website for Social Studio - a digital marketing and development agency. Built with Node.js, Express, and enhanced with beautiful animations and interactive features.

## 🚀 Features

### Frontend
- **Modern Design**: Clean, professional design with gradient backgrounds and modern typography
- **Interactive Animations**: Scroll-triggered animations using AOS (Animate On Scroll)
- **Responsive Design**: Fully responsive across all devices
- **Interactive Elements**: Hover effects, 3D transforms, and smooth transitions
- **Form Validation**: Client-side and server-side validation for all forms
- **Loading States**: Beautiful loading animations and feedback

### Backend
- **Express.js Server**: RESTful API endpoints for form submissions
- **Email Notifications**: Automatic email notifications for all form submissions
- **Rate Limiting**: Protection against spam and abuse
- **Security**: Helmet.js for security headers and CSP
- **Environment Configuration**: Secure environment variable management

## 📋 Pages

1. **Home Page** (`index.html`)
   - Hero section with animated typing effect
   - Services showcase with interactive cards
   - Industry solutions with hover effects
   - Testimonials with animated cards
   - Contact form with validation

2. **Internships Page** (`interns.html`)
   - Internship opportunities with detailed descriptions
   - Application form with comprehensive validation
   - Benefits and role descriptions
   - Interactive elements and animations

## 🛠️ Technologies Used

### Frontend
- **HTML5**: Semantic markup
- **Tailwind CSS**: Utility-first CSS framework
- **JavaScript**: ES6+ for interactivity
- **AOS**: Animate On Scroll library
- **Font Awesome**: Icon library

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **Nodemailer**: Email sending
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing
- **Express Rate Limit**: Rate limiting middleware

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd sswebfv1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   CONTACT_EMAIL=your-email@gmail.com
   GMAIL_USER=your-gmail@gmail.com
   GMAIL_APP_PASSWORD=your-gmail-app-password
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Email Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → App passwords
   - Select "Mail" and generate password
3. Add the app password to your `.env` file

### Environment Variables
- `PORT`: Server port (default: 3000)
- `CONTACT_EMAIL`: Email address for notifications
- `GMAIL_USER`: Gmail address for sending emails
- `GMAIL_APP_PASSWORD`: Gmail app password

## 📁 Project Structure

```
sswebfv1/
├── client/                 # Frontend files
│   ├── index.html         # Home page
│   ├── interns.html       # Internships page
│   ├── C.png             # Logo
│   └── C.jpeg            # Logo
├── server/                # Backend files
│   └── index.js          # Express server
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (not in repo)
├── .gitignore            # Git ignore rules
└── README.md             # Project documentation
```

## 🚀 API Endpoints

### POST `/api/prototype-request`
Submit a prototype request form
- **Body**: `{ name, email, business, industry, message }`
- **Response**: Email notification sent

### POST `/api/internship-application`
Submit an internship application
- **Body**: `{ name, email, phone, track, portfolio_or_linkedin, availability, location, about }`
- **Response**: Email notification sent

### POST `/api/contact-message`
Submit a contact form message
- **Body**: `{ name, email, subject, message }`
- **Response**: Email notification sent

## 🎨 Design Features

### Animations
- **Scroll-triggered animations** using AOS library
- **Hover effects** with 3D transforms and shadows
- **Typing animation** in hero section
- **Floating particles** background effect
- **Smooth transitions** throughout the site

### Interactive Elements
- **Service cards** with hover elevation
- **Industry cards** with interactive effects
- **Form inputs** with focus animations
- **Navigation** with scroll effects
- **Back-to-top button** with smooth scroll

### Responsive Design
- **Mobile-first** approach
- **Flexible grid** layouts
- **Adaptive typography**
- **Touch-friendly** interactions

## 🔒 Security Features

- **Content Security Policy** (CSP) headers
- **Rate limiting** on API endpoints
- **Input validation** and sanitization
- **Honeypot fields** for spam prevention
- **CORS** configuration
- **Security headers** via Helmet.js

## 📧 Email Notifications

All form submissions trigger email notifications to the configured contact email address, including:
- Form submission details
- Timestamp
- User information
- Form-specific data

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
1. Set up environment variables for production
2. Install dependencies: `npm install`
3. Start server: `node server/index.js`
4. Configure reverse proxy (nginx/Apache) if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary to Social Studio.

## 📞 Contact

For questions or support, contact: hello@socialstudio.in

---

**Built with ❤️ by Social Studio Team**
