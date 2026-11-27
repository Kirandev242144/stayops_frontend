export const OP_TABS = {
  CHECKIN: 'checkin',
  CHECKOUT: 'checkout',
  INHOUSE: 'inhouse',
  COMPLETED: 'completed',
  NOSHOW: 'noshow'
};

export const TIME_FILTERS = {
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  WEEK: 'week'
};

export const PAYMENT_MODES = [
  'UPI / PhonePe / GPay',
  'Cash at Desk',
  'Credit / Debit Card (POS)',
  'Direct Bank Transfer'
];

export const MEAL_TYPES = [
  'Dinner',
  'Breakfast',
  'Lunch',
  'Snacks & Tea'
];

export const MEAL_SUGGESTIONS = [
  'Dinner Thali',
  'Breakfast Buffet',
  'Lunch Meal',
  'Evening Snacks & Tea',
  'Coffee / Tea',
  'Extra Water Bottles'
];

export const IN_STAY_SERVICE_SUGGESTIONS = [
  'Bonfire',
  'Camping Tent',
  'Extra Mattress / Bed',
  'BBQ Grill Kit',
  'Cab / Station Drop',
  'Tour / Trek Guide',
  'Laundry Service',
  'Bike / Vehicle Rental',
  'Late Checkout Fee',
  'Room Decoration'
];

export const MEAL_PRESETS = MEAL_SUGGESTIONS.map(name => ({ name, price: 0 }));
export const IN_STAY_SERVICE_PRESETS = IN_STAY_SERVICE_SUGGESTIONS.map(name => ({ name, price: 0 }));
