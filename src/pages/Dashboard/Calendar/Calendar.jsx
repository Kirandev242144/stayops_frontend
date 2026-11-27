import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useCalendarData } from './hooks/useCalendarData';
import { useReservationFormState } from '../Reservations/hooks/useReservationFormState';
import { useRazorpayPayment } from '../Reservations/hooks/useRazorpayPayment';
import { createReservation } from '../Reservations/reservationApi';
import { buildReservationPayload } from '../Reservations/utils/reservationPricing';
import { formatDateKey } from './utils/calendarUtils';

// Child Components & Modals
import CalendarHeader from './components/CalendarHeader';
import CalendarGrid from './components/CalendarGrid';
import MobileCalendarAgenda from './components/MobileCalendarAgenda';
import BookingVoucherModal from '../Reservations/components/BookingVoucherModal';
import NewReservationModal from '../Reservations/components/NewReservationModal';
import BulkPriceModal from './components/BulkPriceModal';
import BlockDatesModal from './components/BlockDatesModal';
import UnblockDateModal from './components/UnblockDateModal';
import InlineRateEditModal from './components/InlineRateEditModal';
import PhotoProofModal from './components/PhotoProofModal';

import './Calendar.css';

/**
 * Calendar Page Component
 * Main coordinator for PMS multi-room Tape Chart timeline grid, custom rates,
 * blocked date management, housekeeping status, and walk-in reservation creation.
 */
export default function Calendar({ onNavigate }) {
  // Custom Data & Logic Hook for Calendar State & Operations
  const {
    startDate,
    setStartDate,
    numDays,
    setNumDays,
    viewMode,
    setViewMode,
    selectedPropertyId,
    setSelectedPropertyId,
    searchQuery,
    setSearchQuery,
    daysArray,
    propertiesList,
    reservationsList,
    mealOrders,
    taxSettings,
    taxSettingsMap,
    filteredRooms,
    customRates,
    blockedDates,
    housekeepingMap,
    isLoading,
    loadData,
    handlePrevDays,
    handleNextDays,
    handleResetToday,
    applyBulkPrice,
    addBlockedDates,
    removeBlockedDate,
    updateSingleRate,
    toggleHousekeeping
  } = useCalendarData();

  // Shared Reservation Form State Hook
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

  // Payment Integration Hook
  const { 
    isRazorpayConfigured, 
    handleCollectRazorpay, 
    handleSendWhatsAppPaymentLink 
  } = useRazorpayPayment();

  // Overlay Modals State
  const [selectedResDetails, setSelectedResDetails] = useState(null);
  const [showNewResModal, setShowNewResModal] = useState(false);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [showBlockDatesModal, setShowBlockDatesModal] = useState(false);
  const [selectedBlockForUnblock, setSelectedBlockForUnblock] = useState(null);
  const [inlineRateData, setInlineRateData] = useState(null);
  const [photoProofTarget, setPhotoProofTarget] = useState(null);

  /**
   * Pre-fills room unit and check-in date when user clicks an empty cell on the grid
   */
  const handleEmptySlotClick = (room, dateObj) => {
    const chkInStr = formatDateKey(dateObj);
    const todayStr = formatDateKey(new Date());

    if (chkInStr < todayStr) {
      toast.warning(`Cannot create reservations for past dates (${chkInStr}).`);
      return;
    }

    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);
    const chkOutStr = formatDateKey(nextDay);

    updateReservationForm('checkIn', chkInStr);
    updateReservationForm('checkOut', chkOutStr);
    if (room.propertyId) {
      updateReservationForm('propertyId', room.propertyId);
    }
    if (room.name) {
      updateReservationForm('roomUnit', room.name);
    }
    setShowNewResModal(true);
  };

  /**
   * Pre-fills room unit, check-in date, and check-out date when user drags across cells
   */
  const handleRangeSlotSelect = (room, checkInDate, checkOutDate) => {
    const chkInStr = formatDateKey(checkInDate);
    const chkOutStr = formatDateKey(checkOutDate);
    const todayStr = formatDateKey(new Date());

    if (chkInStr < todayStr) {
      toast.warning(`Cannot create reservations for past dates (${chkInStr}).`);
      return;
    }

    updateReservationForm('checkIn', chkInStr);
    updateReservationForm('checkOut', chkOutStr);
    if (room.propertyId) {
      updateReservationForm('propertyId', room.propertyId);
    }
    if (room.name) {
      updateReservationForm('roomUnit', room.name);
    }

    const startMs = new Date(chkInStr).getTime();
    const endMs = new Date(chkOutStr).getTime();
    const nights = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));

    toast.info(`Selected ${nights} night${nights > 1 ? 's' : ''} for ${room.name} (${chkInStr} to ${chkOutStr})`);
    setShowNewResModal(true);
  };

  /**
   * Creates a new Walk-in / Direct Reservation from the Tape Chart Grid
   */
  const handleCreateWalkin = async (e) => {
    if (e) e.preventDefault();
    if (!reservationForm.guestName.trim() || !reservationForm.guestPhone.trim()) {
      toast.warning("Please enter Guest Name and Phone Number.");
      return;
    }

    const todayStr = formatDateKey(new Date());
    if (reservationForm.checkIn < todayStr) {
      toast.warning("Check-in date cannot be in the past.");
      return;
    }


    const payload = buildReservationPayload(reservationForm, selectedProperty, pricing, formTaxSettings);

    try {
      const savedData = await createReservation(payload);
      setShowNewResModal(false);
      resetReservationForm();

      const savedId = savedData?.id || 'BK-NEW';
      toast.success(`Reservation ${savedId} created successfully from Tape Chart!`);
      await loadData();
    } catch (err) {
      console.error("Calendar reservation creation error:", err);
      toast.error("Could not create reservation. Please check form details.");
    }
  };

  return (
    <div className="cal-container">
      
      {/* 1. HEADER & NAVIGATION TOOLBAR */}
      <CalendarHeader
        startDate={startDate}
        setStartDate={setStartDate}
        numDays={numDays}
        setNumDays={setNumDays}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedPropertyId={selectedPropertyId}
        setSelectedPropertyId={setSelectedPropertyId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        propertiesList={propertiesList}
        onPrevDays={handlePrevDays}
        onNextDays={handleNextDays}
        onResetToday={handleResetToday}
        onOpenNewResModal={() => setShowNewResModal(true)}
        onOpenBlockDatesModal={() => setShowBlockDatesModal(true)}
        onOpenBulkPriceModal={() => setShowBulkPriceModal(true)}
      />

      {/* 2. TAPE CHART TIMELINE MATRIX (DESKTOP) & AGENDA (MOBILE) */}
      {isLoading ? (
        <div className="cal-loading-state">
          <div className="cal-spinner" />
          <p>Loading multi-room timeline grid...</p>
        </div>
      ) : (
        <>
          {/* Desktop Timeline Grid View */}
          <div className="cal-desktop-grid-view">
            <CalendarGrid
              daysArray={daysArray}
              roomsList={filteredRooms}
              reservationsList={reservationsList}
              mealOrders={mealOrders}
              taxSettings={taxSettingsMap || taxSettings}
              viewMode={viewMode}
              customRates={customRates}
              blockedDates={blockedDates}
              housekeepingMap={housekeepingMap}
              onClickBooking={res => setSelectedResDetails(res)}
              onEmptySlotClick={handleEmptySlotClick}
              onRangeSlotSelect={handleRangeSlotSelect}
              onOpenInlineRateModal={(room, dateKey, currentRate) => {
                setInlineRateData({ room, dateKey, currentRate });
              }}
              onToggleHousekeeping={toggleHousekeeping}
              onOpenPhotoProofModal={(room, hkDetails) => setPhotoProofTarget({ room, hkDetails })}
              onUnblockDate={block => setSelectedBlockForUnblock(block)}
            />
          </div>

          {/* Native Mobile Agenda View (< 768px) */}
          <div className="cal-mobile-agenda-view">
            <MobileCalendarAgenda
              startDate={startDate}
              setStartDate={setStartDate}
              roomsList={filteredRooms}
              reservationsList={reservationsList}
              blockedDates={blockedDates}
              customRates={customRates}
              housekeepingMap={housekeepingMap}
              onSelectBooking={res => setSelectedResDetails(res)}
              onEmptySlotClick={handleEmptySlotClick}
              onOpenNewResModal={() => setShowNewResModal(true)}
              onOpenBlockDatesModal={() => setShowBlockDatesModal(true)}
            />
          </div>
        </>
      )}

      {/* 3. OVERLAY MODALS */}
      <BookingVoucherModal
        booking={selectedResDetails}
        mealOrders={mealOrders}
        taxSettings={taxSettingsMap || taxSettings}
        onClose={() => setSelectedResDetails(null)}
      />

      <BulkPriceModal
        isOpen={showBulkPriceModal}
        onClose={() => setShowBulkPriceModal(false)}
        roomsList={filteredRooms}
        onApplyBulkPrice={payload => {
          applyBulkPrice(payload);
          toast.success("Bulk rates applied successfully!");
        }}
      />

      <BlockDatesModal
        isOpen={showBlockDatesModal}
        onClose={() => setShowBlockDatesModal(false)}
        roomsList={filteredRooms}
        onSaveBlockDates={payload => {
          addBlockedDates(payload);
          toast.success(`Blocked dates saved for ${payload.category}!`);
        }}
      />

      <UnblockDateModal
        isOpen={Boolean(selectedBlockForUnblock)}
        onClose={() => setSelectedBlockForUnblock(null)}
        blockData={selectedBlockForUnblock}
        onConfirmUnblock={async (block) => {
          await removeBlockedDate(block.id);
          toast.success("Room unit unblocked successfully!");
        }}
      />

      <InlineRateEditModal
        isOpen={Boolean(inlineRateData)}
        onClose={() => setInlineRateData(null)}
        targetData={inlineRateData}
        onSaveSingleRate={payload => {
          updateSingleRate(payload);
          toast.success(`Nightly rate updated to ₹${payload.newRate.toLocaleString('en-IN')}`);
        }}
      />

      <PhotoProofModal
        isOpen={Boolean(photoProofTarget)}
        onClose={() => setPhotoProofTarget(null)}
        targetRoom={photoProofTarget?.room}
        hkDetails={photoProofTarget?.hkDetails}
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
    </div>
  );
}
