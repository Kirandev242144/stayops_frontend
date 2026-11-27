import { getHourFromTime } from '../../../../utils/timeFormat';

function getLocalDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks if a reservation is arriving late based on the property's configured check-in time.
 * Triggers if:
 * 1. The scheduled check-in date has passed (guest missed check-in date)
 * 2. Or today is check-in date and current time exceeds standard check-in + grace hours
 */
export function isLateArrival(reservation, propertyOperations = null, now = new Date()) {
  const status = (reservation.status || '').toLowerCase();
  if (status !== 'confirmed' && status !== 'checkin' && status !== '') return false;

  const todayStr = getLocalDateStr(now);
  const checkinDate = reservation.checkIn || reservation.checkin || '';
  if (!checkinDate) return false;

  // Case 1: Overdue arrival from yesterday or earlier
  if (checkinDate < todayStr) {
    return true;
  }

  // Case 2: Today's check-in
  if (checkinDate === todayStr) {
    const rawCheckIn = propertyOperations?.checkIn || propertyOperations?.checkInTime || reservation.checkInTime || '';
    const checkInHour = getHourFromTime(rawCheckIn);
    const lateArrivalGraceHours = propertyOperations?.lateArrivalGraceHours ?? 2;
    const lateThresholdHour = checkInHour + lateArrivalGraceHours;

    return now.getHours() >= lateThresholdHour || Boolean(reservation.isLateArrival);
  }

  return false;
}

/**
 * Checks if frontdesk should prompt for No-Show.
 * Triggers if past check-in date OR 6 hours after standard Check-in time.
 */
export function shouldPromptNoShow(reservation, propertyOperations = null, now = new Date()) {
  const status = (reservation.status || '').toLowerCase();
  if (status !== 'confirmed' && status !== 'checkin' && status !== '') return false;

  const todayStr = getLocalDateStr(now);
  const checkinDate = reservation.checkIn || reservation.checkin || '';
  if (!checkinDate) return false;

  if (checkinDate < todayStr) return true;

  if (checkinDate === todayStr) {
    const rawCheckIn = propertyOperations?.checkIn || propertyOperations?.checkInTime || reservation.checkInTime || '';
    const checkInHour = getHourFromTime(rawCheckIn);
    const noShowBufferHours = propertyOperations?.noShowBufferHours ?? 6;
    const noShowThresholdHour = checkInHour + noShowBufferHours;

    return now.getHours() >= noShowThresholdHour;
  }

  return false;
}

export function isMissedArrival(reservation, now = new Date()) {
  const status = (reservation.status || '').toLowerCase();
  if (status !== 'confirmed' && status !== 'checkin' && status !== '') return false;

  const todayStr = getLocalDateStr(now);
  const checkinDate = reservation.checkIn || reservation.checkin || '';
  return Boolean(checkinDate && checkinDate < todayStr);
}
