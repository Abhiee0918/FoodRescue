import express from 'express';
import { db } from '../db.js';
import { foodSafetyService } from '../services/aiFoodSafety.js';
import { foodImageAnalysisService } from '../services/aiImageAnalysis.js';
import { donationMatchingService } from '../services/aiMatching.js';
import { demandPredictionService } from '../services/aiDemandPrediction.js';

const router = express.Router();

// Safety analysis
router.post('/safety-analysis', async (req, res) => {
  try {
    const result = await foodSafetyService.evaluate(req.body);
    res.json(result);
  } catch (err) {
    console.error('Safety evaluation error:', err);
    res.status(500).json({ error: 'Failed to run food safety analysis.' });
  }
});

// Image analysis
router.post('/image-analysis', async (req, res) => {
  try {
    const result = await foodImageAnalysisService.analyze(req.body);
    res.json(result);
  } catch (err) {
    console.error('Image analysis error:', err);
    res.status(500).json({ error: 'Failed to run image analysis.' });
  }
});

// Smart Matching NGOs for a donation
router.post('/match', async (req, res) => {
  try {
    const donation = req.body.donation || {};
    const ngos = db.getUsers().filter(u => u.role === 'ngo');
    const matched = donationMatchingService.matchDonationToNGOs(donation, ngos);
    res.json({ matches: matched });
  } catch (err) {
    console.error('Matching engine error:', err);
    res.status(500).json({ error: 'Failed to run matching engine.' });
  }
});

// Demand predictions
router.get('/demand-predictions', async (req, res) => {
  try {
    const forecasts = await demandPredictionService.getForecasts();
    res.json({ forecasts });
  } catch (err) {
    console.error('Demand forecast error:', err);
    res.status(500).json({ error: 'Failed to retrieve demand forecasts.' });
  }
});

// Live Intelligence Insights
router.get('/insights', async (req, res) => {
  try {
    const activeDonations = db.getDonations();
    const insights = await demandPredictionService.getLiveInsights(activeDonations);
    res.json({ insights });
  } catch (err) {
    console.error('Live insights error:', err);
    res.status(500).json({ error: 'Failed to retrieve intelligence insights.' });
  }
});

export default router;
