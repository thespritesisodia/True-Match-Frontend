const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin
const serviceAccount = require('../config/firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

class AuthService {
  // Verify Firebase ID token
  static async verifyToken(idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new Error(`Error verifying token: ${error.message}`);
    }
  }

  // Create a new user in Firebase
  static async createFirebaseUser(email, password) {
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        emailVerified: false
      });
      return userRecord;
    } catch (error) {
      throw new Error(`Error creating Firebase user: ${error.message}`);
    }
  }

  // Update user profile in Firebase
  static async updateFirebaseUser(uid, data) {
    try {
      const userRecord = await admin.auth().updateUser(uid, data);
      return userRecord;
    } catch (error) {
      throw new Error(`Error updating Firebase user: ${error.message}`);
    }
  }

  // Delete user from Firebase
  static async deleteFirebaseUser(uid) {
    try {
      await admin.auth().deleteUser(uid);
    } catch (error) {
      throw new Error(`Error deleting Firebase user: ${error.message}`);
    }
  }

  // Send email verification
  static async sendEmailVerification(uid) {
    try {
      const link = await admin.auth().generateEmailVerificationLink(uid);
      // Here you would typically send this link via your email service
      return link;
    } catch (error) {
      throw new Error(`Error sending email verification: ${error.message}`);
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(email) {
    try {
      const link = await admin.auth().generatePasswordResetLink(email);
      // Here you would typically send this link via your email service
      return link;
    } catch (error) {
      throw new Error(`Error sending password reset email: ${error.message}`);
    }
  }

  // Create custom token for client-side authentication
  static async createCustomToken(uid) {
    try {
      const token = await admin.auth().createCustomToken(uid);
      return token;
    } catch (error) {
      throw new Error(`Error creating custom token: ${error.message}`);
    }
  }

  // Get user by email
  static async getUserByEmail(email) {
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      return userRecord;
    } catch (error) {
      throw new Error(`Error getting user by email: ${error.message}`);
    }
  }

  // Update user's email
  static async updateUserEmail(uid, newEmail) {
    try {
      const userRecord = await admin.auth().updateUser(uid, {
        email: newEmail,
        emailVerified: false
      });
      return userRecord;
    } catch (error) {
      throw new Error(`Error updating user email: ${error.message}`);
    }
  }

  // Set custom claims (for role-based access)
  static async setCustomClaims(uid, claims) {
    try {
      await admin.auth().setCustomUserClaims(uid, claims);
    } catch (error) {
      throw new Error(`Error setting custom claims: ${error.message}`);
    }
  }
}

module.exports = AuthService; 