/**
 * Time Formatting Utility for StayOps (12-Hour AM/PM & 24-Hour conversions)
 */

export const CHECKIN_TIME_OPTIONS = [
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
  "11:00 PM"
];

export const CHECKOUT_TIME_OPTIONS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM"
];

/**
 * Converts any time string ("14:00", "14:00:00", "2:00 PM", 14) to 12-Hour AM/PM format (e.g. "2:00 PM")
 */
export function formatTime12Hr(timeStr) {
  if (!timeStr) return "2:00 PM";

  // If already contains AM or PM
  const upper = String(timeStr).trim().toUpperCase();
  if (upper.includes("AM") || upper.includes("PM")) {
    return upper;
  }

  // Parse "14:00" or "14:00:00"
  const parts = upper.split(":");
  if (parts.length < 1) return "2:00 PM";

  let hour = parseInt(parts[0], 10);
  let minutes = parts[1] ? parseInt(parts[1], 10) : 0;

  if (isNaN(hour)) return "2:00 PM";

  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;

  const minFormatted = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hour}:${minFormatted} ${period}`;
}

/**
 * Converts 12-Hour AM/PM string ("2:00 PM") to 24-Hour "14:00" string
 */
export function parseTime24Hr(timeStr) {
  if (!timeStr) return "14:00";

  const upper = String(timeStr).trim().toUpperCase();
  const match = upper.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/i);
  if (!match) return "14:00";

  let hour = parseInt(match[1], 10);
  let minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3];

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  const hrFormatted = hour < 10 ? `0${hour}` : `${hour}`;
  const minFormatted = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return `${hrFormatted}:${minFormatted}`;
}

/**
 * Extract numeric 24-hour integer (0-23) from any time representation
 */
export function getHourFromTime(timeStr) {
  if (!timeStr) return 14;

  const upper = String(timeStr).trim().toUpperCase();
  const match = upper.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/i);
  if (!match) {
    const parsedInt = parseInt(upper, 10);
    return isNaN(parsedInt) ? 14 : parsedInt;
  }

  let hour = parseInt(match[1], 10);
  const period = match[3];

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour;
}
