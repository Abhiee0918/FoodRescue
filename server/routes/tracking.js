import express from 'express';
import { db } from '../db.js';

const router = express.Router();

export const createTrackingRouter = (io) => {
  // GET tracking details for a donation
  router.get('/:donationId', (req, res) => {
    const donation = db.getDonationById(req.params.donationId);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found.' });
    }

    const donorPos = [donation.pickupLocation.lat || 12.9141, donation.pickupLocation.lng || 74.8560];
    const ngoPos = [12.9260, 74.8420]; // default Hope Kitchen
    const volPos = donation.volunteerId?.currentLat && donation.volunteerId?.currentLng
      ? [donation.volunteerId.currentLat, donation.volunteerId.currentLng]
      : [donorPos[0] + 0.005, donorPos[1] - 0.005];

    res.json({
      tracking: {
        donationId: donation.id,
        foodName: donation.foodName,
        status: donation.status,
        isSimulated: true,
        modeLabel: 'Demo tracking (Simulated Telemetry)',
        donor: {
          name: donation.donorName,
          address: donation.pickupLocation.address,
          coordinates: donorPos
        },
        ngo: {
          name: donation.acceptedBy?.ngoName || 'Hope Community Kitchen',
          coordinates: ngoPos
        },
        volunteer: {
          name: donation.volunteerId?.name || 'Alex Rivera',
          phone: donation.volunteerId?.phone || '+1 (555) 901-2345',
          vehicle: donation.volunteerId?.vehicle || 'Eco Hatchback',
          coordinates: volPos,
          etaMinutes: donation.volunteerId?.etaMinutes || 8,
          distanceKm: donation.volunteerId?.distanceKm || 1.4,
          speedKmh: 28,
          heading: 'Northwest towards Downtown'
        },
        waypoints: [
          donorPos,
          [donorPos[0] + 0.004, donorPos[1] - 0.003],
          volPos,
          [ngoPos[0] - 0.002, ngoPos[1] + 0.004],
          ngoPos
        ]
      }
    });
  });

  // Step simulation - nudges volunteer position closer to destination
  router.post('/:donationId/step', (req, res) => {
    const donation = db.getDonationById(req.params.donationId);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found.' });
    }

    const targetPos = donation.status === 'picked_up' ? [12.9260, 74.8420] : [donation.pickupLocation.lat, donation.pickupLocation.lng];
    const currentLat = donation.volunteerId?.currentLat || targetPos[0] + 0.008;
    const currentLng = donation.volunteerId?.currentLng || targetPos[1] - 0.007;

    // Move 15% closer to target
    const nextLat = currentLat + (targetPos[0] - currentLat) * 0.2;
    const nextLng = currentLng + (targetPos[1] - currentLng) * 0.2;
    const nextDistance = Math.max(0.1, ((donation.volunteerId?.distanceKm || 1.5) * 0.8)).toFixed(1);
    const nextEta = Math.max(1, Math.round(Number(nextDistance) * 4));

    const updatedVol = {
      ...(donation.volunteerId || { id: 'usr_vol_1', name: 'Alex Rivera' }),
      currentLat: nextLat,
      currentLng: nextLng,
      distanceKm: Number(nextDistance),
      etaMinutes: nextEta
    };

    const updated = db.updateDonation(donation.id, {
      volunteerId: updatedVol
    });

    const payload = {
      donationId: donation.id,
      coordinates: [nextLat, nextLng],
      distanceKm: Number(nextDistance),
      etaMinutes: nextEta,
      status: donation.status
    };

    if (io) {
      io.emit('pickup:location_update', payload);
    }

    res.json({ message: 'Telemetry updated', payload });
  });

  return router;
};
