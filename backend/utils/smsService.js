const twilio = require('twilio');
const config = require('../config/config');

const client = twilio(config.twilioAccountSid, config.twilioAuthToken);

const sendOTP = async (phoneNumber, otp) => {
  try {
    await client.messages.create({
      body: `Your TrueMatch verification code is: ${otp}. This code will expire in 10 minutes.`,
      to: phoneNumber,
      from: config.twilioPhoneNumber
    });
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
};

module.exports = {
  sendOTP
}; 