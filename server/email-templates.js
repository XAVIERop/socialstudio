// Email Templates for Social Studio
// Professional HTML email designs for all communications

const emailTemplates = {
  // Welcome and Email Verification
  welcome: (userData) => ({
    subject: 'Welcome to Social Studio! Please Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Social Studio</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .highlight { background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Social Studio!</h1>
          </div>
          <div class="content">
            <h2>Hi ${userData.fullName},</h2>
            <p>Thank you for creating your account with Social Studio! You now have access to exclusive digital marketing resources and tools.</p>
            
            <div class="highlight">
              <h3>📋 Account Details:</h3>
              <p><strong>Name:</strong> ${userData.fullName}</p>
              <p><strong>Email:</strong> ${userData.email}</p>
              <p><strong>Phone:</strong> ${userData.phone || 'Not provided'}</p>
              <p><strong>Account Type:</strong> ${userData.userType}</p>
            </div>
            
            <p><strong>Please verify your email address by clicking the button below:</strong></p>
            <a href="${userData.verificationLink}" class="button">✅ Verify Email Address</a>
            
            <p><em>This verification link will expire in 24 hours.</em></p>
            
            <p>Once verified, you can sign in to your account and start exploring our services.</p>
            
            <h3>🚀 What's Next?</h3>
            <ul>
              <li>Verify your email address</li>
              <li>Complete your profile</li>
              <li>Explore our services</li>
              <li>Start your digital journey</li>
            </ul>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Social Studio Team</p>
            <p>Need help? Contact us at support@socialstudio.in</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Password Reset
  passwordReset: (userData) => ({
    subject: 'Reset Your Social Studio Password',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Social Studio</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${userData.fullName || 'there'},</h2>
            <p>We received a request to reset your password for your Social Studio account.</p>
            
            <div class="warning">
              <h3>⚠️ Security Notice:</h3>
              <p>If you didn't request this password reset, please ignore this email. Your account is secure.</p>
            </div>
            
            <p><strong>To reset your password, click the button below:</strong></p>
            <a href="${userData.resetLink}" class="button">🔄 Reset Password</a>
            
            <p><em>This reset link will expire in 1 hour for security reasons.</em></p>
            
            <h3>🔒 Security Tips:</h3>
            <ul>
              <li>Use a strong, unique password</li>
              <li>Never share your password</li>
              <li>Enable two-factor authentication</li>
              <li>Log out from shared devices</li>
            </ul>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Social Studio Team</p>
            <p>Need help? Contact us at support@socialstudio.in</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Prototype Request Notification
  prototypeRequest: (data) => ({
    subject: `New Prototype Request - ${data.business}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Prototype Request - Social Studio</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Prototype Request</h1>
          </div>
          <div class="content">
            <h2>Hello Social Studio Team!</h2>
            <p>A new prototype request has been submitted through the website.</p>
            
            <div class="details">
              <h3>📋 Request Details:</h3>
              <p><strong>Name:</strong> ${data.name}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Business:</strong> ${data.business}</p>
              <p><strong>Industry:</strong> ${data.industry}</p>
              <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
              <p><strong>Message:</strong> ${data.message || 'No message provided'}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <h3>🚀 Next Steps:</h3>
            <ol>
              <li>Review the request details</li>
              <li>Contact the client within 24 hours</li>
              <li>Schedule initial consultation</li>
              <li>Prepare proposal</li>
            </ol>
            
            <p><strong>Priority:</strong> High - New business opportunity</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Social Studio</p>
            <p>Contact: ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Internship Application Notification
  internshipApplication: (data) => ({
    subject: `New Internship Application - ${data.track}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Internship Application - Social Studio</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; }
          .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 New Internship Application</h1>
          </div>
          <div class="content">
            <h2>Hello Social Studio Team!</h2>
            <p>A new internship application has been submitted.</p>
            
            <div class="details">
              <h3>📋 Application Details:</h3>
              <p><strong>Name:</strong> ${data.name}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Phone:</strong> ${data.phone}</p>
              <p><strong>Track:</strong> ${data.track}</p>
              <p><strong>Portfolio/LinkedIn:</strong> ${data.portfolio_or_linkedin}</p>
              <p><strong>Why You:</strong> ${data.why_you}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <h3>🔍 Review Process:</h3>
            <ol>
              <li>Review application details</li>
              <li>Check portfolio/LinkedIn profile</li>
              <li>Schedule interview if qualified</li>
              <li>Send response within 48 hours</li>
            </ol>
            
            <p><strong>Priority:</strong> Medium - Talent acquisition</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Social Studio</p>
            <p>Contact: ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Account Verification Success
  verificationSuccess: (userData) => ({
    subject: 'Email Verified Successfully - Welcome to Social Studio!',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified - Social Studio</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Email Verified Successfully!</h1>
          </div>
          <div class="content">
            <h2>Congratulations, ${userData.fullName}!</h2>
            
            <div class="success">
              <h3>🎉 Your email has been verified!</h3>
              <p>Your Social Studio account is now fully activated and ready to use.</p>
            </div>
            
            <p>You can now access all features of your account:</p>
            <ul>
              <li>Complete your profile</li>
              <li>Access your dashboard</li>
              <li>Use our services</li>
              <li>Track your progress</li>
            </ul>
            
            <a href="https://socialstudio.in/login" class="button">🚀 Access Your Account</a>
            
            <h3>🔐 Security Reminder:</h3>
            <p>Keep your account secure by:</p>
            <ul>
              <li>Using a strong password</li>
              <li>Enabling two-factor authentication</li>
              <li>Never sharing your credentials</li>
              <li>Logging out from shared devices</li>
            </ul>
          </div>
          <div class="footer">
            <p>Welcome to the Social Studio family!</p>
            <p>Need help? Contact us at support@socialstudio.in</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Two-Factor Authentication Setup
  twoFactorSetup: (userData) => ({
    subject: 'Two-Factor Authentication Setup - Social Studio',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>2FA Setup - Social Studio</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; }
          .header { background: linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .info { background: #e2e3e5; border: 1px solid #d6d8db; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Two-Factor Authentication Setup</h1>
          </div>
          <div class="content">
            <h2>Hi ${userData.fullName},</h2>
            <p>You've requested to set up two-factor authentication for your Social Studio account.</p>
            
            <div class="info">
              <h3>📱 Setup Instructions:</h3>
              <ol>
                <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code from your dashboard</li>
                <li>Enter the 6-digit code to verify</li>
                <li>Complete the setup process</li>
              </ol>
            </div>
            
            <h3>🛡️ Why 2FA?</h3>
            <p>Two-factor authentication adds an extra layer of security to your account:</p>
            <ul>
              <li>Protects against unauthorized access</li>
              <li>Required for sensitive operations</li>
              <li>Industry standard security practice</li>
              <li>Peace of mind for your data</li>
            </ul>
            
            <p><strong>Need help?</strong> Contact our support team at support@socialstudio.in</p>
          </div>
          <div class="footer">
            <p>Security is our priority</p>
            <p>The Social Studio Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

module.exports = emailTemplates;
