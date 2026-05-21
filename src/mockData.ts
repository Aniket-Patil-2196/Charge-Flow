import { Station, EVVehicle, UserState, UserRole, DynamicPricingRule, SupportTicket } from "./types";

export const INITIAL_VEHICLES: EVVehicle[] = [
  {
    id: "v-tesla3",
    brand: "Tesla",
    model: "Model 3 Long Range",
    batteryCapacity: 75,
    chargingSpeedLimit: 250,
    connectorType: "Supercharger",
  },
  {
    id: "v-ioniq5",
    brand: "Hyundai",
    model: "Ioniq 5 Ultimate",
    batteryCapacity: 77,
    chargingSpeedLimit: 350,
    connectorType: "CCS",
  },
  {
    id: "v-nexon",
    brand: "Tata",
    model: "Nexon EV Max",
    batteryCapacity: 40,
    chargingSpeedLimit: 50,
    connectorType: "Type 2",
  },
  {
    id: "v-leaf",
    brand: "Nissan",
    model: "Leaf",
    batteryCapacity: 40,
    chargingSpeedLimit: 50,
    connectorType: "CHAdeMO",
  },
  {
    id: "v-audi",
    brand: "Audi",
    model: "e-tron 55",
    batteryCapacity: 95,
    chargingSpeedLimit: 150,
    connectorType: "CCS",
  }
];

export const INITIAL_PRICING_RULES: DynamicPricingRule[] = [
  {
    id: "p1",
    label: "Night Charger Super Saver",
    startHour: 23,
    endHour: 6,
    priceMultiplier: 0.8, // 20% discount
  },
  {
    id: "p2",
    label: "Standard Daylight Rate",
    startHour: 6,
    endHour: 18,
    priceMultiplier: 1.0,
  },
  {
    id: "p3",
    label: "Evening Peak Hours Demand",
    startHour: 18,
    endHour: 21,
    priceMultiplier: 1.35, // 35% surcharge
  },
  {
    id: "p4",
    label: "Night Transition Off-Peak",
    startHour: 21,
    endHour: 23,
    priceMultiplier: 0.9, // 10% discount
  }
];

export const INITIAL_STATIONS: Station[] = [
  {
    id: "st-1",
    name: "BlueVolt Supercharge Plaza",
    address: "Sector 62, Commercial Corridor, Ground Floor",
    latitude: 35,
    longitude: 40,
    distance: 1.2,
    status: "Online",
    basePricePerKwh: 16,
    amenities: ["WiFi", "Cafe", "Lounge", "Restrooms"],
    rating: 4.8,
    temperature: 28.5,
    reviews: [
      {
        id: "rev-1",
        userName: "Elena Rostova",
        rating: 5,
        comment: "Insanely fast charging! Got from 10% to 80% in exactly 22 minutes on CCS 250kW. Cafe has great espresso too.",
        date: "2026-05-18",
      },
      {
        id: "rev-2",
        userName: "Rahul Sharma",
        rating: 4,
        comment: "Great location. Sockets are healthy. Docked 1 star because the cafe was overcrowded at peak hours.",
        date: "2026-05-20",
      }
    ],
    slots: [
      {
        id: "st-1-s1",
        name: "Supercharger Bay 1",
        connectorType: "Supercharger",
        powerOutput: 250,
        isOccupied: false,
        isFastCharger: true,
        status: "Online",
      },
      {
        id: "st-1-s2",
        name: "Supercharger Bay 2",
        connectorType: "Supercharger",
        powerOutput: 250,
        isOccupied: false,
        isFastCharger: true,
        status: "Online",
      },
      {
        id: "st-1-s3",
        name: "Ultra CCS Slot 3",
        connectorType: "CCS",
        powerOutput: 150,
        isOccupied: true,
        isFastCharger: true,
        status: "Online",
        currentOccupantUserId: "user-test-idx-2"
      },
      {
        id: "st-1-s4",
        name: "Standard AC Type 2 Slot 4",
        connectorType: "Type 2",
        powerOutput: 22,
        isOccupied: false,
        isFastCharger: false,
        status: "Online",
      }
    ],
    queueList: [],
    peakHours: [10, 8, 5, 2, 8, 15, 30, 45, 60, 75, 80, 75, 60, 55, 65, 85, 95, 98, 90, 80, 65, 45, 25, 12],
    batterySwapAvailable: true,
    availableBatteriesCount: 14,
    batterySwapPrice: 500,
    totalSwapsCompleted: 247,
  },
  {
    id: "st-2",
    name: "GreenDrive Tech Galleria",
    address: "Block C4, Technology Business Park, Entry A",
    latitude: 50,
    longitude: 80,
    distance: 3.4,
    status: "Online",
    basePricePerKwh: 14,
    amenities: ["WiFi", "Shopping", "Restrooms"],
    rating: 4.5,
    temperature: 32.1,
    reviews: [
      {
        id: "rev-3",
        userName: "Marcus Vance",
        rating: 4,
        comment: "A solid charger station. Speeds are exactly as posted. Shopping center is right across the street so it’s easy to kill times.",
        date: "2026-05-15",
      }
    ],
    slots: [
      {
        id: "st-2-s1",
        name: "Fast CCS Bay A",
        connectorType: "CCS",
        powerOutput: 150,
        isOccupied: true,
        isFastCharger: true,
        status: "Online",
        currentOccupantUserId: "user-some-id"
      },
      {
        id: "st-2-s2",
        name: "Standard AC-1",
        connectorType: "Type 2",
        powerOutput: 22,
        isOccupied: true,
        isFastCharger: false,
        status: "Online",
        currentOccupantUserId: "user-third-id"
      },
      {
        id: "st-2-s3",
        name: "Standard AC-2",
        connectorType: "Type 2",
        powerOutput: 22,
        isOccupied: false,
        isFastCharger: false,
        status: "Online",
      }
    ],
    queueList: [],
    peakHours: [5, 2, 2, 1, 4, 10, 20, 40, 55, 65, 70, 75, 80, 82, 80, 75, 85, 92, 88, 80, 60, 40, 20, 10],
    batterySwapAvailable: true,
    availableBatteriesCount: 8,
    batterySwapPrice: 450,
    totalSwapsCompleted: 104,
  },
  {
    id: "st-3",
    name: "PowerSync HyperCharge Hub",
    address: "Metropolitan Freeway Outlet, Exit 14",
    latitude: 75,
    longitude: 30,
    distance: 5.6,
    status: "Online",
    basePricePerKwh: 18,
    amenities: ["Cafe", "Lounge", "Restrooms", "Shopping"],
    rating: 4.2,
    temperature: 36.4,
    reviews: [
      {
        id: "rev-x",
        userName: "Zoe Jenkins",
        rating: 3,
        comment: "Excellent chargers but unfortunately its ALWAYS completely full and busy. Queue is active and fast though.",
        date: "2026-05-20",
      }
    ],
    slots: [
      {
        id: "st-3-s1",
        name: "Hyper CCS Bay A",
        connectorType: "CCS",
        powerOutput: 350,
        isOccupied: true,
        isFastCharger: true,
        status: "Online",
        currentOccupantUserId: "user-active-1"
      },
      {
        id: "st-3-s2",
        name: "Hyper CCS Bay B",
        connectorType: "CCS",
        powerOutput: 350,
        isOccupied: true,
        isFastCharger: true,
        status: "Online",
        currentOccupantUserId: "user-active-2"
      },
      {
        id: "st-3-s3",
        name: "CHAdeMO Fast Slot",
        connectorType: "CHAdeMO",
        powerOutput: 100,
        isOccupied: true,
        isFastCharger: true,
        status: "Online",
        currentOccupantUserId: "user-active-3"
      }
    ],
    queueList: ["user-waiting-1", "user-waiting-2"], // This has an offline mock queue!
    peakHours: [20, 15, 10, 5, 15, 30, 60, 80, 90, 95, 98, 97, 95, 94, 96, 98, 100, 100, 99, 95, 85, 70, 50, 30],
    batterySwapAvailable: true,
    availableBatteriesCount: 5,
    batterySwapPrice: 650,
    totalSwapsCompleted: 312,
  },
  {
    id: "st-4",
    name: "EcoPoint Green Hub",
    address: "Pioneer Ring Road Near Botanical Park",
    latitude: 20,
    longitude: 70,
    distance: 6.8,
    status: "Maintenance",
    basePricePerKwh: 12,
    amenities: ["Restrooms"],
    rating: 4.0,
    temperature: 42.8, // hot!
    reviews: [],
    slots: [
      {
        id: "st-4-s1",
        name: "Slow AC Charger 1",
        connectorType: "Type 2",
        powerOutput: 11,
        isOccupied: false,
        isFastCharger: false,
        status: "Maintenance",
      },
      {
        id: "st-4-s2",
        name: "CCS Bay B",
        connectorType: "CCS",
        powerOutput: 50,
        isOccupied: false,
        isFastCharger: true,
        status: "Maintenance",
      }
    ],
    queueList: [],
    peakHours: [10, 8, 4, 2, 5, 12, 22, 35, 45, 50, 55, 60, 58, 55, 58, 62, 70, 75, 70, 62, 50, 38, 24, 15],
    batterySwapAvailable: false,
    availableBatteriesCount: 0,
    batterySwapPrice: 0,
    totalSwapsCompleted: 0,
  }
];

export const INITIAL_USER: UserState = {
  id: "user-main-id",
  name: "Aniket Patil",
  email: "aniketjaysingpatil3513@gmail.com",
  role: UserRole.User, // Default can be User, can switch roles in UI.
  vehicles: [
    {
      id: "v-tesla3",
      brand: "Tesla",
      model: "Model 3 Long Range",
      batteryCapacity: 75,
      chargingSpeedLimit: 250,
      connectorType: "Supercharger",
    },
    {
      id: "v-nexon",
      brand: "Tata",
      model: "Nexon EV Max",
      batteryCapacity: 40,
      chargingSpeedLimit: 50,
      connectorType: "Type 2",
    }
  ],
  selectedVehicleId: "v-tesla3",
  history: [
    {
      id: "hist-1",
      stationName: "BlueVolt Supercharge Plaza",
      chargerName: "Supercharger Bay 1",
      date: "2026-05-19",
      energyKwh: 45.2,
      durationMins: 28,
      cost: 813.6,
      co2SavedKg: 19.8,
    },
    {
      id: "hist-2",
      stationName: "GreenDrive Tech Galleria",
      chargerName: "Standard AC-1",
      date: "2026-05-12",
      energyKwh: 22.4,
      durationMins: 65,
      cost: 313.6,
      co2SavedKg: 9.8,
    }
  ],
  favoriteStations: ["st-1"],
  co2SavedTotal: 29.6,
  badges: ["Eco Catalyst", "Carbon Negative Driver"],
  walletBalance: 1200, // INR ₹
};

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "t-1",
    userId: "user-main-id",
    userEmail: "aniketjaysingpatil3513@gmail.com",
    title: "Double charge occurred on UPI payment",
    description: "I completed charging at BlueVolt on may 19th. My UPI app prompted a transaction error first, so I paid again. Now I see two debits of ₹813.6 on my bank account statement.",
    category: "Payment Refund",
    status: "In Progress",
    createdAt: "2026-05-20T10:15:00Z",
    replies: [
      {
        id: "rep-1",
        sender: "System",
        message: "Your ticket has been registered. Our billing managers are cross-referencing your transaction history with our banking gateway.",
        createdAt: "2026-05-20T10:15:10Z"
      },
      {
        id: "rep-2",
        sender: "Admin",
        message: "Hi Aniket, I see the double ledger entries. Reversing the duplicate payment (₹813.6) back to your bank account. It should settle within 2 business days. Apologies!",
        createdAt: "2026-05-20T14:30:00Z"
      }
    ]
  },
  {
    id: "t-2",
    userId: "user-some-id",
    userEmail: "another.ev.driver@gmail.com",
    title: "EcoPoint Green Hub bay is offline due to temperature",
    description: "The display showing on EcoPoint Station 4 screen indicates thermal fault and won’t lock onto connector.",
    category: "Station Offline",
    status: "Open",
    createdAt: "2026-05-21T08:44:00Z",
    replies: []
  }
];
