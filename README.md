# Social Studio Website

A modern website for Social Studio digital marketing and development agency, featuring a landing page and internship application system.

## Features

- **Landing Page**: Marketing content with services, industries, testimonials, and contact forms
- **Internship Application**: Complete application system with form validation and spam protection
- **API Backend**: Express.js server with endpoints for form submissions
- **N8N Integration**: Webhook integration for automated email notifications and data storage

## Project Structure

```
├── client/                 # Static site files
│   ├── index.html         # Main landing page
│   ├── interns.html       # Internship application page
│   ├── C.jpeg            # Header logo
│   └── C.png             # Footer logo
├── server/                # Express.js API server
│   └── index.js          # Main server file
├── package.json          # Dependencies and scripts
├── env.example           # Environment variables template
└── README.md            # This file
```

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd social-studio
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3000
N8N_BASE_URL=https://your-n8n-domain.app.n8n.cloud
CONTACT_EMAIL=hello@socialstudio.in
GOOGLE_SHEET_ID=your_google_sheet_id_here
GMAIL_FROM=your_gmail@gmail.com
```

4. Start development server:
```bash
npm run dev
```

This will start:
- Express server on port 3000
- Live server for client files on port 5173

## API Endpoints

### POST /api/prototype-request
Handles free prototype requests from the landing page.

**Required fields:**
- `name` (string, min 2 chars)
- `email` (valid email format)
- `business` (string, min 2 chars)
- `industry` (string)

**Optional fields:**
- `message` (string, max 2000 chars)
- `website` (string, optional)

**Honeypot:**
- `company_website` (must be empty)

### POST /api/internship-application
Handles internship applications with N8N integration.

**Required fields:**
- `name` (string, min 2 chars)
- `email` (valid email format)
- `track` (string: "Sales" or "Marketing")
- `availability` (string)
- `about` (string, min 10 chars)

**Optional fields:**
- `phone` (string)
- `portfolio_or_linkedin` (string)
- `location` (string)

**Honeypot:**
- `website` (must be empty)

### POST /api/contact-message
Handles general contact form submissions.

**Required fields:**
- `name` (string, min 2 chars)
- `email` (valid email format)
- `message` (string, min 10 chars)

**Optional fields:**
- `subject` (string)

## N8N Workflow Integration

The internship application form integrates with an N8N workflow that:

1. **Validates** required fields and honeypot
2. **Normalizes** data and adds timestamps
3. **Stores** applications in Google Sheets
4. **Sends** email notifications to admin and applicant
5. **Returns** `{ "ok": true }` on success

### Field Mapping

Frontend field names are mapped to N8N expectations:

| Frontend | N8N Field | Description |
|----------|-----------|-------------|
| `name` | `name` | Full name |
| `email` | `email` | Email address |
| `phone` | `phone` | Phone number (optional) |
| `track` | `track` | Internship track |
| `portfolio_or_linkedin` | `portfolio_or_linkedin` | Portfolio/LinkedIn URL |
| `availability` | `availability` | Availability period |
| `location` | `location` | Current location (optional) |
| `about` | `about` | Why you want this internship |
| `website` | `website` | Honeypot field (must be empty) |

## Development

### Available Scripts

- `npm run dev` - Start development servers (Express + Live Server)
- `npm run dev:server` - Start Express server only
- `npm run dev:client` - Start Live Server for client files
- `npm start` - Start production server
- `npm run build` - No build step (static site)

### Form Validation

Both client-side and server-side validation are implemented:

**Client-side:**
- Real-time field validation
- Character counters
- Honeypot field protection
- Loading states and error handling

**Server-side:**
- Input sanitization
- Required field validation
- Email format validation
- Honeypot detection
- Rate limiting (10 requests per 15 minutes)

## Deployment

### Option 1: Vercel/Netlify (Static + Serverless)

1. Deploy the `client/` directory as a static site
2. Deploy the `server/` directory as a serverless function
3. Set environment variables in your hosting platform

### Option 2: Traditional Hosting

1. Upload `client/` files to your web server
2. Deploy `server/` to a Node.js hosting service (Heroku, DigitalOcean, etc.)
3. Configure environment variables
4. Set up reverse proxy to serve static files from Express

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin request handling
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Sanitizes all inputs
- **Honeypot Fields**: Spam protection
- **HTTPS**: Enforced in production

## Accessibility

- **Focus Management**: Proper focus indicators
- **ARIA Attributes**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG compliant
- **Semantic HTML**: Proper heading structure

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Private - All rights reserved

## Support

For questions or issues, email: hello@socialstudio.in
