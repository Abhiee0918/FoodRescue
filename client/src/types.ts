export type UserRole = 'restaurant' | 'ngo' | 'volunteer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationName?: string;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
  verified?: boolean;
  vehicleType?: string;
  serviceArea?: string;
  capacity?: number;
  currentNeed?: string;
  dietPreferences?: string[];
  bio?: string;
  suspended?: boolean;
  completedTrips?: number;
  totalDistanceKm?: number;
  mealsTransported?: number;
  createdAt: string;
}

export type DonationStatus =
  | 'posted'
  | 'accepted'
  | 'volunteer_assigned'
  | 'pickup_in_progress'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivered_awaiting_ngo_confirmation'
  | 'delivery_confirmed'
  | 'delivery_disputed'
  | 'completed'
  | 'cancelled';

export type DeliveryStatus =
  | 'created'
  | 'ngo_accepted'
  | 'volunteer_assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered_awaiting_ngo_confirmation'
  | 'delivery_confirmed'
  | 'delivery_disputed'
  | 'delivery_cancelled';

export interface AISafetyFactor {
  name: string;
  detail: string;
  status: 'optimal' | 'good' | 'warning' | 'danger';
}

export interface AISafetyAssessment {
  status: 'Low concern' | 'Review recommended' | 'High concern' | 'Insufficient information';
  confidence: number;
  recommendedAction: string;
  requiresHumanReview?: boolean;
  factors: AISafetyFactor[];
  disclaimer: string;
}

export interface AIImageAnalysis {
  detected: string;
  category: string;
  confidence: number;
  checks: {
    foodDetected: boolean;
    packagingDetected: boolean;
    contaminationIndicators: boolean;
    visibleSpoilageIndicators: boolean;
  };
  notes?: string;
  uncertain?: boolean;
  disclaimer?: string;
}

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  donorType: 'Restaurant' | 'Event Organizer' | 'Bakery' | 'Supermarket';
  foodName: string;
  category: string;
  quantity: string;
  mealCount: number;
  dietType: 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Vegetarian & Vegan';
  imageUrl: string;
  preparedAt: string;
  currentTime?: string;
  storageMethod: string;
  tempRange: string;
  packagingType: string;
  safeUntil: string;
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  pickupStart: string;
  pickupDeadline: string;
  contactPhone: string;
  status: DonationStatus;
  rescueScore: number;
  scoreBreakdown?: string;
  aiSafety?: AISafetyAssessment;
  aiImageAnalysis?: AIImageAnalysis;
  acceptedBy?: {
    ngoId: string;
    ngoName: string;
    acceptedAt: string;
  } | null;
  volunteerId?: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    assignedAt: string;
    currentLat?: number;
    currentLng?: number;
    etaMinutes?: number;
    distanceKm?: number;
  } | null;
  pickedUpAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  certificateId?: string;
  deliveryStatus?: DeliveryStatus | string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  pickupTimestamp?: string;
  deliveryStartTimestamp?: string;
  deliveryTimestamp?: string;
  ngoConfirmationStatus?: 'pending' | 'confirmed' | 'disputed' | string;
  ngoConfirmedBy?: string;
  ngoConfirmedByName?: string;
  ngoConfirmationTimestamp?: string;
  deliveryProofUrl?: string;
  deliveryNotes?: string;
  disputeReason?: string;
  disputeResolvedBy?: string;
  disputeResolutionNotes?: string;
  disputedAt?: string;
  disputeResolvedAt?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  pickupInstructions?: string;
  deliveryInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImpactStats {
  mealsRescued: number;
  foodSavedKg: number;
  donationsCompleted: number;
  ngosConnected: number;
  volunteersActive: number;
  co2eAvoidedKg: number;
  waterSavedLiters: number;
  landfillsDivertedTons: number;
}

export interface Notification {
  id: string;
  userId?: string;
  role?: UserRole;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'action';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface HeatmapZone {
  id: string;
  name: string;
  center: [number, number];
  radiusKm: number;
  surplusLevel: 'Low' | 'Medium' | 'High';
  demandLevel: 'Low' | 'Medium' | 'High';
  ngoCoverage: string;
  volunteerCount: number;
  status: 'optimal_rescue' | 'high_demand' | 'surplus_heavy';
  color: string;
  details: string;
}

export interface DemandPrediction {
  zone: string;
  expectedDemand: string;
  confidence: number;
  predictionWindow: string;
  mostRequested: string;
  historicalDailyMeals: number;
  predictedDailyMeals: number;
  trend: string;
  ngoCapacityIndex: string;
  surplusRiskProbability: string;
  recommendedAction: string;
  weeklyChart: { day: string; historical: number; predicted: number }[];
}

export interface LiveInsight {
  id: string;
  title: string;
  text: string;
  type: 'opportunity' | 'capacity' | 'timing' | 'warning';
  priority: 'high' | 'optimal' | 'guidance' | 'urgent';
}
