import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../config/api';
import './Reservations.css';

// Custom Hooks
import { useReservationsData } from './hooks/useReservationsData';
import { useReservationFormState } from './hooks/useReservationFormState';
import { useRazorpayPayment } from './hooks/useRazorpayPayment';

// API Services
import { createReservation, updateReservationPayment, updateReservationStatus } from './reservationApi';
import { createGuest } from './guestApi';

// Utilities
import { buildReservationPayload } from './utils/reservationPricing';
import { filterReservations, getDateFilterCounts } from './utils/reservationFilters';
import { exportGuestsToCsv } from './utils/csvExport';
import { calculateFolio } from '../Frontdesk/utils/folioCalculator';
import { RESERVATION_DATE_PRESETS } from './constants';

// Sub-Components
import ReservationHeader from './components/ReservationHeader';
import ReservationStats from './components/ReservationStats';
import ReservationFilters from './components/ReservationFilters';
import ReservationTable from './components/ReservationTable';
import NewReservationModal from './components/NewReservationModal';
import GuestCRM from './components/GuestCRM';
import GuestProfilePage from './components/GuestProfilePage';
import AddGuestModal from './components/AddGuestModal';
import BookingVoucherModal from './components/BookingVoucherModal';
import CancelReservationModal from './components/CancelReservationModal';
import { useNotifications } from '../../../context/NotificationContext';
import { formatTime12Hr, getHourFromTime } from '../../../utils/timeFormat';

/**
 * Main Reservations Page Component.
 * Manages dashboard reservation workflows, guest CRM, modal triggers, and live data synchronization.
 */
export default function Reservations({ onNavigate }) {
  const { addNotification, refresh: refreshNotifications } = useNotifications();

  // 1. Core Data & Real-Time Sync Hook
  const {
    propertiesList,
    reservationsList,
    guestsList,
    mealOrders,
    customRates,
    taxSettings,
    taxSettingsMap,
    isLoading: _isLoading,
    error: _error,
    loadAllData
  } = useReservationsData();

  // 2. Reservation Form & Pricing Calculation Hook
  const {
    reservationForm,
    updateReservationForm,
    selectedProperty,
    availableRooms,
    pricing,
    taxSettings: formTaxSettings,
    onPropertyChange,
    onRoomChange,
    resetForm: resetReservationForm
  } = useReservationFormState(propertiesList, customRates);

  // 3. Payment Gateway Hook
  const { isRazorpayConfigured, handleCollectRazorpay, handleSendWhatsAppPaymentLink } = useRazorpayPayment();

  // 4. View Mode & Modals State
  const [showGuestsCrmView, setShowGuestsCrmView] = useState(false);
  const [selectedGuestProfile, setSelectedGuestProfile] = useState(null);
  const [showNewGuestModal, setShowNewGuestModal] = useState(false);
  const [showNewResModal, setShowNewResModal] = useState(false);
  const [selectedResDetails, setSelectedResDetails] = useState(null);
  const [cancelTargetRes, setCancelTargetRes] = useState(null);

  // 5. Table Search & Filter State
  const [resSearchTerm, setResSearchTerm] = useState('');
  const [resChannelFilter, setResChannelFilter] = useState('all');
  const [resStatusFilter, setResStatusFilter] = useState('all');
  const [resDateFilter, setResDateFilter] = useState(RESERVATION_DATE_PRESETS.TODAY);

  // Compute live counts for date preset pills
  const dateCounts = useMemo(() => {
    return getDateFilterCounts(reservationsList);
  }, [reservationsList]);

  const [guestForm, setGuestForm] = useState({
    name: "",
    phone: "",
    email: "",
    aadhaar: ""
  });

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  /** Create a new Walk-in / Direct Reservation */
  const handleCreateWalkin = async (e) => {
    if (e) e.preventDefault();
    if (!reservationForm.guestName.trim() || !reservationForm.guestPhone.trim()) {
      toast.warning("Please enter Guest Name and Phone Number.");
      return;
    }

    const payload = buildReservationPayload(reservationForm, selectedProperty, pricing, formTaxSettings);

    try {
      const savedData = await createReservation(payload);
      setShowNewResModal(false);
      resetReservationForm();

      const savedId = savedData?.id || 'BK-NEW';
      toast.success(`Reservation ${savedId} created successfully!`);

      await loadAllData();
      if (refreshNotifications) refreshNotifications();
    } catch (err) {
      console.error("Backend reservation post error:", err);
      toast.error("Could not create reservation. Please check form details.");
    }
  };

  /** Create a new Guest Profile in CRM */
  const handleAddGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestForm.name.trim()) {
      toast.warning("Please enter Guest Name.");
      return;
    }

    const payload = {
      name: guestForm.name.trim(),
      email: guestForm.email.trim(),
      phone: guestForm.phone.trim(),
      idType: guestForm.idType || "Aadhaar Card",
      idNumber: (guestForm.idNumber || guestForm.aadhaar || "").trim(),
      idDocumentUrl: guestForm.idDocumentUrl || ""
    };

    try {
      await createGuest(payload);
      setShowNewGuestModal(false);
      setGuestForm({ name: "", phone: "", email: "", aadhaar: "", idType: "Aadhaar Card", idNumber: "", idDocumentUrl: "" });
      toast.success("Guest profile created successfully!");
      await loadAllData();
    } catch (err) {
      console.error("Error posting guest:", err);
      toast.error("Could not create guest profile. Please try again.");
    }
  };

  /** Mark a reservation balance as Paid in Full */
  const handleMarkPaid = async (booking, folio) => {
    try {
      const targetFolio = folio || calculateFolio(booking, mealOrders, taxSettings);
      const paidAmount = targetFolio.balanceDue > 0 ? targetFolio.balanceDue : (targetFolio.totalFolio || booking.totalAmount || 0);
      const newTotalPaid = targetFolio.totalFolio || booking.totalAmount || paidAmount;
      const resRef = booking.id || booking.bookingRef || 'BK-UNKNOWN';

      await updateReservationPayment(booking.dbId, {
        amountPaid: newTotalPaid,
        paymentStatus: "Paid in Full"
      });

      toast.success(`Payment of ₹${paidAmount.toLocaleString('en-IN')} received for ${booking.guestName || booking.guest}!`);

      // Instantly dispatch notification to Notification Center
      if (addNotification) {
        addNotification({
          id: `payment_${resRef}`,
          type: 'payment',
          category: 'payment',
          priority: 'normal',
          title: `Payment Received · ${booking.guestName || booking.guest || 'Guest'}`,
          message: `${booking.roomUnit || 'Room'} • ₹${newTotalPaid.toLocaleString('en-IN')} marked as Paid in Full (${resRef}).`,
          meta: {
            guestName: booking.guestName || booking.guest,
            roomUnit: booking.roomUnit,
            reservationId: resRef,
            amount: newTotalPaid
          },
          actionLabel: 'View Bookings',
          actionTab: 'reservations'
        });
      }

      await loadAllData();
      if (refreshNotifications) refreshNotifications();
    } catch (err) {
      console.error("Payment update error:", err);
      toast.error(`Payment update failed: ${err.message}`);
    }
  };

  /** Process Cancellation with Reason and Retention Fee */
  const handleCancelReservationSubmit = async (booking, reason, refundDetails) => {
    const numericId = booking.dbId || String(booking.id).replace(/[^0-9]/g, '');
    try {
      if (numericId) {
        await updateReservationStatus(numericId, 'cancelled', reason);
      }

      if (refundDetails && (refundDetails.refundMethod === "Razorpay Online Refund" || refundDetails.refundMethod === "Razorpay Gateway Auto-Refund") && refundDetails.refundAmount > 0) {
        if (booking.razorpayPaymentId) {
          try {
            const token = localStorage.getItem("token");
            const refundRes = await fetch(`${API_BASE_URL}/payments/razorpay/refund`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : ""
              },
              body: JSON.stringify({
                razorpayPaymentId: booking.razorpayPaymentId,
                amount: refundDetails.refundAmount,
                reservationId: numericId
              })
            });
            if (refundRes.ok) {
              toast.success(`Razorpay Online Refund of ₹${refundDetails.refundAmount.toLocaleString('en-IN')} initiated successfully!`);
            } else {
              const errData = await refundRes.json();
              toast.error(errData.error || "Razorpay API refund failed.");
            }
          } catch (e) {
            console.error("Razorpay refund error:", e);
            toast.error("Network error processing Razorpay refund.");
          }
        } else {
          toast.info("No Razorpay Payment ID on record. Cancellation saved with manual refund note.");
        }
      }

      if (numericId && refundDetails) {
        const collected = refundDetails.collectedAmount || booking.amountPaid || booking.totalAmount || 0;
        const totalSettled = (refundDetails.refundAmount || 0) + (refundDetails.retentionFee || 0);
        const isFull = totalSettled >= collected || refundDetails.refundAmount >= collected || refundDetails.refundAmount > 0;
        await updateReservationPayment(numericId, {
          paymentStatus: isFull ? "Refunded" : "Partial Refund",
          notes: reason
        });
      }

      setCancelTargetRes(null);
      toast.success(`Booking ${booking.id} cancelled successfully.`);
      await loadAllData();
    } catch (err) {
      console.error("Cancel reservation error:", err);
      toast.error(`Failed to cancel booking: ${err.message}`);
    }
  };

  // Filter reservations based on active search terms, status, channel & date preset
  const filteredReservations = filterReservations(reservationsList, {
    searchTerm: resSearchTerm,
    channelFilter: resChannelFilter,
    statusFilter: resStatusFilter,
    dateFilter: resDateFilter
  });

  return (
    <div className="res-container">
      {/* OVERLAY MODALS */}
      <AddGuestModal
        isOpen={showNewGuestModal}
        onClose={() => setShowNewGuestModal(false)}
        guestForm={guestForm}
        setGuestForm={setGuestForm}
        onSubmit={handleAddGuestSubmit}
      />

      <BookingVoucherModal
        booking={selectedResDetails}
        mealOrders={mealOrders}
        taxSettings={taxSettingsMap || taxSettings}
        onClose={() => setSelectedResDetails(null)}
      />

      <CancelReservationModal
        isOpen={Boolean(cancelTargetRes)}
        booking={cancelTargetRes}
        onClose={() => setCancelTargetRes(null)}
        onConfirmCancel={handleCancelReservationSubmit}
      />

      <NewReservationModal
        isOpen={showNewResModal}
        onClose={() => setShowNewResModal(false)}
        reservationForm={reservationForm}
        updateForm={updateReservationForm}
        propertiesList={propertiesList}
        availableRooms={availableRooms}
        selectedProperty={selectedProperty}
        reservationsList={reservationsList}
        pricing={pricing}
        onPropertyChange={onPropertyChange}
        onRoomChange={onRoomChange}
        isRazorpayConfigured={isRazorpayConfigured}
        onNavigateToSettings={() => onNavigate && onNavigate("settings")}
        handleCollectRazorpay={() => handleCollectRazorpay({
          reservationForm,
          pricing,
          selectedProperty,
          updateReservationForm
        })}
        handleSendWhatsAppPaymentLink={() => handleSendWhatsAppPaymentLink({
          reservationForm,
          pricing,
          selectedProperty,
          updateReservationForm
        })}
        handleCreateWalkin={handleCreateWalkin}
      />

      {/* MAIN VIEW SWITCHER */}
      {showGuestsCrmView ? (
        selectedGuestProfile ? (
          <GuestProfilePage
            guest={selectedGuestProfile}
            onBack={() => setSelectedGuestProfile(null)}
            onViewVoucher={setSelectedResDetails}
          />
        ) : (
          <GuestCRM
            guestsList={guestsList}
            onBack={() => setShowGuestsCrmView(false)}
            onExportCSV={() => exportGuestsToCsv(guestsList)}
            onOpenAddGuest={() => setShowNewGuestModal(true)}
            onSelectGuest={setSelectedGuestProfile}
          />
        )
      ) : (
        <>
          <ReservationHeader
            onOpenCrm={() => setShowGuestsCrmView(true)}
            onOpenNewRes={() => setShowNewResModal(true)}
          />

          <ReservationStats
            reservationsList={reservationsList}
            mealOrders={mealOrders}
            taxSettings={taxSettingsMap || taxSettings}
          />

          <ReservationFilters
            searchTerm={resSearchTerm}
            setSearchTerm={setResSearchTerm}
            channelFilter={resChannelFilter}
            setChannelFilter={setResChannelFilter}
            statusFilter={resStatusFilter}
            setStatusFilter={setResStatusFilter}
            dateFilter={resDateFilter}
            setDateFilter={setResDateFilter}
            dateCounts={dateCounts}
          />

          <ReservationTable
            reservations={filteredReservations}
            mealOrders={mealOrders}
            taxSettings={taxSettingsMap || taxSettings}
            dateFilter={resDateFilter}
            onSelectDateFilter={setResDateFilter}
            onMarkPaid={handleMarkPaid}
            onViewVoucher={setSelectedResDetails}
            onOpenCancelModal={setCancelTargetRes}
          />
        </>
      )}
    </div>
  );
}