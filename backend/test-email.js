require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing Gmail SMTP Configuration...\n');
  
  // Check environment variables
  console.log('Email Configuration:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' : 'Not set');
  console.log('');

  // Validate required fields
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Missing email configuration!');
    console.log('Please add these to your .env file:');
    console.log('EMAIL_USER=yourgmail@gmail.com');
    console.log('EMAIL_PASS=your_gmail_app_password');
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 465,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('1. Testing SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    console.log('');

    // Send test email
    console.log('2. Sending test email...');
    
    const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: testEmail,
      subject: '🧪 TULDOK Social - SMTP Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">🎉 SMTP Test Successful!</h2>
          <p>Hello!</p>
          <p>This is a test email from your <strong>TULDOK Social</strong> application.</p>
          <p>Your Gmail SMTP configuration is working correctly!</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Sent at: ${new Date().toLocaleString()}<br>
            From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Check your inbox:', testEmail);
    console.log('');

    console.log('🎉 Gmail SMTP is working perfectly!');
    console.log('You can now register users and send verification emails.');

  } catch (error) {
    console.error('❌ SMTP Test Failed:', error.message);
    console.log('');
    
    if (error.code === 'EAUTH') {
      console.log('🔧 Common Gmail SMTP Issues:');
      console.log('1. Make sure you\'re using an App Password (not your regular password)');
      console.log('2. Enable 2-Factor Authentication on your Google account');
      console.log('3. Generate an App Password: https://support.google.com/accounts/answer/185833');
      console.log('4. Use the App Password in your EMAIL_PASS environment variable');
    } else if (error.code === 'ECONNECTION') {
      console.log('🔧 Connection Issues:');
      console.log('1. Check your internet connection');
      console.log('2. Verify EMAIL_HOST and EMAIL_PORT are correct');
      console.log('3. Make sure EMAIL_SECURE is set to "true" for Gmail');
    }
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testEmail()
    .then(() => {
      console.log('\n✅ Email test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Email test failed:', error);
      process.exit(1);
    });
}

module.exports = testEmail; 