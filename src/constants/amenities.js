// =========================================================
// STAYOPS AMENITIES SYSTEM & DEFINITIONS
// =========================================================

export const ROOM_AMENITY_CATEGORIES = [
  {
    category: "Essentials & Tech",
    items: [
      "WiFi",
      "Air conditioning",
      "Ceiling fan",
      "Smart TV",
      "DTH Cable TV",
      "Hot water shower",
      "Geyser",
      "Room heater",
      "Work desk",
      "Electric kettle",
      "Mini fridge",
      "Tea / Coffee maker",
      "Power outlets near bed"
    ]
  },
  {
    category: "Bathroom & Hygiene",
    items: [
      "Private bathroom",
      "Bathtub",
      "Hair dryer",
      "Toiletries & Soap",
      "Towels & Linen",
      "Bathrobe & Slippers"
    ]
  },
  {
    category: "Comfort & Layout",
    items: [
      "Balcony",
      "Terrace access",
      "Mountain view",
      "Garden view",
      "Pool view",
      "Sea view",
      "Wardrobe & Hangers",
      "Safe locker",
      "Iron & Board",
      "Kitchenette",
      "Microwave"
    ]
  }
];

export const PROPERTY_AMENITY_CATEGORIES = [
  {
    category: "Popular & Essentials",
    items: [
      "Free High-Speed WiFi",
      "Air Conditioning",
      "Power Backup / Generator",
      "Free Private Parking",
      "Swimming Pool",
      "24/7 Caretaker on Property",
      "Daily Housekeeping",
      "Geyser / 24h Hot Water",
      "Pet Friendly"
    ]
  },
  {
    category: "Kitchen & Dining",
    items: [
      "In-house Restaurant",
      "Fully Equipped Kitchen",
      "Complimentary Breakfast",
      "Refrigerator / Fridge",
      "Microwave Oven",
      "RO Water Purifier",
      "Induction / Gas Stove",
      "Electric Kettle",
      "Tea & Coffee Maker",
      "Barbeque (BBQ) Grill Setup",
      "Dining Area / Outdoor Dining",
      "Chef on Demand / Home Cooked Meals",
      "Room Service"
    ]
  },
  {
    category: "Outdoors, Scenic & Leisure",
    items: [
      "Private Lawn & Garden",
      "Outdoor Bonfire / Fire Pit",
      "Plunge Pool / Private Pool",
      "Jacuzzi / Hot Tub",
      "Mountain View",
      "Valley / Forest View",
      "Lake / River View",
      "Terrace & Sun Deck",
      "Gazebo & Outdoor Seating",
      "Patio / Veranda"
    ]
  },
  {
    category: "Entertainment & Wellness",
    items: [
      "Smart TV (Netflix, Prime, YouTube)",
      "Bluetooth Music System",
      "Indoor Board Games",
      "Table Tennis",
      "Snooker / Pool Table",
      "Game Room",
      "Kids Play Area & Swings",
      "Fitness Gym",
      "Yoga Lawn / Mats",
      "Spa & Massage Services"
    ]
  },
  {
    category: "Safety & Security",
    items: [
      "24/7 Security Guard",
      "CCTV in Common Areas",
      "Gated Private Compound",
      "Fire Extinguisher",
      "First Aid Kit",
      "Electronic Safe / Locker",
      "Smoke Detector"
    ]
  },
  {
    category: "Accessibility & Vehicles",
    items: [
      "EV Charging Station",
      "Driver Accommodation",
      "Wheelchair Accessible",
      "Elevator / Lift",
      "Ground Floor Access",
      "Wide Doorways & Ramps"
    ]
  },
  {
    category: "Services & Convenience",
    items: [
      "24/7 Front Desk / Check-in",
      "Luggage Assistance & Storage",
      "Washing Machine / Laundry Service",
      "Iron & Ironing Board",
      "Doctor on Call",
      "Airport / Station Pickup & Drop",
      "Bicycle / Scooter Rental",
      "Local Tour & Trekking Assistance"
    ]
  },
  {
    category: "Work & Tech",
    items: [
      "Dedicated Work Desk",
      "Ergonomic Office Chair",
      "Multiple Power Outlets",
      "UPS for WiFi Router",
      "Cellular Network Signal Booster"
    ]
  }
];

/**
 * Safely parses property or room amenities JSON string or array.
 */
export const parseAmenitiesList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [];
    }
  }
  return [];
};
