export enum UserRole {
  User = "User",
  Admin = "Admin",
  SuperAdmin = "SuperAdmin"
}

export interface EVVehicle {
  id: string;
  brand: string;
  model: string;
  batteryCapacity: number; // in kWh
  chargingSpeedLimit: number; // in kW (max AC/DC input)
  connectorType: string; // "CCS" | "CHAdeMO" | "Type 2" | "Supercharger"
  image?: string;
}

export type StationStatus = "Online" | "Offline" | "Maintenance";

export interface ChargerSlot {
  id: string;
  name: string; // e.g. "Charger A", "Charger B"
  connectorType: "CCS" | "CHAdeMO" | "Type 2" | "Supercharger";
  powerOutput: number; // e.g. 50, 150, 250 kW
  currentOccupantUserId?: string; // If charging is live
  isOccupied: boolean;
  isFastCharger: boolean;
  status: "Online" | "Offline" | "Maintenance";
}

export interface Review {
  id: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number; // mock distance from simulated user location in km
  status: StationStatus;
  basePricePerKwh: number; // base price in INR or locally, let's keep price in INR ₹ or USD $ as appropriate
  amenities: string[]; // WiFi, Cafe, Lounge, Restrooms, Shopping
  rating: number;
  reviews: Review[];
  slots: ChargerSlot[];
  queueList: string[]; // List of userIds waiting
  peakHours: number[]; // 24 numbers (0-23 hrs) showing utilization % (0 to 100)
  temperature: number; // in Celsius for active health telemetry
  batterySwapAvailable?: boolean;
  availableBatteriesCount?: number;
  batterySwapPrice?: number;
  totalSwapsCompleted?: number;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  stationId: string;
  stationName: string;
  slotId: string;
  slotName: string;
  connectorType: string;
  vehicleModel: string;
  vehicleBatteryCapacity: number;
  startSoc: number; // State of Charge starting percent
  targetSoc: number; // Target percent
  estimatedDuration: number; // in minutes
  estimatedCost: number; // in INR
  paymentMethod: "UPI" | "Card" | "Wallet";
  paymentStatus: "Paid" | "Pending" | "Refunded";
  startTime: string; // DateTime ISO string
  status: "Booked" | "InQueue" | "Active" | "Completed" | "Cancelled";
  queueIndex?: number; // Spot in waiting line if joined when full
}

export interface LiveSession {
  bookingId: string;
  userId: string;
  stationId: string;
  stationName: string;
  slotName: string;
  startSoc: number;
  targetSoc: number;
  currentSoc: number;
  energyDeliveredKwh: number;
  chargingRateKw: number;
  timeRemainingSeconds: number;
  co2SavedKg: number;
  status: "Charging" | "Paused" | "Completed";
  costIncurred: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  description: string;
  category: "Charging Issue" | "Payment Refund" | "App Bug" | "Station Offline" | "Other";
  status: "Open" | "In Progress" | "Resolved";
  createdAt: string;
  replies: {
    id: string;
    sender: "User" | "System" | "Admin";
    message: string;
    createdAt: string;
  }[];
}

export interface ChargingHistoryItem {
  id: string;
  stationName: string;
  chargerName: string;
  date: string;
  energyKwh: number;
  durationMins: number;
  cost: number;
  co2SavedKg: number;
}

export interface UserState {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  vehicles: EVVehicle[];
  selectedVehicleId: string;
  history: ChargingHistoryItem[];
  favoriteStations: string[]; // stationIds
  co2SavedTotal: number;
  badges: string[]; // Badges earned
  walletBalance: number;
}

export interface DynamicPricingRule {
  id: string;
  startHour: number; // 0-23
  endHour: number; // 0-23
  priceMultiplier: number;
  label: string; // e.g. "Evening Peak Hour", "Night Super Saver"
}
