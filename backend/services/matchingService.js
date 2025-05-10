const User = require('../models/User');
const Match = require('../models/Match');

class MatchingService {
  // Calculate compatibility score between two users
  static calculateCompatibilityScore(user1, user2) {
    let score = 0;
    const weights = {
      interests: 0.4,
      location: 0.2,
      age: 0.2,
      preferences: 0.2
    };

    // Calculate interest compatibility
    const commonInterests = user1.interests.filter(interest => 
      user2.interests.includes(interest)
    );
    const interestScore = (commonInterests.length / Math.max(user1.interests.length, user2.interests.length)) * 100;
    score += interestScore * weights.interests;

    // Calculate location compatibility
    const distance = this.calculateDistance(
      user1.location.coordinates,
      user2.location.coordinates
    );
    const maxDistance = Math.max(user1.preferences.distance, user2.preferences.distance);
    const locationScore = Math.max(0, 100 - (distance / maxDistance) * 100);
    score += locationScore * weights.location;

    // Calculate age compatibility
    const age1 = this.calculateAge(user1.dateOfBirth);
    const age2 = this.calculateAge(user2.dateOfBirth);
    const ageScore = this.calculateAgeCompatibility(age1, age2, user1.preferences.ageRange, user2.preferences.ageRange);
    score += ageScore * weights.age;

    // Calculate preference compatibility
    const preferenceScore = this.calculatePreferenceCompatibility(user1, user2);
    score += preferenceScore * weights.preferences;

    return Math.round(score);
  }

  // Calculate distance between two points using Haversine formula
  static calculateDistance(coords1, coords2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coords2[0] - coords1[0]);
    const dLon = this.toRad(coords2[1] - coords1[1]);
    const lat1 = this.toRad(coords1[0]);
    const lat2 = this.toRad(coords2[0]);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static toRad(value) {
    return value * Math.PI / 180;
  }

  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  static calculateAgeCompatibility(age1, age2, range1, range2) {
    const inRange1 = age2 >= range1.min && age2 <= range1.max;
    const inRange2 = age1 >= range2.min && age1 <= range2.max;
    return (inRange1 && inRange2) ? 100 : 0;
  }

  static calculatePreferenceCompatibility(user1, user2) {
    let score = 0;
    
    // Check gender preferences
    if (user1.lookingFor === user2.gender || user1.lookingFor === 'both') {
      score += 50;
    }
    if (user2.lookingFor === user1.gender || user2.lookingFor === 'both') {
      score += 50;
    }

    return score;
  }

  // Find potential matches for a user
  static async findPotentialMatches(userId, limit = 20) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Find users within preferred distance
    const potentialMatches = await User.find({
      _id: { $ne: userId },
      'location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: user.location.coordinates
          },
          $maxDistance: user.preferences.distance * 1000 // Convert km to meters
        }
      }
    }).limit(limit);

    // Calculate compatibility scores and sort
    const matchesWithScores = potentialMatches.map(match => ({
      user: match,
      score: this.calculateCompatibilityScore(user, match)
    }));

    return matchesWithScores.sort((a, b) => b.score - a.score);
  }

  // Create a new match between two users
  static async createMatch(userId1, userId2) {
    const user1 = await User.findById(userId1);
    const user2 = await User.findById(userId2);

    if (!user1 || !user2) {
      throw new Error('One or both users not found');
    }

    const compatibilityScore = this.calculateCompatibilityScore(user1, user2);

    const match = new Match({
      users: [userId1, userId2],
      compatibilityScore,
      matchFactors: {
        interests: this.calculateInterestCompatibility(user1, user2),
        location: this.calculateLocationCompatibility(user1, user2),
        age: this.calculateAgeCompatibility(
          this.calculateAge(user1.dateOfBirth),
          this.calculateAge(user2.dateOfBirth),
          user1.preferences.ageRange,
          user2.preferences.ageRange
        ),
        preferences: this.calculatePreferenceCompatibility(user1, user2)
      }
    });

    await match.save();
    return match;
  }
}

module.exports = MatchingService; 