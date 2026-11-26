/**
 * DonationMatchingService - Algorithmic compatibility engine matching donations to NGOs.
 * Important: Match percentage is an algorithmic compatibility indicator, not a moral judgment.
 */
export class DonationMatchingService {
  /**
   * Calculates Haversine distance in kilometers between two geo-coordinates
   */
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 2.5; // default fallback
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  }

  /**
   * Calculate Rescue Score (0-100)
   * Factors: Safe window remaining, quantity/meal size, NGO proximity, volunteer availability
   */
  calculateRescueScore(donation, nearestNgoDistance = 2.0) {
    let score = 50;

    // Time window urgency
    const now = new Date();
    const safeUntil = donation.safeUntil ? new Date(donation.safeUntil) : new Date(now.getTime() + 6 * 3600 * 1000);
    const hoursLeft = Math.max(0, (safeUntil.getTime() - now.getTime()) / (1000 * 3600));

    if (hoursLeft < 3) score += 25;
    else if (hoursLeft < 6) score += 18;
    else score += 10;

    // Meal volume impact
    const mealCount = Number(donation.mealCount) || 20;
    if (mealCount >= 50) score += 15;
    else if (mealCount >= 20) score += 10;
    else score += 5;

    // Proximity
    if (nearestNgoDistance <= 2.0) score += 15;
    else if (nearestNgoDistance <= 5.0) score += 8;

    score = Math.min(99, Math.max(40, score));

    const breakdown = `${hoursLeft.toFixed(1)}h safe window remaining + ${mealCount} meals volume + ${nearestNgoDistance}km nearest NGO radius.`;
    return { score, breakdown };
  }

  /**
   * Matches a donation against a list of NGOs and ranks compatibility
   * @param {Object} donation
   * @param {Array} ngos
   * @returns {Array} Ranked list of matched NGOs
   */
  matchDonationToNGOs(donation, ngos) {
    const donorLat = donation.pickupLocation?.lat || 12.9141;
    const donorLng = donation.pickupLocation?.lng || 74.8560;
    const donationMeals = Number(donation.mealCount) || 30;
    const dietType = donation.dietType || 'Vegetarian';

    const ranked = ngos.map(ngo => {
      const ngoLat = ngo.lat || 12.9260;
      const ngoLng = ngo.lng || 74.8420;
      const distance = this.calculateDistanceKm(donorLat, donorLng, ngoLat, ngoLng);

      let compatibility = 70; // baseline

      // Distance score (max 20 pts)
      if (distance <= 2.0) compatibility += 18;
      else if (distance <= 5.0) compatibility += 12;
      else if (distance <= 10.0) compatibility += 4;
      else compatibility -= 10;

      // Capacity match (max 10 pts)
      const capacity = ngo.capacity || 100;
      if (capacity >= donationMeals) compatibility += 8;
      else compatibility -= 5;

      // Current Need urgency (max 10 pts)
      if (ngo.currentNeed === 'High') compatibility += 9;
      else if (ngo.currentNeed === 'Medium') compatibility += 5;

      // Diet preference alignment (max 5 pts)
      if (ngo.dietPreferences && (ngo.dietPreferences.includes(dietType) || ngo.dietPreferences.includes('All Foods'))) {
        compatibility += 5;
      }

      compatibility = Math.min(98, Math.max(55, compatibility));

      return {
        ngoId: ngo.id,
        ngoName: ngo.organizationName || ngo.name,
        distanceKm: distance,
        capacity: capacity,
        currentNeed: ngo.currentNeed || 'High',
        pickupAvailability: 'Available now',
        address: ngo.address,
        phone: ngo.phone,
        matchPercentage: compatibility,
        explanation: 'Algorithmic compatibility calculated from proximity, facility capacity, and real-time community need.'
      };
    });

    return ranked.sort((a, b) => b.matchPercentage - a.matchPercentage);
  }
}

export const donationMatchingService = new DonationMatchingService();
