import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.get('/stats', (req, res) => {
  const stats = db.getImpactStats();
  res.json({
    stats,
    disclaimer: 'Environmental savings are calculated using standard FAO and EPA conversion benchmarks (~2.5 kg CO2e per kg edible food saved, ~400 L water footprint per kg). Actual figures depend on regional supply chain parameters.'
  });
});

router.get('/heatmap', (req, res) => {
  const zones = db.getHeatmapZones();
  res.json({ zones });
});

export default router;
