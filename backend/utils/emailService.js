const nodemailer = require('nodemailer');
const config = require('../config/config');

console.log('Email configuration:', {
  user: config.emailUser,
  pass: config.emailPassword ? 'Password is set' : 'Password is not set'
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.emailUser,
    pass: config.emailPassword
  }
});

const sendVerificationEmail = async (email, otp) => {
  try {
    console.log('Attempting to send email to:', email);
    console.log('OTP:', otp);

    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: 'Your TrueMatch Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to TrueMatch!</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    return true;
  } catch (error) {
    console.error('Detailed error sending verification email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
    return false;
  }
};

// Verify the transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP configuration error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

module.exports = {
  sendVerificationEmail
}; 