/**
 * FoodSafetyService - Evaluates safety risk profiles based on scientific HACCP parameters.
 * Disclaimer: AI-generated guidance is informational only.
 */
export class FoodSafetyService {
  /**
   * Evaluates the safety parameters of a food donation
   * @param {Object} input
   * @param {string} input.foodName
   * @param {string} input.category
   * @param {string} input.preparedAt
   * @param {string} input.currentTime
   * @param {string} input.storageMethod
   * @param {string} input.tempRange
   * @param {string} input.packagingType
   * @param {string} input.safeUntil
   * @returns {Object} Safety assessment result
   */
  async evaluate(input) {
    const {
      foodName = '',
      category = '',
      preparedAt,
      storageMethod = '',
      tempRange = '',
      packagingType = '',
      safeUntil
    } = input;

    // Check for insufficient information
    if (!preparedAt || !storageMethod || !category) {
      return {
        status: 'Insufficient information',
        confidence: 45,
        recommendedAction: 'Manual safety review required. Critical preparation and storage information missing.',
        requiresHumanReview: true,
        factors: [
          { name: 'Data Completeness', detail: 'Missing storage method or preparation timestamp', status: 'warning' }
        ],
        disclaimer: 'AI-generated guidance is informational only. Follow applicable food-safety regulations and local authority guidance.'
      };
    }

    const prepDate = new Date(preparedAt);
    const now = input.currentTime ? new Date(input.currentTime) : new Date();
    const safeDate = safeUntil ? new Date(safeUntil) : new Date(prepDate.getTime() + 6 * 3600 * 1000);

    const elapsedHours = Math.max(0, (now.getTime() - prepDate.getTime()) / (1000 * 3600));
    const hoursRemaining = Math.max(0, (safeDate.getTime() - now.getTime()) / (1000 * 3600));

    let riskScore = 0; // 0 = lowest risk, 100 = highest risk
    const factors = [];

    // Factor 1: Elapsed time & Category Risk
    const isPerishable = ['Prepared Meals', 'Dairy & Eggs', 'Meat & Poultry', 'Seafood'].includes(category);
    const isDryStable = ['Bakery & Bread', 'Canned Goods', 'Grains & Pasta', 'Packaged Snacks'].includes(category);

    if (isPerishable) {
      if (elapsedHours <= 2.5) {
        factors.push({ name: 'Preparation Elapsed', detail: `${elapsedHours.toFixed(1)} hrs elapsed (Freshly prepared window)`, status: 'optimal' });
      } else if (elapsedHours <= 5) {
        factors.push({ name: 'Preparation Elapsed', detail: `${elapsedHours.toFixed(1)} hrs elapsed (Acceptable with thermal hold)`, status: 'good' });
        riskScore += 15;
      } else {
        factors.push({ name: 'Preparation Elapsed', detail: `${elapsedHours.toFixed(1)} hrs elapsed (High exposure window)`, status: 'warning' });
        riskScore += 40;
      }
    } else if (isDryStable) {
      factors.push({ name: 'Preparation Elapsed', detail: 'Ambient stable category with extended shelf-life', status: 'optimal' });
    } else {
      factors.push({ name: 'Preparation Elapsed', detail: `${elapsedHours.toFixed(1)} hrs elapsed`, status: 'good' });
      riskScore += 10;
    }

    // Factor 2: Storage Method & Temperature Control
    const storageLower = (storageMethod + ' ' + tempRange).toLowerCase();
    const hasHotHold = storageLower.includes('60') || storageLower.includes('65') || storageLower.includes('hot') || storageLower.includes('heated');
    const hasColdHold = storageLower.includes('cold') || storageLower.includes('refrigerat') || storageLower.includes('chilled') || storageLower.includes('<4') || storageLower.includes('<5');
    const hasAmbient = storageLower.includes('ambient') || storageLower.includes('room');

    if (isPerishable && hasAmbient) {
      factors.push({ name: 'Storage Conditions', detail: 'Perishable item kept at ambient temperature (Danger zone 5°C - 60°C risk)', status: 'danger' });
      riskScore += 45;
    } else if (hasHotHold) {
      factors.push({ name: 'Storage Conditions', detail: 'Continuous hot-hold temperature (>60°C verified)', status: 'optimal' });
    } else if (hasColdHold) {
      factors.push({ name: 'Storage Conditions', detail: 'Maintained within cold chain (<5°C verified)', status: 'optimal' });
    } else {
      factors.push({ name: 'Storage Conditions', detail: `Storage recorded: ${storageMethod || 'Standard'}`, status: 'good' });
      riskScore += 10;
    }

    // Factor 3: Packaging Integrity
    const packLower = packagingType.toLowerCase();
    if (packLower.includes('sealed') || packLower.includes('food-grade') || packLower.includes('insulated') || packLower.includes('stainless')) {
      factors.push({ name: 'Packaging & Containment', detail: `${packagingType} (Low contamination vulnerability)`, status: 'optimal' });
    } else if (packLower.includes('open') || packLower.includes('uncovered')) {
      factors.push({ name: 'Packaging & Containment', detail: 'Unsealed or open containers detected', status: 'warning' });
      riskScore += 30;
    } else {
      factors.push({ name: 'Packaging & Containment', detail: packagingType || 'Standard containment', status: 'good' });
    }

    // Factor 4: Safe Window Remaining
    if (hoursRemaining < 1.0) {
      factors.push({ name: 'Safe Window Remaining', detail: `Under ${Math.round(hoursRemaining * 60)} minutes safe distribution window remaining`, status: 'danger' });
      riskScore += 40;
    } else if (hoursRemaining < 3.0) {
      factors.push({ name: 'Safe Window Remaining', detail: `${hoursRemaining.toFixed(1)} hrs window remaining (Urgent dispatch recommended)`, status: 'warning' });
      riskScore += 15;
    } else {
      factors.push({ name: 'Safe Window Remaining', detail: `${hoursRemaining.toFixed(1)} hrs comfortable safety margin`, status: 'optimal' });
    }

    // Determine status categories
    let status = 'Low concern';
    let recommendedAction = 'Suitable for donation if transported under recommended conditions.';
    let requiresHumanReview = false;
    let confidence = Math.min(97, Math.max(70, 98 - riskScore * 0.4));

    if (riskScore >= 45) {
      status = 'High concern';
      recommendedAction = 'Donation flagged for manual food safety inspection prior to volunteer dispatch.';
      requiresHumanReview = true;
    } else if (riskScore >= 20) {
      status = 'Review recommended';
      recommendedAction = 'Proceed with caution: verify container seal and maintain thermal packs during transit.';
      requiresHumanReview = true;
    }

    return {
      status,
      confidence: Math.round(confidence),
      recommendedAction,
      requiresHumanReview,
      factors,
      disclaimer: 'AI-generated guidance is informational only. Follow applicable food-safety regulations and local authority guidance.'
    };
  }
}

export const foodSafetyService = new FoodSafetyService();
