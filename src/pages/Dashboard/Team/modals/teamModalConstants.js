export const DEFAULT_PROPERTIES = [
  { id: '1', title: 'Sri Nature Villa' },
  { id: '2', title: 'Coorg Heights Homestay' }
];

export const PRD_ROLES = {
  PROPERTY_MANAGER: 'Property Manager',
  CARETAKER: 'Caretaker / Ground Staff'
};

export const ROLE_OPTIONS = [
  {
    value: 'Property Manager',
    label: 'Property Manager',
    responsibility: 'Manages properties, staff and booking operations across a portfolio',
    scope: 'Frontdesk, Calendar, Reservations, Staff Supervision & Petty Cash'
  },
  {
    value: 'Caretaker / Ground Staff',
    label: 'Caretaker / Ground Staff',
    responsibility: 'Housekeeping, guest check-in/out, meal logging and expense capture',
    scope: 'Room Turnovers (Photo Proof), Key Handovers, Meal Orders & Expense Capture'
  }
];

export const getRoleDefaultPermissions = (role) => {
  if (role === 'Property Manager') {
    return {
      photoEvidence: true,
      pettyCash: true,
      mealLogging: true,
      manageBookings: true
    };
  }
  // Caretaker / Ground Staff
  return {
    photoEvidence: true,
    pettyCash: true,
    mealLogging: true,
    manageBookings: false
  };
};

export const togglePropertySelection = (currentList, propId, totalCount) => {
  if (propId === 'all') {
    return currentList.includes('all') ? [] : ['all'];
  }

  let next = currentList.filter((id) => id !== 'all');

  if (next.includes(propId)) {
    next = next.filter((id) => id !== propId);
  } else {
    next.push(propId);
  }

  if (totalCount > 0 && next.length === totalCount) {
    return ['all'];
  }

  return next;
};
