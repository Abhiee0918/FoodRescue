import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

const hashPassword = (password) => bcrypt.hashSync(password, 10);

const INITIAL_DATA = {
  users: [
    {
      id: 'usr_rest_1',
      name: 'Chef Marcus Sterling',
      email: 'restaurant@demo.com',
      password: hashPassword('demo123'),
      role: 'restaurant',
      organizationName: 'Green Leaf Bistro & Catering',
      phone: '+1 (555) 234-5678',
      address: '742 Evergreen Terrace, Downtown District',
      lat: 12.9141,
      lng: 74.8560,
      verified: true,
      bio: 'Farm-to-table organic kitchen serving community-focused seasonal menus.',
      createdAt: '2026-08-15T09:00:00.000Z'
    },
    {
      id: 'usr_ngo_1',
      name: 'Sarah Jenkins',
      email: 'ngo@demo.com',
      password: hashPassword('demo123'),
      role: 'ngo',
      organizationName: 'Hope Community Kitchen',
      phone: '+1 (555) 876-5432',
      address: '120 Harbour View Avenue, Riverside',
      lat: 12.9260,
      lng: 74.8420,
      verified: true,
      serviceArea: 'Downtown, Riverside & North Bay (15 km radius)',
      capacity: 250,
      currentNeed: 'High',
      dietPreferences: ['Vegetarian', 'Vegan', 'Prepared Meals', 'Packaged Goods'],
      bio: 'Daily hot meal distribution serving over 400 families and shelter residents.',
      createdAt: '2026-07-10T11:00:00.000Z'
    },
    {
      id: 'usr_ngo_2',
      name: 'David Chen',
      email: 'care@demo.com',
      password: hashPassword('demo123'),
      role: 'ngo',
      organizationName: 'Community Care Foundation',
      phone: '+1 (555) 345-6789',
      address: '450 University Road, East Suburb',
      lat: 12.8980,
      lng: 74.8680,
      verified: true,
      serviceArea: 'East Sector & University District',
      capacity: 180,
      currentNeed: 'Medium',
      dietPreferences: ['All Foods', 'Vegetarian', 'Baked Goods'],
      bio: 'Non-profit food bank supporting low-income seniors and student initiatives.',
      createdAt: '2026-08-01T14:30:00.000Z'
    },
    {
      id: 'usr_ngo_3',
      name: 'Elena Rostova',
      email: 'shelter@demo.com',
      password: hashPassword('demo123'),
      role: 'ngo',
      organizationName: 'St. Jude Food Pantry & Shelter',
      phone: '+1 (555) 456-7890',
      address: '88 Lighthouse Street, Portside',
      lat: 12.9380,
      lng: 74.8320,
      verified: true,
      serviceArea: 'Portside & Coastal Zone',
      capacity: 120,
      currentNeed: 'High',
      dietPreferences: ['All Foods', 'Prepared Meals'],
      bio: 'Evening emergency food relief and transitional housing shelter.',
      createdAt: '2026-08-20T10:00:00.000Z'
    },
    {
      id: 'usr_vol_1',
      name: 'Alex Rivera',
      email: 'volunteer@demo.com',
      password: hashPassword('demo123'),
      role: 'volunteer',
      organizationName: 'FoodRescue Rapid Response',
      phone: '+1 (555) 901-2345',
      address: '32 Pinecrest Way, Central',
      lat: 12.9180,
      lng: 74.8510,
      vehicleType: 'Eco Hatchback (Refrigerated Cooler equipped)',
      availability: 'Available Now',
      verified: true,
      completedTrips: 34,
      totalDistanceKm: 184.5,
      mealsTransported: 1420,
      bio: 'Volunteer driver passionate about zero-waste logistics and community care.',
      createdAt: '2026-08-12T08:00:00.000Z'
    },
    {
      id: 'usr_vol_2',
      name: 'Priya Sharma',
      email: 'volunteer2@demo.com',
      password: hashPassword('demo123'),
      role: 'volunteer',
      organizationName: 'Green Wheels Courier',
      phone: '+1 (555) 678-1234',
      address: '77 Market Boulevard, Midtown',
      lat: 12.9090,
      lng: 74.8600,
      vehicleType: 'Electric Cargo Bike',
      availability: 'Evenings (6 PM - 10 PM)',
      verified: true,
      completedTrips: 21,
      totalDistanceKm: 98.2,
      mealsTransported: 760,
      bio: 'Urban delivery specialist eager to reduce carbon footprint while feeding families.',
      createdAt: '2026-09-01T15:00:00.000Z'
    },
    {
      id: 'usr_admin_1',
      name: 'FoodRescue Operations',
      email: 'admin@demo.com',
      password: hashPassword('demo123'),
      role: 'admin',
      organizationName: 'FoodRescue Operations',
      phone: '+1 (555) 100-2000',
      address: 'Platform Control Center',
      verified: true,
      bio: 'Operations team with oversight across compliance, safety, and dispatch.',
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ],
  donations: [
    {
      id: 'don_101',
      donorId: 'usr_rest_1',
      donorName: 'Green Leaf Bistro & Catering',
      donorType: 'Restaurant',
      foodName: 'Artisan Vegetable Biryani & Dal Makhani',
      category: 'Prepared Meals',
      quantity: '22 kg',
      mealCount: 50,
      dietType: 'Vegetarian',
      imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
      preparedAt: '2026-10-10T12:30:00.000Z',
      currentTime: '2026-10-10T14:00:00.000Z',
      storageMethod: 'Heated Insulated Containers (>65°C)',
      tempRange: '68°C Hot Hold',
      packagingType: 'Food-grade stainless trays with sealed lids',
      safeUntil: '2026-10-10T20:30:00.000Z',
      pickupLocation: {
        address: '742 Evergreen Terrace, Downtown Kitchen Entrance',
        lat: 12.9141,
        lng: 74.8560
      },
      pickupStart: '18:00',
      pickupDeadline: '20:30',
      contactPhone: '+1 (555) 234-5678',
      status: 'posted',
      rescueScore: 94,
      scoreBreakdown: 'Critical safe window (6h) + High NGO need nearby + Premium packaging.',
      aiSafety: {
        status: 'Low concern',
        confidence: 94,
        recommendedAction: 'Suitable for immediate donation if transported in insulated thermal boxes.',
        factors: [
          { name: 'Preparation Elapsed', detail: '1.5 hrs ago (Optimal fresh window)', status: 'optimal' },
          { name: 'Storage Conditions', detail: 'Temperature maintained >65°C hot hold', status: 'optimal' },
          { name: 'Food Category', detail: 'Cooked grain & legume (Properly covered)', status: 'good' },
          { name: 'Safe Time Remaining', detail: '6 hrs 30 mins before target shelf limit', status: 'optimal' }
        ],
        disclaimer: 'AI-generated guidance is informational only. Follow applicable food-safety regulations and local authority guidance.'
      },
      aiImageAnalysis: {
        detected: 'Steamed Basmati Rice & Vegetable Curry',
        category: 'Prepared Meal',
        confidence: 96,
        checks: {
          foodDetected: true,
          packagingDetected: true,
          contaminationIndicators: false,
          visibleSpoilageIndicators: false
        },
        notes: 'Clean commercial preparation detected with stainless containment.'
      },
      acceptedBy: null,
      volunteerId: null,
      qrPickupCode: 'FRA-DON-101-PKUP',
      qrDeliveryCode: 'FRA-DON-101-DLVR',
      createdAt: '2026-10-10T14:10:00.000Z',
      updatedAt: '2026-10-10T14:10:00.000Z'
    },
    {
      id: 'don_102',
      donorId: 'usr_rest_1',
      donorName: 'Grand Hyatt Banquet Hall',
      donorType: 'Event Organizer',
      foodName: 'Assorted Gourmet Sandwiches & Fresh Salads',
      category: 'Prepared Meals',
      quantity: '18 kg',
      mealCount: 40,
      dietType: 'Vegetarian & Vegan',
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
      preparedAt: '2026-10-10T13:00:00.000Z',
      currentTime: '2026-10-10T14:15:00.000Z',
      storageMethod: 'Refrigerated Display (<4°C)',
      tempRange: '3.5°C Cold Chain',
      packagingType: 'Individual eco-boxes with clear covers',
      safeUntil: '2026-10-10T21:00:00.000Z',
      pickupLocation: {
        address: '500 Marina Boulevard, Banquet Loading Dock 3',
        lat: 12.9210,
        lng: 74.8490
      },
      pickupStart: '17:30',
      pickupDeadline: '21:00',
      contactPhone: '+1 (555) 789-0123',
      status: 'accepted',
      rescueScore: 88,
      scoreBreakdown: 'Individually portioned + Cold chain maintained + NGO in 2.2 km radius.',
      aiSafety: {
        status: 'Low concern',
        confidence: 92,
        recommendedAction: 'Suitable for distribution. Maintain cold packs during transit.',
        factors: [
          { name: 'Preparation Elapsed', detail: '1.25 hrs ago', status: 'optimal' },
          { name: 'Storage Conditions', detail: 'Refrigerated at 3.5°C cold chain', status: 'optimal' },
          { name: 'Food Category', detail: 'Chilled bread & fresh cut produce', status: 'good' },
          { name: 'Safe Time Remaining', detail: '6 hrs 45 mins safe window', status: 'optimal' }
        ],
        disclaimer: 'AI-generated guidance is informational only. Follow applicable food-safety regulations and local authority guidance.'
      },
      aiImageAnalysis: {
        detected: 'Artisan Club Sandwiches & Green Salad Bowls',
        category: 'Chilled Prepared Food',
        confidence: 94,
        checks: {
          foodDetected: true,
          packagingDetected: true,
          contaminationIndicators: false,
          visibleSpoilageIndicators: false
        },
        notes: 'Individual sealed packaging, clean presentation.'
      },
      acceptedBy: {
        ngoId: 'usr_ngo_1',
        ngoName: 'Hope Community Kitchen',
        acceptedAt: '2026-10-10T14:25:00.000Z'
      },
      volunteerId: null,
      qrPickupCode: 'FRA-DON-102-PKUP',
      qrDeliveryCode: 'FRA-DON-102-DLVR',
      createdAt: '2026-10-10T13:45:00.000Z',
      updatedAt: '2026-10-10T14:25:00.000Z'
    },
    {
      id: 'don_103',
      donorId: 'usr_rest_1',
      donorName: 'Harvest Table Bakery & Deli',
      donorType: 'Bakery',
      foodName: 'Fresh Sourdough Loaves, Croissants & Bagels',
      category: 'Bakery & Bread',
      quantity: '35 kg',
      mealCount: 75,
      dietType: 'Vegan',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      preparedAt: '2026-10-10T06:00:00.000Z',
      currentTime: '2026-10-10T14:00:00.000Z',
      storageMethod: 'Ambient Dry Storage (21°C)',
      tempRange: '21°C Room Temp',
      packagingType: 'Kraft paper bakery bags in sealed crates',
      safeUntil: '2026-10-11T18:00:00.000Z',
      pickupLocation: {
        address: '18 Market Lane, Downtown',
        lat: 12.9110,
        lng: 74.8580
      },
      pickupStart: '15:00',
      pickupDeadline: '21:30',
      contactPhone: '+1 (555) 321-6549',
      status: 'pickup_in_progress',
      rescueScore: 91,
      scoreBreakdown: 'Extended 28h safe window + High pantry demand + Volunteer en route.',
      aiSafety: {
        status: 'Low concern',
        confidence: 98,
        recommendedAction: 'Excellent condition. Low microbial risk profile for dry baked goods.',
        factors: [
          { name: 'Preparation Elapsed', detail: 'Baked morning of current day', status: 'optimal' },
          { name: 'Storage Conditions', detail: 'Dry ambient storage', status: 'optimal' },
          { name: 'Food Category', detail: 'Baked goods (High stability)', status: 'optimal' },
          { name: 'Safe Time Remaining', detail: '28+ hrs remaining', status: 'optimal' }
        ],
        disclaimer: 'AI-generated guidance is informational only. Follow applicable food-safety regulations and local authority guidance.'
      },
      aiImageAnalysis: {
        detected: 'Artisanal Baked Loaves & Pastries',
        category: 'Bakery',
        confidence: 97,
        checks: {
          foodDetected: true,
          packagingDetected: true,
          contaminationIndicators: false,
          visibleSpoilageIndicators: false
        },
        notes: 'Golden crusts, undamaged dry goods.'
      },
      acceptedBy: {
        ngoId: 'usr_ngo_2',
        ngoName: 'Community Care Foundation',
        acceptedAt: '2026-10-10T14:00:00.000Z'
      },
      volunteerId: {
        id: 'usr_vol_1',
        name: 'Alex Rivera',
        phone: '+1 (555) 901-2345',
        vehicle: 'Eco Hatchback',
        assignedAt: '2026-10-10T14:15:00.000Z',
        currentLat: 12.9150,
        currentLng: 74.8530,
        etaMinutes: 6,
        distanceKm: 1.1
      },
      qrPickupCode: 'FRA-DON-103-PKUP',
      qrDeliveryCode: 'FRA-DON-103-DLVR',
      createdAt: '2026-10-10T12:00:00.000Z',
      updatedAt: '2026-10-10T14:15:00.000Z'
    },
    {
      id: 'don_104',
      donorId: 'usr_rest_1',
      donorName: 'City Center Convention Gala',
      donorType: 'Event Organizer',
      foodName: 'Roasted Mediterranean Chicken & Herb Potatoes',
      category: 'Prepared Meals',
      quantity: '30 kg',
      mealCount: 65,
      dietType: 'Non-Vegetarian',
      imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
      preparedAt: '2026-10-09T19:00:00.000Z',
      currentTime: '2026-10-10T09:00:00.000Z',
      storageMethod: 'Walk-in Chiller (<3°C)',
      tempRange: '2.8°C Regulated Chill',
      packagingType: 'Heavy foil food service pans',
      safeUntil: '2026-10-10T16:00:00.000Z',
      pickupLocation: {
        address: '100 Exhibition Road, Service Gate 4',
        lat: 12.9290,
        lng: 74.8450
      },
      pickupStart: '10:00',
      pickupDeadline: '13:00',
      contactPhone: '+1 (555) 654-9870',
      status: 'completed',
      rescueScore: 96,
      scoreBreakdown: 'Rapid rescue completed + Verified delivery at Hope Kitchen.',
      aiSafety: {
        status: 'Low concern',
        confidence: 90,
        recommendedAction: 'Rapid cold storage compliant. Delivered and reheated according to guidelines.',
        factors: [
          { name: 'Preparation Elapsed', detail: '14 hrs elapsed in certified walk-in cooler', status: 'good' },
          { name: 'Storage Conditions', detail: '2.8°C continuous refrigeration log', status: 'optimal' },
          { name: 'Food Category', detail: 'Cooked poultry (Requires strict reheat >75°C)', status: 'good' },
          { name: 'Safe Time Remaining', detail: 'Delivered before expiry', status: 'optimal' }
        ],
        disclaimer: 'AI-generated guidance is informational only. Follow applicable food-safety regulations and local authority guidance.'
      },
      aiImageAnalysis: {
        detected: 'Cooked Herb Chicken & Roasted Potatoes',
        category: 'Prepared Protein & Starch',
        confidence: 93,
        checks: {
          foodDetected: true,
          packagingDetected: true,
          contaminationIndicators: false,
          visibleSpoilageIndicators: false
        },
        notes: 'Commercial foil pans, no moisture leaks.'
      },
      acceptedBy: {
        ngoId: 'usr_ngo_1',
        ngoName: 'Hope Community Kitchen',
        acceptedAt: '2026-10-10T09:30:00.000Z'
      },
      volunteerId: {
        id: 'usr_vol_1',
        name: 'Alex Rivera',
        phone: '+1 (555) 901-2345',
        vehicle: 'Eco Hatchback',
        assignedAt: '2026-10-10T09:40:00.000Z'
      },
      qrPickupCode: 'FRA-DON-104-PKUP',
      qrDeliveryCode: 'FRA-DON-104-DLVR',
      completedAt: '2026-10-10T11:15:00.000Z',
      createdAt: '2026-10-10T08:30:00.000Z',
      updatedAt: '2026-10-10T11:15:00.000Z',
      certificateId: 'CERT-FRA-2026-104-X99'
    }
  ],
  notifications: [
    {
      id: 'notif_1',
      userId: 'usr_rest_1',
      role: 'restaurant',
      title: 'Donation Accepted!',
      message: 'Hope Community Kitchen accepted your donation: "Assorted Gourmet Sandwiches & Fresh Salads".',
      type: 'success',
      read: false,
      createdAt: '2026-10-10T14:25:00.000Z',
      link: '/dashboard/restaurant'
    },
    {
      id: 'notif_2',
      userId: 'usr_ngo_1',
      role: 'ngo',
      title: 'New Surplus Food Nearby',
      message: '50 Vegetarian Meals available 1.6 km away from Green Leaf Bistro. Safe until 8:30 PM.',
      type: 'info',
      read: false,
      createdAt: '2026-10-10T14:10:00.000Z',
      link: '/dashboard/ngo'
    },
    {
      id: 'notif_3',
      userId: 'usr_vol_1',
      role: 'volunteer',
      title: 'Active Mission En Route',
      message: 'Pickup in progress: 75 Meals from Harvest Table Bakery to Community Care Foundation.',
      type: 'action',
      read: false,
      createdAt: '2026-10-10T14:15:00.000Z',
      link: '/dashboard/volunteer'
    },
    {
      id: 'notif_4',
      userId: 'usr_admin_1',
      role: 'admin',
      title: 'AI Safety Watch Notice',
      message: 'All active listings analyzed: 100% compliant with standard temperature guidelines.',
      type: 'info',
      read: true,
      createdAt: '2026-10-10T13:00:00.000Z',
      link: '/dashboard/admin'
    }
  ],
  demandPredictions: [
    {
      zone: 'Central Urban Core',
      expectedDemand: 'High',
      confidence: 84,
      predictionWindow: 'Next 7 Days',
      mostRequested: 'Cooked Hot Meals & High-Protein Dishes',
      historicalDailyMeals: 145,
      predictedDailyMeals: 210,
      ngoCapacityIndex: 'Moderate (72% utilized)',
      surplusRiskProbability: 'Medium-High (Fri/Sat evenings)',
      recommendedAction: 'Target catering halls on Friday 18:00–22:00 window.'
    },
    {
      zone: 'Riverside & Harbor Suburbs',
      expectedDemand: 'Critical High',
      confidence: 89,
      predictionWindow: 'Next 7 Days',
      mostRequested: 'Bulk Rice/Grains, Fresh Milk & Family Produce Bags',
      historicalDailyMeals: 220,
      predictedDailyMeals: 340,
      ngoCapacityIndex: 'Near Ceiling (91% utilized)',
      surplusRiskProbability: 'High',
      recommendedAction: 'Pre-allocate 3 additional cargo volunteers to Harbor route.'
    },
    {
      zone: 'University District & East Sector',
      expectedDemand: 'Moderate',
      confidence: 76,
      predictionWindow: 'Next 7 Days',
      mostRequested: 'Bakery items, Sandwiches, Grab-and-go boxes',
      historicalDailyMeals: 90,
      predictedDailyMeals: 115,
      ngoCapacityIndex: 'Good Reserve (48% utilized)',
      surplusRiskProbability: 'Low',
      recommendedAction: 'Direct excess bakery surplus here for weekend student food pantries.'
    }
  ],
  heatmapZones: [
    {
      id: 'zone_1',
      name: 'Downtown Commercial & Hotel Strip',
      center: [12.9140, 74.8550],
      radiusKm: 2.2,
      surplusLevel: 'High',
      demandLevel: 'Medium',
      ngoCoverage: 'Strong (4 active centers)',
      volunteerCount: 8,
      status: 'optimal_rescue',
      color: '#10b981', // green
      details: 'High restaurant density. Fast 14-min average volunteer pickup response.'
    },
    {
      id: 'zone_2',
      name: 'Old Port Community & Shelter Row',
      center: [12.9320, 74.8380],
      radiusKm: 2.5,
      surplusLevel: 'Low',
      demandLevel: 'High',
      ngoCoverage: 'Critical Need (High unmet volume)',
      volunteerCount: 3,
      status: 'high_demand',
      color: '#f59e0b', // amber
      details: 'High concentration of community feeding centers needing surplus redirection.'
    },
    {
      id: 'zone_3',
      name: 'East Suburb Retail & Tech Park',
      center: [12.8950, 74.8720],
      radiusKm: 3.0,
      surplusLevel: 'High',
      demandLevel: 'Low',
      ngoCoverage: 'Moderate (2 centers)',
      volunteerCount: 5,
      status: 'surplus_heavy',
      color: '#38bdf8', // blue
      details: 'Large corporate cafeterias; surplus peaks between 14:00 and 16:30 daily.'
    }
  ],
  impactStats: {
    mealsRescued: 12842,
    foodSavedKg: 4280,
    donationsCompleted: 326,
    ngosConnected: 48,
    volunteersActive: 152,
    co2eAvoidedKg: 10700, // standard approx: ~2.5 kg CO2e per kg food saved
    waterSavedLiters: 1712000, // standard estimate: ~400 liters per kg food diverted
    landfillsDivertedTons: 4.28
  }
};

class Database {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(fileContent);
      } catch (err) {
        console.warn('Failed to parse data.json, falling back to initial data', err);
        return JSON.parse(JSON.stringify(INITIAL_DATA));
      }
    }
    this.saveData(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  saveData(data = this.data) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing data.json', err);
    }
  }

  // Users
  getUsers() { return this.data.users; }
  getUserById(id) { return this.data.users.find(u => u.id === id); }
  getUserByEmail(email) { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  createUser(user) {
    this.data.users.push(user);
    this.saveData();
    // Asynchronously sync to Firebase Firestore
    import('./services/firebaseService.js').then(({ firebaseService }) => {
      const { password, ...safeUser } = user;
      firebaseService.setDocument('users', safeUser.id, safeUser);
    }).catch(() => {});
    return user;
  }
  updateUser(id, updates) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.saveData();
      import('./services/firebaseService.js').then(({ firebaseService }) => {
        const { password, ...safeUser } = this.data.users[idx];
        firebaseService.setDocument('users', safeUser.id, safeUser);
      }).catch(() => {});
      return this.data.users[idx];
    }
    return null;
  }

  // Donations
  getDonations() { return this.data.donations; }
  getDonationById(id) { return this.data.donations.find(d => d.id === id); }
  createDonation(donation) {
    this.data.donations.unshift(donation);
    // increment impact counter estimate
    this.data.impactStats.mealsRescued += (Number(donation.mealCount) || 10);
    const kg = parseFloat(donation.quantity) || 5;
    this.data.impactStats.foodSavedKg += kg;
    this.data.impactStats.co2eAvoidedKg += Math.round(kg * 2.5);
    this.data.impactStats.waterSavedLiters += Math.round(kg * 400);
    this.saveData();

    // Asynchronously sync to Firebase Firestore
    import('./services/firebaseService.js').then(({ firebaseService }) => {
      firebaseService.setDocument('donations', donation.id, donation);
      firebaseService.setDocument('impactStats', 'current', this.data.impactStats);
    }).catch(() => {});

    return donation;
  }
  updateDonation(id, updates) {
    const idx = this.data.donations.findIndex(d => d.id === id);
    if (idx !== -1) {
      const oldStatus = this.data.donations[idx].status;
      this.data.donations[idx] = { ...this.data.donations[idx], ...updates, updatedAt: new Date().toISOString() };
      
      // If newly completed, record completion in impact
      if (updates.status === 'completed' && oldStatus !== 'completed') {
        this.data.impactStats.donationsCompleted += 1;
      }
      this.saveData();

      // Asynchronously sync to Firebase Firestore
      import('./services/firebaseService.js').then(({ firebaseService }) => {
        firebaseService.setDocument('donations', id, this.data.donations[idx]);
        firebaseService.setDocument('impactStats', 'current', this.data.impactStats);
      }).catch(() => {});

      return this.data.donations[idx];
    }
    return null;
  }

  deleteDonation(id) {
    const idx = this.data.donations.findIndex(d => d.id === id);
    if (idx !== -1) {
      const deleted = this.data.donations.splice(idx, 1)[0];
      this.saveData();

      // Asynchronously sync deletion to Firebase Firestore
      import('./services/firebaseService.js').then(({ firebaseService }) => {
        firebaseService.deleteDocument('donations', id);
      }).catch(() => {});

      return deleted;
    }
    return null;
  }

  // Notifications
  getNotifications(userId = null) {
    if (!userId) return this.data.notifications;
    return this.data.notifications.filter(n => !n.userId || n.userId === userId);
  }
  createNotification(notif) {
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false,
      ...notif
    };
    this.data.notifications.unshift(newNotif);
    this.saveData();
    return newNotif;
  }
  markNotificationRead(id) {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveData();
    }
    return notif;
  }

  // Predictions & Zones
  getDemandPredictions() { return this.data.demandPredictions; }
  getHeatmapZones() { return this.data.heatmapZones; }
  getImpactStats() { return this.data.impactStats; }
}

export const db = new Database();
