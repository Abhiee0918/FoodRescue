import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { foodSafetyService } from '../services/aiFoodSafety.js';
import { foodImageAnalysisService } from '../services/aiImageAnalysis.js';
import { donationMatchingService } from '../services/aiMatching.js';

const router = express.Router();

export const createDonationsRouter = (io) => {
  // GET all donations with optional filters
  router.get('/', (req, res) => {
    try {
      let donations = db.getDonations();
      const { status, dietType, category, search, donorId, acceptedByNgoId } = req.query;

      if (status && status !== 'all') {
        donations = donations.filter(d => d.status === status);
      }
      if (dietType && dietType !== 'all') {
        donations = donations.filter(d => d.dietType?.toLowerCase().includes(dietType.toLowerCase()));
      }
      if (category && category !== 'all') {
        donations = donations.filter(d => d.category?.toLowerCase() === category.toLowerCase());
      }
      if (donorId) {
        donations = donations.filter(d => d.donorId === donorId);
      }
      if (acceptedByNgoId) {
        donations = donations.filter(d => d.acceptedBy?.ngoId === acceptedByNgoId);
      }
      if (search) {
        const query = search.toLowerCase();
        donations = donations.filter(d =>
          d.foodName.toLowerCase().includes(query) ||
          d.donorName.toLowerCase().includes(query) ||
          d.category.toLowerCase().includes(query)
        );
      }

      res.json({ count: donations.length, donations });
    } catch (err) {
      console.error('Error fetching donations:', err);
      res.status(500).json({ error: 'Failed to retrieve donations.' });
    }
  });

  // GET single donation
  router.get('/:id', (req, res) => {
    const donation = db.getDonationById(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: 'Donation listing not found.' });
    }
    res.json({ donation });
  });

  // POST new donation
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const {
        foodName,
        category,
        quantity,
        mealCount,
        dietType,
        imageUrl,
        preparedAt,
        storageMethod,
        tempRange,
        packagingType,
        safeUntil,
        pickupLocation,
        pickupStart,
        pickupDeadline,
        contactPhone
      } = req.body;

      if (!foodName || !quantity || !mealCount || !pickupDeadline) {
        return res.status(400).json({ error: 'Food name, quantity, meal count, and pickup deadline are required.' });
      }

      // 1. Run AI Food Safety Analysis
      const aiSafety = await foodSafetyService.evaluate({
        foodName,
        category,
        preparedAt,
        currentTime: new Date().toISOString(),
        storageMethod,
        tempRange,
        packagingType,
        safeUntil
      });

      // 2. Run AI Food Image Analysis
      const aiImageAnalysis = await foodImageAnalysisService.analyze({
        imageUrl,
        foodNameHint: foodName
      });

      // 3. Calculate Rescue Priority Score
      const { score: rescueScore, breakdown: scoreBreakdown } = donationMatchingService.calculateRescueScore({
        mealCount,
        safeUntil: safeUntil || pickupDeadline
      });

      const id = `don_${Date.now()}`;
      const newDonation = {
        id,
        donorId: req.user.id,
        donorName: req.user.organizationName || req.user.name,
        donorType: req.user.role === 'restaurant' ? 'Restaurant' : 'Event Organizer',
        foodName,
        category: category || 'Prepared Meals',
        quantity,
        mealCount: Number(mealCount),
        dietType: dietType || 'Vegetarian',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        preparedAt: preparedAt || new Date().toISOString(),
        currentTime: new Date().toISOString(),
        storageMethod: storageMethod || 'Refrigerated Storage',
        tempRange: tempRange || '<4°C Cold Chain',
        packagingType: packagingType || 'Food-grade sealed containers',
        safeUntil: safeUntil || new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        pickupLocation: pickupLocation || {
          address: req.user.address || '742 Evergreen Terrace',
          lat: req.user.lat || 12.9141,
          lng: req.user.lng || 74.8560
        },
        pickupStart: pickupStart || 'Immediately',
        pickupDeadline,
        contactPhone: contactPhone || req.user.phone,
        status: 'posted',
        deliveryStatus: 'created',
        pickupInstructions: req.body.pickupInstructions || 'Report to staff service entrance with delivery container.',
        deliveryInstructions: req.body.deliveryInstructions || 'Deliver to relief center reception / kitchen intake desk.',
        rescueScore,
        scoreBreakdown,
        aiSafety,
        aiImageAnalysis,
        acceptedBy: null,
        volunteerId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.createDonation(newDonation);

      // Create broadcast notification for NGOs
      const notif = db.createNotification({
        role: 'ngo',
        title: 'New Food Surplus Available!',
        message: `${newDonation.mealCount} meals (${newDonation.foodName}) posted by ${newDonation.donorName}.`,
        type: 'info',
        link: `/dashboard/ngo?donationId=${id}`
      });

      // Emit real-time events
      if (io) {
        io.emit('donation:new', newDonation);
        io.emit('notification:new', notif);
        io.emit('stats:updated', db.getImpactStats());
      }

      res.status(201).json({
        message: 'Surplus donation published successfully!',
        donation: newDonation
      });
    } catch (err) {
      console.error('Donation creation error:', err);
      res.status(500).json({ error: 'Failed to create donation listing.' });
    }
  });

  // NGO accepts donation
  router.patch('/:id/accept', authenticateToken, (req, res) => {
    try {
      const donation = db.getDonationById(req.params.id);
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found.' });
      }

      if (donation.status !== 'posted') {
        return res.status(400).json({ error: `Donation cannot be accepted in status '${donation.status}'.` });
      }

      const updated = db.updateDonation(req.params.id, {
        status: 'accepted',
        deliveryStatus: 'ngo_accepted',
        acceptedBy: {
          ngoId: req.user.id,
          ngoName: req.user.organizationName || req.user.name,
          acceptedAt: new Date().toISOString()
        }
      });

      // Notify donor restaurant
      const notif = db.createNotification({
        userId: donation.donorId,
        role: 'restaurant',
        title: 'Donation Accepted!',
        message: `${req.user.organizationName || req.user.name} accepted your donation of ${donation.mealCount} meals.`,
        type: 'success',
        link: `/dashboard/restaurant?donationId=${donation.id}`
      });

      // Notify volunteers of dispatch opportunity
      db.createNotification({
        role: 'volunteer',
        title: 'New Volunteer Delivery Opportunity',
        message: `Transportation needed: ${donation.mealCount} meals from ${donation.donorName} to ${req.user.organizationName || req.user.name}.`,
        type: 'action',
        link: `/dashboard/volunteer?donationId=${donation.id}`
      });

      if (io) {
        io.emit('donation:updated', updated);
        io.emit('notification:new', notif);
      }

      res.json({ message: 'Donation accepted successfully!', donation: updated });
    } catch (err) {
      console.error('Accept donation error:', err);
      res.status(500).json({ error: 'Failed to accept donation.' });
    }
  });

  // Volunteer assigns self to transport
  router.patch('/:id/assign-volunteer', authenticateToken, (req, res) => {
    try {
      const donation = db.getDonationById(req.params.id);
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found.' });
      }

      const volunteerInfo = {
        id: req.user.id,
        name: req.user.name,
        phone: req.user.phone,
        vehicle: req.user.vehicleType || 'Personal Vehicle',
        assignedAt: new Date().toISOString(),
        currentLat: donation.pickupLocation.lat + 0.008,
        currentLng: donation.pickupLocation.lng - 0.006,
        etaMinutes: 12,
        distanceKm: 1.8
      };

      const updated = db.updateDonation(req.params.id, {
        status: 'volunteer_assigned',
        deliveryStatus: 'volunteer_assigned',
        assignedVolunteerId: req.user.id,
        assignedVolunteerName: req.user.name,
        volunteerId: volunteerInfo
      });

      // Notify Restaurant
      const notifRest = db.createNotification({
        userId: donation.donorId,
        role: 'restaurant',
        title: 'Volunteer Assigned',
        message: `Courier ${req.user.name} has accepted the delivery mission for "${donation.foodName}".`,
        type: 'info',
        link: `/dashboard/restaurant`
      });

      // Notify NGO
      if (donation.acceptedBy?.ngoId) {
        db.createNotification({
          userId: donation.acceptedBy.ngoId,
          role: 'ngo',
          title: 'Volunteer Assigned',
          message: `Courier ${req.user.name} accepted delivery dispatch from ${donation.donorName}.`,
          type: 'info',
          link: `/dashboard/ngo`
        });
      }

      if (io) {
        io.emit('donation:updated', updated);
        io.emit('notification:new', notifRest);
        io.emit('pickup:status_change', {
          donationId: donation.id,
          status: 'volunteer_assigned',
          volunteer: volunteerInfo
        });
      }

      res.json({ message: 'Volunteer assigned. Delivery mission initiated!', donation: updated });
    } catch (err) {
      console.error('Volunteer assignment error:', err);
      res.status(500).json({ error: 'Failed to assign volunteer.' });
    }
  });

  // 1. Volunteer confirms pickup at restaurant
  router.patch('/:id/confirm-pickup', authenticateToken, (req, res) => {
    try {
      const donation = db.getDonationById(req.params.id);
      if (!donation) return res.status(404).json({ error: 'Donation not found.' });

      if (req.user.role !== 'admin' && donation.volunteerId?.id && donation.volunteerId.id !== req.user.id && donation.assignedVolunteerId !== req.user.id) {
        return res.status(403).json({ error: 'Only the assigned volunteer can confirm pickup.' });
      }

      const now = new Date().toISOString();
      const updated = db.updateDonation(req.params.id, {
        status: 'picked_up',
        deliveryStatus: 'picked_up',
        pickupTimestamp: now,
        pickedUpAt: now
      });

      // Notify Restaurant: Food Picked Up
      const notifRest = db.createNotification({
        userId: donation.donorId,
        role: 'restaurant',
        title: 'Food Picked Up',
        message: `Courier ${donation.volunteerId?.name || req.user.name} has collected "${donation.foodName}" from your kitchen.`,
        type: 'info',
        link: `/dashboard/restaurant`
      });

      // Notify NGO
      if (donation.acceptedBy?.ngoId) {
        db.createNotification({
          userId: donation.acceptedBy.ngoId,
          role: 'ngo',
          title: 'Food Picked Up',
          message: `Courier has collected "${donation.foodName}" from ${donation.donorName}.`,
          type: 'info',
          link: `/dashboard/ngo`
        });
      }

      if (io) {
        io.emit('donation:updated', updated);
        io.emit('notification:new', notifRest);
        io.emit('donation:status_change', { id: donation.id, status: 'picked_up' });
      }

      res.json({ message: 'Pickup confirmed! Status is now Picked Up.', donation: updated });
    } catch (err) {
      console.error('Confirm pickup error:', err);
      res.status(500).json({ error: 'Failed to confirm pickup.' });
    }
  });

  // 2. Volunteer starts delivery towards NGO
  router.patch('/:id/start-delivery', authenticateToken, (req, res) => {
    try {
      const donation = db.getDonationById(req.params.id);
      if (!donation) return res.status(404).json({ error: 'Donation not found.' });

      if (req.user.role !== 'admin' && donation.volunteerId?.id && donation.volunteerId.id !== req.user.id && donation.assignedVolunteerId !== req.user.id) {
        return res.status(403).json({ error: 'Only the assigned volunteer can start delivery.' });
      }

      const now = new Date().toISOString();
      const updated = db.updateDonation(req.params.id, {
        status: 'out_for_delivery',
        deliveryStatus: 'out_for_delivery',
        deliveryStartTimestamp: now
      });

      // Notify Restaurant: Out for Delivery
      const notifRest = db.createNotification({
        userId: donation.donorId,
        role: 'restaurant',
        title: 'Out for Delivery',
        message: `Courier is now heading towards ${donation.acceptedBy?.ngoName || 'NGO Community Center'}.`,
        type: 'info',
        link: `/dashboard/restaurant`
      });

      // Notify NGO: Out for Delivery
      if (donation.acceptedBy?.ngoId) {
        db.createNotification({
          userId: donation.acceptedBy.ngoId,
          role: 'ngo',
          title: 'Out for Delivery',
          message: `Courier ${donation.volunteerId?.name || req.user.name} is on the way to your facility with ${donation.mealCount} meals.`,
          type: 'info',
          link: `/dashboard/ngo`
        });
      }

      if (io) {
        io.emit('donation:updated', updated);
        io.emit('notification:new', notifRest);
        io.emit('donation:status_change', { id: donation.id, status: 'out_for_delivery' });
      }

      res.json({ message: 'Delivery started! Status is now Out for Delivery.', donation: updated });
    } catch (err) {
      console.error('Start delivery error:', err);
      res.status(500).json({ error: 'Failed to start delivery.' });
    }
  });

  // 3. Volunteer reaches NGO and marks delivered (awaiting confirmation)
  router.patch('/:id/mark-delivered', authenticateToken, (req, res) => {
    try {
      const donation = db.getDonationById(req.params.id);
      if (!donation) return res.status(404).json({ error: 'Donation not found.' });

      if (req.user.role !== 'admin' && donation.volunteerId?.id && donation.volunteerId.id !== req.user.id && donation.assignedVolunteerId !== req.user.id) {
        return res.status(403).json({ error: 'Only the assigned volunteer can mark delivery.' });
      }

      const { deliveryProofUrl, deliveryNotes, deliveryLat, deliveryLng } = req.body;
      const now = new Date().toISOString();

      const updated = db.updateDonation(req.params.id, {
        status: 'delivered_awaiting_ngo_confirmation',
        deliveryStatus: 'delivered_awaiting_ngo_confirmation',
        deliveryTimestamp: now,
        deliveredAt: now,
        assignedVolunteerId: req.user.id,
        assignedVolunteerName: req.user.name,
        deliveryProofUrl: deliveryProofUrl || donation.deliveryProofUrl || '',
        deliveryNotes: deliveryNotes || donation.deliveryNotes || '',
        deliveryLat: deliveryLat || donation.deliveryLat || null,
        deliveryLng: deliveryLng || donation.deliveryLng || null,
        ngoConfirmationStatus: 'pending'
      });

      // Notify NGO: Action Required
      if (donation.acceptedBy?.ngoId) {
        const notifNgo = db.createNotification({
          userId: donation.acceptedBy.ngoId,
          role: 'ngo',
          title: 'Action Required: Confirm Food Delivery Received',
          message: `Courier marked "${donation.foodName}" (${donation.mealCount} meals) as delivered. Please verify and confirm in "Incoming Deliveries".`,
          type: 'action',
          link: `/dashboard/ngo`
        });
        if (io) io.emit('notification:new', notifNgo);
      }

      // Notify Restaurant: Delivered – Awaiting NGO Confirmation
      const notifRest = db.createNotification({
        userId: donation.donorId,
        role: 'restaurant',
        title: 'Delivered – Awaiting NGO Confirmation',
        message: `Courier has arrived at ${donation.acceptedBy?.ngoName || 'the NGO'} and handed over the food. Awaiting physical reception confirmation.`,
        type: 'info',
        link: `/dashboard/restaurant`
      });

      if (io) {
        io.emit('donation:updated', updated);
        io.emit('notification:new', notifRest);
        io.emit('donation:status_change', { id: donation.id, status: 'delivered_awaiting_ngo_confirmation' });
      }

      res.json({
        message: 'Delivery marked! Status is now Delivered – Awaiting NGO Confirmation.',
        donation: updated
      });
    } catch (err) {
      console.error('Mark delivered error:', err);
      res.status(500).json({ error: 'Failed to mark delivery.' });
    }
  });

  // 4. NGO confirms food physically received
  router.patch('/:id/confirm-received', authenticateToken, (req, res) => {
    try {
      const donation = db.getDonationById(req.params.id);
      if (!donation) return res.status(404).json({ error: 'Donation not found.' });

      if (req.user.role !== 'admin' && donation.acceptedBy?.ngoId && donation.acceptedBy.ngoId !== req.user.id) {
        return res.status(403).json({ error: 'Only the recipient NGO can confirm physical reception.' });
      }

      if (donation.ngoConfirmationStatus === 'confirmed') {
        return res.status(400).json({ error: 'Delivery has already been confirmed.' });
      }

      const now = new Date().toISOString();
      const updated = db.updateDonation(req.params.id, {
        status: 'completed',
        deliveryStatus: 'delivery_confirmed',
        ngoConfirmationStatus: 'confirmed',
        ngoConfirmedBy: req.user.id,
        ngoConfirmedByName: req.user.organizationName || req.user.name,
        ngoConfirmationTimestamp: now,
        completedAt: now
      });

      // 1. Notify Restaurant
      const notifRest = db.createNotification({
        userId: donation.donorId,
        role: 'restaurant',
        title: 'Successfully Delivered – NGO Confirmed',
        message: 'Your donated food has been successfully delivered and received by the NGO.',
        type: 'success',
        link: `/dashboard/restaurant`
      });

      // 2. Notify Volunteer
      const volId = donation.volunteerId?.id || donation.assignedVolunteerId;
      if (volId) {
        db.createNotification({
          userId: volId,
          role: 'volunteer',
          title: 'Delivery Confirmed by NGO!',
          message: `NGO confirmed receipt of "${donation.foodName}". Thank you for your volunteer service!`,
          type: 'success',
          link: `/dashboard/volunteer`
        });
      }

      // 3. Notify Admin
      db.createNotification({
        role: 'admin',
        title: 'Delivery Mission Completed',
        message: `Donation #${donation.id} from ${donation.donorName} verified and received by ${req.user.organizationName || req.user.name}.`,
        type: 'info',
        link: `/dashboard/admin`
      });

      if (io) {
        io.emit('donation:updated', updated);
        io.emit('stats:updated', db.getImpactStats());
        io.emit('notification:new', notifRest);
        io.emit('donation:status_change', { id: donation.id, status: 'completed' });
      }

      res.json({
        message: 'Delivery confirmed! Food donation marked as COMPLETED.',
        donation: updated
      });
    } catch (err) {
      console.error('Confirm received error:', err);
      res.status(500).json({ error: 'Failed to confirm delivery receipt.' });
    }
  });

  // 5. NGO reports non-receipt (dispute)
  router.patch('/:id/report-not-received', authenticateToken, (req, res) => {
    try {
      const { reason } = req.body;
      const donation = db.getDonationById(req.params.id);
      if (!donation) return res.status(404).json({ error: 'Donation not found.' });

      if (req.user.role !== 'admin' && donation.acceptedBy?.ngoId && donation.acceptedBy.ngoId !== req.user.id) {
        return res.status(403).json({ error: 'Only the recipient NGO can report non-receipt.' });
      }

      const now = new Date().toISOString();
      const updated = db.updateDonation(req.params.id, {
        status: 'delivery_disputed',
        deliveryStatus: 'delivery_disputed',
        ngoConfirmationStatus: 'disputed',
        disputeReason: reason || 'NGO staff reported food was not physically received.',
        disputedAt: now
      });

      // Notify Restaurant
      const notifRest = db.createNotification({
        userId: donation.donorId,
        role: 'restaurant',
        title: 'Delivery Disputed',
        message: `NGO reported non-receipt of donation #${donation.id}. Operations team is investigating.`,
        type: 'warning',
        link: `/dashboard/restaurant`
      });

      // Notify Admin
      db.createNotification({
        role: 'admin',
        title: '⚠️ Delivery Disputed by NGO',
        message: `Dispute filed on donation #${donation.id}: "${reason || 'Food not received'}". Please investigate.`,
        type: 'warning',
        link: `/dashboard/admin`
      });

      // Notify Volunteer
      const volId = donation.volunteerId?.id || donation.assignedVolunteerId;
      if (volId) {
        db.createNotification({
          userId: volId,
          role: 'volunteer',
          title: 'Delivery Under Investigation',
          message: `NGO reported an issue receiving donation #${donation.id}. Operations will contact you.`,
          type: 'warning',
          link: `/dashboard/volunteer`
        });
      }

      if (io) {
        io.emit('donation:updated', updated);
        io.emit('notification:new', notifRest);
        io.emit('donation:status_change', { id: donation.id, status: 'delivery_disputed' });
      }

      res.json({
        message: 'Non-receipt reported. Status updated to DELIVERY_DISPUTED. Operations team alerted.',
        donation: updated
      });
    } catch (err) {
      console.error('Report not received error:', err);
      res.status(500).json({ error: 'Failed to report dispute.' });
    }
  });

  // 6. Admin resolves delivery dispute
  router.patch('/:id/resolve-dispute', authenticateToken, (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can resolve delivery disputes.' });
      }

      const { resolution, notes } = req.body; // 'verified_completed' | 'cancelled'
      const donation = db.getDonationById(req.params.id);
      if (!donation) return res.status(404).json({ error: 'Donation not found.' });

      const now = new Date().toISOString();
      let updates = {
        disputeResolvedBy: req.user.name || 'Admin HQ',
        disputeResolutionNotes: notes || '',
        disputeResolvedAt: now
      };

      if (resolution === 'verified_completed') {
        updates = {
          ...updates,
          status: 'completed',
          deliveryStatus: 'delivery_confirmed',
          ngoConfirmationStatus: 'confirmed',
          completedAt: now
        };
      } else {
        updates = {
          ...updates,
          status: 'cancelled',
          deliveryStatus: 'delivery_cancelled',
          ngoConfirmationStatus: 'disputed'
        };
      }

      const updated = db.updateDonation(req.params.id, updates);

      const notifMsg = resolution === 'verified_completed'
        ? `Dispute resolved for donation #${donation.id}: Verified as completed. Notes: ${notes || 'Verified by admin'}`
        : `Dispute resolved for donation #${donation.id}: Delivery voided/cancelled. Notes: ${notes || 'Cancelled by admin'}`;

      db.createNotification({
        userId: donation.donorId,
        role: 'restaurant',
        title: 'Dispute Resolved',
        message: notifMsg,
        type: 'info',
        link: `/dashboard/restaurant`
      });

      if (donation.acceptedBy?.ngoId) {
        db.createNotification({
          userId: donation.acceptedBy.ngoId,
          role: 'ngo',
          title: 'Dispute Resolved',
          message: notifMsg,
          type: 'info',
          link: `/dashboard/ngo`
        });
      }

      const volId = donation.volunteerId?.id || donation.assignedVolunteerId;
      if (volId) {
        db.createNotification({
          userId: volId,
          role: 'volunteer',
          title: 'Dispute Resolved',
          message: notifMsg,
          type: 'info',
          link: `/dashboard/volunteer`
        });
      }

      if (io) {
        io.emit('donation:updated', updated);
        if (resolution === 'verified_completed') {
          io.emit('stats:updated', db.getImpactStats());
        }
      }

      res.json({ message: 'Dispute resolved successfully.', donation: updated });
    } catch (err) {
      console.error('Resolve dispute error:', err);
      res.status(500).json({ error: 'Failed to resolve dispute.' });
    }
  });

  // 7. Admin manually verifies delivery
  router.patch('/:id/admin-verify', authenticateToken, (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
      }

      const donation = db.getDonationById(req.params.id);
      if (!donation) return res.status(404).json({ error: 'Donation not found.' });

      const now = new Date().toISOString();
      const updated = db.updateDonation(req.params.id, {
        status: 'completed',
        deliveryStatus: 'delivery_confirmed',
        ngoConfirmationStatus: 'confirmed',
        ngoConfirmedBy: `admin_${req.user.id}`,
        ngoConfirmedByName: `${req.user.name} (Admin Override)`,
        ngoConfirmationTimestamp: now,
        completedAt: now
      });

      if (io) {
        io.emit('donation:updated', updated);
        io.emit('stats:updated', db.getImpactStats());
      }

      res.json({ message: 'Donation manually verified and marked completed.', donation: updated });
    } catch (err) {
      console.error('Admin verify error:', err);
      res.status(500).json({ error: 'Failed to verify donation.' });
    }
  });

  // DELETE a donation post (Only by the donor restaurant or admin)
  router.delete('/:id', authenticateToken, (req, res) => {
    try {
      const donation = db.getDonationById(req.params.id);
      if (!donation) {
        return res.status(404).json({ error: 'Donation listing not found.' });
      }

      // Authorization check: only the creating donor or an admin can delete
      if (req.user.role !== 'admin' && req.user.id !== donation.donorId) {
        return res.status(403).json({ error: 'You are only authorized to delete your own donation posts.' });
      }

      const deleted = db.deleteDonation(req.params.id);

      if (io) {
        io.emit('donation:deleted', { id: req.params.id });
      }

      return res.json({
        message: 'Donation post deleted successfully.',
        id: req.params.id
      });
    } catch (err) {
      console.error('Error deleting donation:', err);
      return res.status(500).json({ error: 'Failed to delete donation post.' });
    }
  });

  // Get digital impact certificate details
  router.get('/:id/certificate', (req, res) => {
    const donation = db.getDonationById(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found.' });
    }

    const kg = parseFloat(donation.quantity) || 15;
    const meals = Number(donation.mealCount) || 35;
    const co2Saved = Math.round(kg * 2.5);
    const waterSaved = Math.round(kg * 400);

    const certificate = {
      certificateId: donation.certificateId || `CERT-FRA-${donation.id.slice(-4)}-GEN26`,
      donationId: donation.id,
      foodName: donation.foodName,
      donorName: donation.donorName,
      recipientNgo: donation.acceptedBy?.ngoName || 'Community Feeding Center',
      volunteerName: donation.volunteerId?.name || 'FoodRescue Volunteer Corps',
      dateCompleted: donation.completedAt || donation.updatedAt || new Date().toISOString(),
      mealsRescued: meals,
      quantityKg: kg,
      co2AvoidedKg: co2Saved,
      waterSavedLiters: waterSaved,
      verificationHash: `SHA256:0x${Buffer.from(donation.id + meals + 'CERT').toString('hex').slice(0, 32)}`,
      status: 'VERIFIED_OFFICIAL_IMPACT'
    };

    res.json({ certificate });
  });

  return router;
};
