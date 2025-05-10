require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5001,
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASSWORD,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  // We'll add Firebase and Stripe configs later
  firebase: {
    // Placeholder for Firebase config
    projectId: 'truematch-dev',
    privateKey: 'placeholder',
    clientEmail: 'placeholder'
  },
  stripe: {
    // Placeholder for Stripe config
    secretKey: 'placeholder',
    webhookSecret: 'placeholder'
  }
}; 