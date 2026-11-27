import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../../config/api';
import { calculateReservationTotal } from '../utils/reservationPricing';

/**
 * Custom hook to encapsulate Reservation Form state, property selection,
 * room unit selection, policies, and real-time total pricing calculation.
 */
export function useReservationFormState(propertiesList = [], customRates = {}) {
  const [reservationForm, setReservationForm] = useState({
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    guestCity: "",
    guestState: "",
    idType: "Aadhaar Card",
    idNumber: "",
    idDocumentUrl: "",
    idDocuments: [],
    propertyId: "",
    roomUnit: "",
    checkIn: new Date().toISOString().split('T')[0],
    checkInTime: "",
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    checkOutTime: "",

    guestCount: 1,
    adultsCount: 1,
    childrenCount: 0,
    paymentStatus: "cash",
    paidAmount: 0,
    manualTotalAmount: null,
    bookingSource: "Walk-In",
    notes: ""
  });

  const [childPolicy, setChildPolicy] = useState(null);
  const [taxSettings, setTaxSettings] = useState(null);

  // Safely extract first room from a property object
  const getFirstRoomName = (prop) => {
    const roomsArray = Array.isArray(prop?.rooms) ? prop.rooms : [];
    return roomsArray.length > 0 && roomsArray[0]?.name ? roomsArray[0].name : "";
  };

  // Extract operational check-in / check-out times from property configuration
  const getPropertyTimes = (prop) => {
    let checkIn = "";
    let checkOut = "";
    if (prop && prop.operations) {
      try {
        const ops = typeof prop.operations === 'string' ? JSON.parse(prop.operations) : prop.operations;
        if (ops.checkIn) checkIn = ops.checkIn;
        if (ops.checkOut) checkOut = ops.checkOut;
      } catch {
        // Ignore JSON parse errors
      }
    }
    return { checkIn, checkOut };
  };

  // Automatically select first property when properties list populates
  useEffect(() => {
    if (propertiesList.length > 0 && !reservationForm.propertyId) {
      const firstProp = propertiesList[0];
      const firstRoom = getFirstRoomName(firstProp);
      const times = getPropertyTimes(firstProp);
      setReservationForm(prev => ({
        ...prev,
        propertyId: String(firstProp.id),
        roomUnit: firstRoom,
        checkInTime: times.checkIn,
        checkOutTime: times.checkOut
      }));
    }
  }, [propertiesList, reservationForm.propertyId]);

  // Load Child Policy & Tax Settings for selected property (with cancellation flag to prevent race conditions)
  useEffect(() => {
    let isMounted = true;
    if (reservationForm.propertyId) {
      const token = localStorage.getItem("token");
      const headers = { Authorization: token ? `Bearer ${token}` : "" };

      fetch(`${API_BASE_URL}/properties/${reservationForm.propertyId}/policies`, { headers })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (!isMounted) return;
          if (data && data.childAgePolicyJson) {
            try {
              const parsed = typeof data.childAgePolicyJson === 'string'
                ? JSON.parse(data.childAgePolicyJson)
                : data.childAgePolicyJson;
              setChildPolicy(parsed);
            } catch {
              setChildPolicy(null);
            }
          } else {
            setChildPolicy(null);
          }
        })
        .catch(() => { if (isMounted) setChildPolicy(null); });

      fetch(`${API_BASE_URL}/properties/${reservationForm.propertyId}/taxes`, { headers })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (isMounted) setTaxSettings(data); })
        .catch(() => { if (isMounted) setTaxSettings(null); });
    }

    return () => {
      isMounted = false;
    };
  }, [reservationForm.propertyId]);

  const updateReservationForm = (field, value) => {
    setReservationForm(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      if (field === 'paymentStatus' && String(value).toLowerCase().trim() === 'unpaid') {
        updated.paidAmount = 0;
      }
      return updated;
    });
  };

  const selectedProperty = propertiesList.find(p => String(p.id) === String(reservationForm.propertyId)) ?? null;
  const availableRooms = Array.isArray(selectedProperty?.rooms) ? selectedProperty.rooms : [];

  // Derive selectedRooms list
  let selectedRooms = [];
  if (Array.isArray(reservationForm.selectedRooms) && reservationForm.selectedRooms.length > 0) {
    selectedRooms = reservationForm.selectedRooms;
  } else if (reservationForm.roomUnit) {
    const units = reservationForm.roomUnit.split(',').map(u => u.trim()).filter(Boolean);
    selectedRooms = availableRooms.filter(r => units.includes(r.name));
    if (selectedRooms.length === 0 && availableRooms.length > 0) {
      const match = availableRooms.find(r => r.name === reservationForm.roomUnit);
      if (match) selectedRooms = [match];
    }
  }
  const selectedRoom = selectedRooms.length > 0 ? selectedRooms[0] : (availableRooms.find(r => r.name === reservationForm.roomUnit) ?? null);

  const pricing = calculateReservationTotal({
    checkIn: reservationForm.checkIn,
    checkOut: reservationForm.checkOut,
    selectedRooms,
    selectedRoom,
    selectedProperty,
    adultsCount: reservationForm.adultsCount,
    childrenCount: reservationForm.childrenCount,
    childPolicy,
    taxSettings,
    manualTotalAmount: reservationForm.manualTotalAmount,
    paymentStatus: reservationForm.paymentStatus,
    paidAmount: reservationForm.paidAmount,
    customRates,
    availableRooms
  });

  /** Strictly extract room capacity from room configuration */
  const getRoomCapacity = (room) => (room && room.capacity ? Number(room.capacity) : 0);

  /** Helper to clamp guest count strictly against property/room capacity */
  const keepGuestCountValid = (count, capacity) => {
    const current = Math.max(1, Number(count));
    if (!capacity || capacity <= 0) return current;
    return Math.min(current, capacity);
  };

  const onPropertyChange = (e) => {
    const propId = e.target.value;
    const prop = propertiesList.find(p => String(p.id) === String(propId));
    const roomsArray = Array.isArray(prop?.rooms) ? prop.rooms : [];
    const firstRoom = roomsArray.length > 0 ? roomsArray[0] : null;
    const capacity = getRoomCapacity(firstRoom);
    const times = getPropertyTimes(prop);

    setReservationForm(prev => ({
      ...prev,
      propertyId: propId,
      roomUnit: firstRoom ? firstRoom.name : "",
      selectedRooms: firstRoom ? [firstRoom] : [],
      checkInTime: times.checkIn,
      checkOutTime: times.checkOut,
      guestCount: keepGuestCountValid(prev.guestCount, capacity),
      manualTotalAmount: null
    }));
  };


  const onRoomChange = (e) => {
    const roomName = e.target.value;
    const room = availableRooms.find(r => r.name === roomName);
    const capacity = getRoomCapacity(room);

    setReservationForm(prev => ({
      ...prev,
      roomUnit: roomName,
      guestCount: keepGuestCountValid(prev.guestCount, capacity),
      manualTotalAmount: null
    }));
  };

  /** Form reset back to clean initial state */
  const resetForm = () => {
    const times = getPropertyTimes(selectedProperty);
    setReservationForm(prev => ({
      ...prev,
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      guestCity: "",
      guestState: "",
      idType: "Aadhaar Card",
      idNumber: "",
      idDocumentUrl: "",
      idDocuments: [],
      checkInTime: times.checkIn,
      checkOutTime: times.checkOut,
      adultsCount: 1,
      childrenCount: 0,
      paymentStatus: "cash",
      paidAmount: 0,
      manualTotalAmount: null,
      notes: ""
    }));
  };

  return {
    reservationForm,
    setReservationForm,
    updateReservationForm,
    selectedProperty,
    availableRooms,
    selectedRoom,
    childPolicy,
    taxSettings,
    pricing,
    onPropertyChange,
    onRoomChange,
    resetForm
  };
}
