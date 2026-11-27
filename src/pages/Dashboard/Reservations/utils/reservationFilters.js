export function getBookingDates(booking) {
  const rawIn = booking.checkIn || booking.checkin || booking.check_in || booking.checkInDate || "";
  const rawOut = booking.checkOut || booking.checkout || booking.check_out || booking.checkOutDate || "";

  const checkIn = typeof rawIn === "string" ? rawIn.split("T")[0].trim() : "";
  const checkOut = typeof rawOut === "string" ? rawOut.split("T")[0].trim() : "";

  return { checkIn, checkOut };
}

export function getTodayStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function matchesDateFilter(booking, dateFilter, todayStr = getTodayStr()) {
  if (!dateFilter || dateFilter === "all") return true;

  const { checkIn, checkOut } = getBookingDates(booking);
  if (!checkIn && !checkOut) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, "0");
  const monthPrefix = `${currentYear}-${currentMonthStr}`;
  const firstDayOfMonth = `${currentYear}-${currentMonthStr}-01`;
  const lastDay = new Date(currentYear, now.getMonth() + 1, 0).getDate();
  const lastDayOfMonth = `${currentYear}-${currentMonthStr}-${String(lastDay).padStart(2, "0")}`;
  const currentYearStr = String(currentYear);

  if (dateFilter === "today") {
    // Arrival today, departure today, or active stay overlapping today
    return (
      (checkIn <= todayStr && (checkOut ? checkOut >= todayStr : checkIn === todayStr)) ||
      checkOut === todayStr
    );
  }

  if (dateFilter === "upcoming") {
    return checkIn > todayStr;
  }

  if (dateFilter === "month") {
    return (
      checkIn.startsWith(monthPrefix) ||
      checkOut.startsWith(monthPrefix) ||
      (checkIn <= lastDayOfMonth && (checkOut ? checkOut >= firstDayOfMonth : checkIn >= firstDayOfMonth))
    );
  }

  if (dateFilter === "year") {
    return checkIn.startsWith(currentYearStr) || checkOut.startsWith(currentYearStr);
  }

  return true;
}

export function getDateFilterCounts(reservationsList = []) {
  const todayStr = getTodayStr();
  const counts = {
    today: 0,
    upcoming: 0,
    month: 0,
    year: 0,
    all: reservationsList.length
  };

  for (const b of reservationsList) {
    if (matchesDateFilter(b, "today", todayStr)) counts.today++;
    if (matchesDateFilter(b, "upcoming", todayStr)) counts.upcoming++;
    if (matchesDateFilter(b, "month", todayStr)) counts.month++;
    if (matchesDateFilter(b, "year", todayStr)) counts.year++;
  }

  return counts;
}

export function filterReservations(
  reservationsList = [],
  {
    searchTerm = "",
    channelFilter = "all",
    statusFilter = "all",
    dateFilter = "today",
  }
) {
  const query = searchTerm.trim().toLowerCase();
  const normalizedStatus = (statusFilter || "all").trim().toLowerCase();
  const normalizedChannel = (channelFilter || "all").trim().toLowerCase();
  const todayStr = getTodayStr();

  const filtered = reservationsList.filter((booking) => {
    // 1. Date Filter
    if (!matchesDateFilter(booking, dateFilter, todayStr)) {
      return false;
    }

    // 2. Search Query Filter
    const guestName = booking.guestName?.toLowerCase() || "";
    const bookingId = booking.id ? String(booking.id).toLowerCase() : "";
    const propertyName = booking.propertyName?.toLowerCase() || "";
    const guestPhone = booking.guestPhone || "";

    const totalAmount =
      booking.totalAmount != null
        ? String(booking.totalAmount)
        : "";

    const amountPaid =
      booking.amountPaid != null
        ? String(booking.amountPaid)
        : "";

    const matchSearch =
      query === "" ||
      guestName.includes(query) ||
      bookingId.includes(query) ||
      propertyName.includes(query) ||
      guestPhone.includes(query) ||
      totalAmount.includes(query) ||
      amountPaid.includes(query);

    if (!matchSearch) {
      return false;
    }

    // 3. Status Filter
    const bookingStatus = (booking.status || "").trim().toLowerCase();
    const matchStatus =
      normalizedStatus === "all" ||
      bookingStatus === normalizedStatus ||
      (normalizedStatus === "confirmed" && (bookingStatus === "confirmed" || bookingStatus === "confirm")) ||
      (normalizedStatus === "checkedin" && (bookingStatus === "checkedin" || bookingStatus === "checkin" || bookingStatus === "checked_in")) ||
      (normalizedStatus === "checkedout" && (bookingStatus === "checkedout" || bookingStatus === "checkout" || bookingStatus === "checked_out"));

    if (!matchStatus) {
      return false;
    }

    // 4. Channel Filter
    const bookingSource = (booking.bookingSource || "").trim().toLowerCase();
    const matchChannel =
      normalizedChannel === "all" ||
      bookingSource === normalizedChannel;

    return matchChannel;
  });

  // Priority Sort:
  // 1. In-House / Checked-In guests float to top priority (Rank 1)
  // 2. Confirmed / Incoming arrivals (Rank 2)
  // 3. Checked-Out / Completed stays (Rank 3)
  // 4. Cancelled / No-Show records (Rank 4)
  // Tie-breaker: Most recent booking first (highest dbId / newest ID)
  return filtered.sort((a, b) => {
    const getStatusRank = (res) => {
      const s = (res.status || "").trim().toLowerCase();
      if (s === "checkedin" || s === "checkin" || s === "checked_in" || s === "inhouse" || s === "occupied") return 1;
      if (s === "confirmed" || s === "confirm") return 2;
      if (s === "checkedout" || s === "checkout" || s === "checked_out") return 3;
      return 4;
    };

    const rankA = getStatusRank(a);
    const rankB = getStatusRank(b);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // Recency tie-breaker: highest numeric dbId or booking number first
    const idA = Number(a.dbId || String(a.id || "").replace(/[^0-9]/g, "")) || 0;
    const idB = Number(b.dbId || String(b.id || "").replace(/[^0-9]/g, "")) || 0;
    if (idA !== idB) {
      return idB - idA;
    }

    // Fallback: Check-in date descending
    const dateA = a.checkIn || "";
    const dateB = b.checkIn || "";
    return dateB.localeCompare(dateA);
  });
}

export function filterGuests(
  guestsList = [],
  {
    searchQuery = "",
    filterTab = "all",
  }
) {
  const query = searchQuery.trim().toLowerCase();

  return guestsList.filter((guest) => {
    const name = guest.name?.toLowerCase() || "";
    const phone = guest.phone || "";
    const email = guest.email?.toLowerCase() || "";

    const matchSearch =
      query === "" ||
      name.includes(query) ||
      phone.includes(query) ||
      email.includes(query);

    if (!matchSearch) {
      return false;
    }

    if (filterTab === "returning") {
      const isReturning =
        guest.status === "returning" ||
        guest.totalStays > 1;

      return isReturning;
    }

    return true;
  });
}