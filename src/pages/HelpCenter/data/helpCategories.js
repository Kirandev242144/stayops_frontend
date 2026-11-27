
/* -------------------------------------------------------------------------
   CATEGORIES
   ------------------------------------------------------------------------- */
   export const helpCategories = [
    {
      id: "getting-started",
      title: "Getting Started & Onboarding",
      description:
        "Set up your property, add room inventory, invite caretaker staff, and connect your first OTA channel in under 30 minutes.",
      icon: "FiCheckCircle",
      color: "#04B3C0",
      articleCount: 3,
      popular: true,
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "caretaker-ops",
      title: "Caretaker Operations & Ground Workflows",
      description:
        "Low-text, Android-first mobile workflows for housekeeping photo evidence, guest check-in/out, petty cash logging, and meal billing.",
      icon: "FiSmartphone",
      color: "#FF6B35",
      articleCount: 4,
      popular: true,
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "channel-manager",
      title: "Channel Manager & OTA Sync",
      description:
        "Two-way real-time sync with Airbnb, Booking.com, Agoda, and MakeMyTrip. Row-level locking prevents double-bookings across all channels.",
      icon: "FiRefreshCw",
      color: "#8B5CF6",
      articleCount: 3,
      popular: true,
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "whatsapp-storefront",
      title: "WhatsApp Commerce & Direct Booking",
      description:
        "Meta Cloud API powered inquiry-to-booking automation, Razorpay/Cashfree payment links, Click-to-Chat QR codes, and lite web storefronts.",
      icon: "FiMessageSquare",
      color: "#10B981",
      articleCount: 3,
      popular: true,
      image:
        "https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "owner-dashboard",
      title: "Owner PMS & Revenue Dashboard",
      description:
        "Multi-calendar views, guest master folio, net revenue & ADR reports, expense tracker, and drag-to-block room management.",
      icon: "FiBarChart2",
      color: "#EC4899",
      articleCount: 3,
      popular: true,
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "billing-subscriptions",
      title: "Billing, Plans & Entitlements",
      description:
        "Lite (₹1,499), Pro Growth (₹2,999), and Multi-Property Hub (₹5,999) plan details, room caps, annual discounts, and GST invoicing.",
      icon: "FiCreditCard",
      color: "#F59E0B",
      articleCount: 3,
      popular: false,
      image:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "direct-storefront",
      title: "Direct Storefront & Custom Domains",
      description:
        "Auto-generated property web pages, hero image galleries, SEO metadata, embedded Razorpay checkout widget, and CNAME custom domain mapping.",
      icon: "FiGlobe",
      color: "#06B6D4",
      articleCount: 2,
      popular: false,
      image:
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "security-rbac",
      title: "Security, RBAC & Audit Logs",
      description:
        "Tenant-isolated database architecture, role-based access control for owners/managers/caretakers, immutable audit trails, and JWT session security.",
      icon: "FiShield",
      color: "#3B82F6",
      articleCount: 3,
      popular: false,
      image:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80",
    },
  ];
  
  
  export const helpArticles = [
    /* ====================================================================
       GETTING STARTED & ONBOARDING (3 articles)
       ==================================================================== */
    {
      id: "property-setup-wizard",
      categoryId: "getting-started",
      title: "Creating Your First Property & Adding Room Inventory",
      summary:
        "Step-by-step walkthrough of the property setup wizard — add address, upload hero photos, define room types, and set base rates.",
      readTime: "4 min read",
      views: 4200,
      helpfulCount: 1120,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Creating Your First Property
  
  After signing up for StayOps India, the setup wizard guides you through property configuration in three simple steps.
  
  ## Step 1 — Property Details
  
  1. **Property Name & Type**: Enter your homestay or villa name (e.g. *Sunbird Villa, Coorg*). Select type: Homestay, Villa, Apartment, or Farmstay.
  2. **Address & Map Pin**: Type your address or drop a pin on the embedded Google Map. This powers your storefront location card.
  3. **Hero Photos**: Upload 5–10 high-resolution images. The first image becomes your storefront hero banner. Supported formats: JPG, PNG, WebP (max 10 MB each).
  
  > [!TIP]
  > Use landscape orientation photos shot in natural daylight. Properties with 8+ photos receive 40% more direct inquiries according to StayOps analytics.
  
  ## Step 2 — Room Inventory
  
  1. Tap **Add Room Type** (e.g. *Deluxe Double*, *Garden Suite*, *Dormitory Bed*).
  2. Set **quantity** (how many physical rooms of this type), **max occupancy**, and **base rate** (₹/night).
  3. Add room-specific amenities: AC, Wi-Fi, TV, Balcony, Attached Bathroom, etc.
  
  > [!IMPORTANT]
  > Your subscription plan determines room caps: Lite allows up to 3 rooms, Pro Growth is unlimited, Multi-Property Hub supports up to 5 properties.
  
  ## Step 3 — Publish
  
  Review your listing preview, then tap **Publish Property**. StayOps auto-generates your storefront URL:
  - Lite Plan: \`yourproperty.stayops.in\`
  - Pro Growth & above: Map your own custom domain (e.g. \`www.coorgheavenlystay.com\`)
  
  "Setting up your first property takes under 15 minutes. Most owners complete it during their morning chai."
      `,
    },
    {
      id: "invite-caretaker-staff",
      categoryId: "getting-started",
      title: "Inviting Caretakers & Assigning Property Access",
      summary:
        "How to create staff accounts for on-ground caretakers and house managers with role-scoped mobile app access.",
      readTime: "3 min read",
      views: 2850,
      helpfulCount: 720,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Inviting Your Ground Staff
  
  StayOps separates roles so your caretaker sees only what they need — task lists, housekeeping checklists, and check-in flows — without access to financial data.
  
  ## How to Invite a Caretaker
  
  1. Go to **Settings → Staff Management → Invite Staff**.
  2. Enter the caretaker's **mobile number** (they'll receive an SMS with download link + OTP login).
  3. Select role: **Caretaker** or **House Manager**.
  4. Assign them to one or more properties.
  
  > [!IMPORTANT]
  > Caretakers can ONLY see properties assigned to them. Financial data (revenue, ADR, payouts) is completely hidden from their view.
  
  ## What Your Caretaker Sees After Login
  
  The Caretaker App opens to a **task-based home screen** showing:
  - Today's Check-ins (arriving guests)
  - Today's Check-outs (departing guests)
  - Rooms Needing Cleaning (color-coded by priority: red = urgent, yellow = standard)
  
  "Your caretaker Raju in Coorg doesn't need to see your ₹2.4 lakh monthly revenue. He needs to see which rooms to clean by 2 PM."
  
  ## Removing or Deactivating Staff
  
  Go to **Settings → Staff Management**, tap on the staff member, and select **Deactivate**. Their mobile session terminates immediately and all JWT tokens are revoked.
      `,
    },
    {
      id: "connect-first-ota",
      categoryId: "getting-started",
      title: "Connecting Your First OTA Channel (Airbnb / Booking.com)",
      summary:
        "Link your Airbnb or Booking.com listing to StayOps for automatic two-way calendar and rate synchronization.",
      readTime: "5 min read",
      views: 3600,
      helpfulCount: 940,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Connecting Your First OTA
  
  StayOps Channel Manager supports two sync modes depending on the OTA:
  
  - **API Mode (Real-Time)**: Airbnb, Booking.com — instant sync within 3 seconds
  - **iCal Mode (Polling)**: Agoda, MakeMyTrip/Goibibo — syncs every 5 minutes
  
  ## Connecting Airbnb (API Mode)
  
  1. Navigate to **Channel Manager → Add Channel → Airbnb**.
  2. Click **Connect Airbnb Account** — this opens an OAuth consent screen.
  3. Log into your Airbnb host account and grant StayOps calendar + booking access.
  4. Map your StayOps room types to your Airbnb listing rooms.
  5. Click **Enable Sync** — existing Airbnb bookings will auto-import within 60 seconds.
  
  > [!TIP]
  > Keep your Airbnb API connection active by not changing your Airbnb password without re-authenticating in StayOps.
  
  ## Connecting MakeMyTrip (iCal Mode)
  
  1. Navigate to **Channel Manager → Add Channel → MakeMyTrip**.
  2. Copy the **iCal export URL** from your MakeMyTrip extranet.
  3. Paste it into StayOps and set the poll interval (default: every 5 minutes).
  4. StayOps also generates an iCal feed URL — paste this back into MakeMyTrip's calendar import section.
  
  > [!NOTE]
  > iCal sync is one-directional per feed. StayOps creates a two-way bridge by maintaining both an import and export feed.
  
  "Once your first channel is connected, every booking that comes in automatically blocks dates across ALL your channels. No more manual calendar juggling."
      `,
    },
  
    /* ====================================================================
       CARETAKER OPERATIONS (4 articles)
       ==================================================================== */
    {
      id: "caretaker-photo-ready-status",
      categoryId: "caretaker-ops",
      title: "Housekeeping Checklist & Required Photo Verification",
      summary:
        "Why a room cannot be marked 'Ready' without attaching photo evidence — and how to complete the full cleaning workflow.",
      readTime: "3 min read",
      views: 1420,
      helpfulCount: 389,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Housekeeping Photo Verification
  
  Remote property owners live in metro cities while their homestays in Coorg, Manali, or Lonavala are run by ground staff. Photo evidence bridges the trust gap and provides real-time operational visibility.
  
  ## Room Status Lifecycle
  
  The room flows through these stages:
  - **Dirty** → Guest checked out, room needs cleaning
  - **In Progress** → Caretaker has started cleaning
  - **Photo Uploaded** → At least 1 photo per section captured
  - **Ready** → Owner notified, room available for next guest
  
  > [!IMPORTANT]
  > The StayOps app BLOCKS the "Mark as Ready" button until at least 1 photo per room section (bed area, bathroom) is uploaded. This is a system-level enforcement, not optional.
  
  "A picture of a freshly made bed is worth a thousand WhatsApp messages between owner and caretaker."
  
  ## Step-by-Step Workflow
  
  1. **Open the Caretaker App** → Tap your assigned property from the home screen.
  2. **Select the Room** → Tap the room marked **Dirty** or **In Progress**.
  3. **Complete Checklist Items**:
     - Fresh bedsheets and pillow covers installed
     - Bathroom sanitized & towels replaced
     - Water jug filled & complimentary tea tray replenished
     - Dustbin emptied, floor mopped
  4. **Capture Photos** → Tap the camera icon, snap the made bed and clean bathroom.
  5. **Mark as Ready** → Button unlocks after photo upload. Owner gets an instant push notification.
  
  > [!TIP]
  > If your internet is weak, the app saves photos locally and syncs them automatically when connectivity resumes. Don't worry about losing your work!
      `,
    },
    {
      id: "guest-checkin-checkout-flow",
      categoryId: "caretaker-ops",
      title: "Guest Check-In & Check-Out Procedures",
      summary:
        "Verify arriving guests via OTP or booking reference, capture ID scans, generate welcome packets, and process departures.",
      readTime: "4 min read",
      views: 1850,
      helpfulCount: 485,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Guest Check-In & Check-Out
  
  The caretaker app guides you through a structured process for both arrivals and departures, ensuring no steps are missed.
  
  ## Check-In Flow
  
  1. **Guest Arrives** → Open the **Today's Check-ins** section on your home screen.
  2. **Verify Identity** → Ask the guest for their booking reference number OR the OTP sent to their phone.
  3. **Scan Guest ID** → Use the app's camera to capture the guest's Aadhaar card or passport. This is stored securely and visible only to the property owner.
  4. **Generate Welcome Packet** → The app auto-generates a digital welcome card with Wi-Fi password, house rules, emergency contacts, and local area recommendations.
  5. **Confirm Check-In** → Tap **Mark as Checked In**. The owner receives a push notification with the guest's name, photo, and check-in timestamp.
  
  > [!TIP]
  > Pro Tip: Some owners configure a WhatsApp welcome message that auto-sends to the guest when you mark them as checked in. Ask your property owner if this is enabled!
  
  "Checking in a guest takes under 2 minutes. The app handles the paperwork so you can focus on the hospitality."
  
  ## Check-Out Flow
  
  1. **Guest Departs** → Open **Today's Check-outs**.
  2. **Room Inspection** → Walk through the room and note any damages or missing items.
  3. **Confirm Check-Out** → Tap **Mark as Checked Out**. This automatically:
     - Changes room status to **Dirty** (triggers housekeeping workflow)
     - Finalizes the guest's master folio (all meals, add-ons, petty cash)
     - Sends a post-stay feedback request to the guest via WhatsApp (if configured)
      `,
    },
    {
      id: "petty-cash-meal-logging",
      categoryId: "caretaker-ops",
      title: "Logging Petty Cash Spends & Guest Meal Billing",
      summary:
        "Record grocery purchases, fuel, meal charges, and transport expenses with receipt photo uploads for owner approval.",
      readTime: "3 min read",
      views: 980,
      helpfulCount: 275,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Petty Cash & Meal Billing
  
  Ground staff handle daily cash for groceries, cooking gas, fuel, and guest meals. StayOps provides a simple ledger that keeps everything transparent between caretaker and owner.
  
  ## Logging a Petty Cash Expense
  
  1. Open the app → Tap **Petty Cash** from the bottom menu.
  2. Tap **+ Add Expense**.
  3. Enter: Amount (e.g. ₹450), Category (Groceries / Fuel / Supplies / Other), Description (e.g. "Vegetables & milk for guest breakfast").
  4. **Snap a receipt photo** → This is mandatory. No receipt = no approval.
  5. Submit → Owner receives a push notification to Approve or Reject.
  
  > [!NOTE]
  > All petty cash entries require a receipt photo upload. This is a system requirement and cannot be bypassed.
  
  "Your owner sitting in Bangalore can approve your ₹350 vegetable bill from Madikeri within seconds."
  
  ## Recording Guest Meal Charges
  
  1. Tap **Active Stays** on the home screen.
  2. Select the guest's room (e.g. *Villa Sunbird — Room 102*).
  3. Tap **Add Meal Charge**.
  4. Enter items or lump-sum amount (e.g. ₹850 for Dinner — Chicken curry, rice, dal, salad).
  5. The charge appends to the guest's **master folio** automatically and shows up on their checkout invoice.
  
  ## Daily Ledger View
  
  The **Petty Cash Ledger** shows a running daily total with all entries, receipt thumbnails, and approval status (Pending / Approved / Rejected). Weekly auto-reconciliation prompts help you and the owner stay aligned.
      `,
    },
    {
      id: "offline-sync-android-app",
      categoryId: "caretaker-ops",
      title: "Offline Mode & Background Sync for Low Connectivity Areas",
      summary:
        "How the Android-first caretaker app works without internet — local caching, photo queue, and automatic background sync.",
      readTime: "2 min read",
      views: 1120,
      helpfulCount: 310,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Working Offline
  
  Many Indian homestays are in remote hill stations or rural areas with spotty 2G/3G connectivity. The StayOps Caretaker App is built Android-first with full offline support.
  
  ## What Works Offline
  
  - ✅ Viewing today's check-ins and check-outs
  - ✅ Completing housekeeping checklists
  - ✅ Taking photos (stored locally)
  - ✅ Logging petty cash entries
  - ✅ Recording meal charges
  
  > [!TIP]
  > All your work is saved locally on your phone. Nothing is lost even if you have zero signal all day.
  
  ## How Background Sync Works
  
  1. You complete your tasks normally — the app saves everything to your phone's local storage.
  2. A small **sync indicator** (circular arrow icon) shows how many items are queued.
  3. When your phone reconnects to Wi-Fi or mobile data, the app automatically uploads everything in the background.
  4. Once synced, the owner sees all your updates with the original timestamps (not the sync time).
  
  "Your caretaker in a Himalayan homestay can complete their entire morning routine offline. When they walk to the village market and get 4G signal, everything syncs in seconds."
      `,
    },
  
    /* ====================================================================
       CHANNEL MANAGER & OTA SYNC (3 articles)
       ==================================================================== */
    {
      id: "ical-api-sync-resolution",
      categoryId: "channel-manager",
  
      title: "API vs iCal Sync Modes — How Real-Time OTA Sync Works",
      summary:
        "Understanding the two sync modes: real-time API for Airbnb/Booking.com and iCal polling for Agoda/MakeMyTrip.",
      readTime: "5 min read",
      views: 2150,
      helpfulCount: 612,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
      content: `
  # API vs iCal Sync Modes
  
  StayOps Channel Manager uses two different sync strategies depending on what each OTA platform supports.
  
  ## API Mode (Real-Time) — Airbnb & Booking.com
  
  These platforms provide direct developer APIs, enabling:
  - **Instant inventory lock** within 3 seconds of a booking
  - **Webhook notifications** for booking creation, modification, and cancellation
  - **Two-way rate push** — set your base rate in StayOps, and it pushes to Airbnb/Booking.com automatically
  - **Minimum stay rules** synced across platforms
  
  > [!TIP]
  > Keep your Airbnb and Booking.com API keys up to date in Settings → Channel Manager → API Credentials. Expired keys will fallback to iCal mode.
  
  ## iCal Mode (Polling) — Agoda & MakeMyTrip
  
  These platforms support calendar feeds but not real-time APIs:
  - StayOps **imports** their iCal feed every 5 minutes (configurable: 5, 10, 15, or 30 min)
  - StayOps **exports** its own iCal feed that you paste into the OTA's calendar import
  - This creates a two-way bridge, but with a small delay window
  
  > [!IMPORTANT]
  > The 5-minute polling gap means there's a theoretical window for double-bookings on iCal channels. StayOps handles this with timestamp-based conflict resolution (see the Double-Booking Prevention article).
  
  "API mode is like a live phone call — instant. iCal mode is like email — reliable but with a few minutes delay."
      `,
    },
    {
      id: "double-booking-prevention",
      categoryId: "channel-manager",
  
      title: "Double-Booking Prevention & Conflict Resolution Logic",
      summary:
        "How row-level database locking and millisecond timestamp comparison prevent overlapping reservations across OTAs.",
      readTime: "4 min read",
      views: 3200,
      helpfulCount: 890,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Double-Booking Prevention
  
  The biggest fear of every multi-channel property owner: two guests booked the same room for the same dates on different platforms. StayOps eliminates this with database-level locking.
  
  ## How Row-Level Locking Works
  
  1. **Booking Arrives** from any channel (Airbnb, Booking.com, direct, WhatsApp).
  2. StayOps issues a **database row-level lock** on the specific room-date combination.
  3. Within 3 seconds, a **Block event** is pushed to ALL connected channels.
  4. Any subsequent booking attempt for the same room-dates is rejected.
  
  "Think of it like a traffic signal. The first car (booking) gets the green light. All other cars on all other roads (OTAs) instantly get a red light."
  
  ## Conflict Resolution for iCal Channels
  
  Since iCal has a 5-minute polling gap, two bookings could theoretically arrive within that window. StayOps handles this:
  
  1. **Timestamp Comparison** — Bookings are compared down to the millisecond.
  2. **Earlier booking wins** — The first confirmed booking is accepted.
  3. **Later booking auto-rejected** — The guest receives an automated message with alternative available dates.
  4. **Owner notified** — A conflict alert appears in your dashboard with full details.
  
  > [!NOTE]
  > In 18 months of operation, less than 0.2% of bookings across StayOps properties have triggered the conflict resolution flow. The system works.
      `,
    },
    {
      id: "rate-push-blocked-dates",
      categoryId: "channel-manager",
  
      title: "Pushing Rates & Blocking Dates Across All Channels",
      summary:
        "Set your base rate once in StayOps and push it to every connected OTA. Block dates for personal use or maintenance.",
      readTime: "3 min read",
      views: 1750,
      helpfulCount: 480,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Rate Push & Date Blocking
  
  Managing different rates on 4 different OTA extranets is a nightmare. StayOps lets you set your rate once and push it everywhere.
  
  ## Setting & Pushing Rates
  
  1. Go to **PMS Dashboard → Room Types → Select Room**.
  2. Set your **Base Rate** (₹/night).
  3. Optionally set **Weekend Rate**, **Holiday Rate**, and **Long Stay Discount** (7+ nights).
  4. Toggle **Push to Channels** → StayOps sends the updated rate to all connected OTAs.
  
  > [!TIP]
  > Use the bulk rate calendar to set different rates for specific date ranges (e.g. ₹8,000/night during Diwali week, ₹4,500/night on weekdays in January).
  
  ## Blocking Dates
  
  Need to block rooms for personal use, maintenance, or a private event?
  
  1. Go to the **Multi-Calendar View**.
  2. **Drag across the dates** you want to block on the specific room row.
  3. Select reason: Personal Use, Maintenance, or Other.
  4. The block propagates to ALL channels within the sync window (instant for API, up to 5 min for iCal).
  
  "Block your villa for your anniversary weekend with one drag gesture. Airbnb, Booking.com, Agoda — all blocked automatically."
      `,
    },
  
    /* ====================================================================
       WHATSAPP COMMERCE & DIRECT BOOKING (3 articles)
       ==================================================================== */
    {
      id: "whatsapp-inquiry-booking",
      categoryId: "whatsapp-storefront",
  
      title: "WhatsApp Inquiry-to-Booking Automation Flow",
      summary:
        "The complete 6-step flow: guest message → date capture → availability check → photo quote → Razorpay payment → voucher generation.",
      readTime: "5 min read",
      views: 1890,
      helpfulCount: 540,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=1200&q=80",
      content: `
  # WhatsApp Inquiry-to-Booking Flow
  
  Indian homestays receive over 60% of direct inquiries via WhatsApp. StayOps integrates with Meta Cloud API (official WhatsApp Business API) to automate the entire journey from first message to confirmed booking.
  
  ## The 6-Step Automation
  
  1. **Guest Sends Message** → They scan your Click-to-Chat QR code (on Instagram, Google Business, or printed brochure) or click your WhatsApp link.
  
  2. **Bot Captures Details** → The automated assistant asks:
     - "What dates are you looking for?"
     - "How many guests (adults + children)?"
     - "Any room preference?"
  
  3. **Live Availability Check** → Bot queries your PMS calendar in real-time. If the dates are blocked or booked, it suggests the nearest available dates.
  
  4. **Photo Quote Card** → Bot sends a rich media card with:
     - Property photos (auto-selected from your gallery)
     - Itemized price breakdown (room rate × nights + taxes)
     - Amenity highlights
  
  5. **Payment Link** → A secure Razorpay (or Cashfree) payment link is generated and sent inline in the chat.
  
  6. **Booking Confirmed** → On successful payment:
     - Booking auto-created in PMS
     - All OTA calendars updated (dates blocked)
     - Confirmation voucher sent to guest via WhatsApp
     - Owner + caretaker notified
  
  > [!TIP]
  > Place your Click-to-Chat QR code everywhere: Instagram bio link, Google Business Profile, printed brochures at local tourist spots, and even on the welcome card at your property for repeat bookings.
  
  "From first WhatsApp message to confirmed booking with payment — average time: 4 minutes."
      `,
    },
    {
      id: "whatsapp-message-templates",
      categoryId: "whatsapp-storefront",
  
      title: "WhatsApp Message Templates & Automated Notifications",
      summary:
        "Pre-approved message templates for booking confirmations, check-in reminders, payment receipts, and post-stay feedback.",
      readTime: "3 min read",
      views: 1340,
      helpfulCount: 380,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=1200&q=80",
      content: `
  # WhatsApp Message Templates
  
  Meta requires pre-approved templates for outbound WhatsApp Business messages. StayOps provides 7 ready-to-use templates that you can customize.
  
  ## Available Templates
  
  1. **Welcome Greeting** — Sent when a guest first messages your WhatsApp number.
  2. **Availability Response** — Confirms dates are available or suggests alternatives.
  3. **Quote Card** — Property photos + itemized pricing.
  4. **Payment Link** — Razorpay/Cashfree secure payment URL.
  5. **Booking Confirmation** — Voucher with booking ID, dates, guest count, and property address.
  6. **Check-In Reminder (T-1 Day)** — Sent 24 hours before arrival with directions, Wi-Fi password, and caretaker contact.
  7. **Post-Stay Feedback** — Sent after checkout asking for a Google Review or direct feedback.
  
  > [!NOTE]
  > Templates must be approved by Meta before use. StayOps pre-submits these templates during your account setup. Custom template approval takes 24-48 hours.
  
  ## Customizing Templates
  
  Go to **Settings → WhatsApp → Message Templates** to:
  - Edit the greeting message text
  - Add your property's specific check-in instructions
  - Include local area recommendations in the pre-arrival message
  - Customize the feedback request with your Google Review link
  
  "The T-1 day check-in reminder alone has reduced 'Where is your property?' calls by 70% for our early adopters."
      `,
    },
    {
      id: "direct-storefront-setup",
      categoryId: "whatsapp-storefront",
  
      title: "Setting Up Your Direct Booking Storefront Page",
      summary:
        "Auto-generate a mobile-optimized property page with photo gallery, amenities, location map, and embedded Razorpay checkout.",
      readTime: "3 min read",
      views: 2100,
      helpfulCount: 590,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Direct Booking Storefront
  
  Stop paying 15-20% OTA commissions for guests who already know your property. StayOps auto-generates a beautiful, mobile-optimized property page that lets guests book and pay directly.
  
  ## What Your Storefront Includes
  
  - **Hero Image Gallery** — Full-width slideshow from your uploaded photos
  - **Room Types & Pricing** — Live availability calendar with real-time rates
  - **Amenity Icons** — Wi-Fi, AC, Pool, Parking, Kitchen, etc.
  - **Location Map** — Embedded Google Maps with directions
  - **Book Now Widget** — Date picker + guest count + instant Razorpay checkout (no redirect)
  - **SEO Metadata** — Auto-generated title tags, meta descriptions, and Open Graph tags
  
  ## Your Storefront URL
  
  - **Lite Plan**: \`sunbird-villa.stayops.in\` (auto-generated subdomain)
  - **Pro Growth & above**: Map your own domain via CNAME (e.g. \`www.coorgheavenlystay.com\`)
  
  > [!TIP]
  > Share your storefront link in your Instagram bio, WhatsApp status, Google Business Profile, and email signature. Every direct booking saves you 15-20% in OTA commissions.
  
  "One property owner in Goa saved ₹3.2 lakhs in OTA commissions in 6 months by routing just 30% of bookings through their StayOps storefront."
      `,
    },
  
    /* ====================================================================
       OWNER PMS & REVENUE DASHBOARD (3 articles)
       ==================================================================== */
    {
      id: "multi-calendar-view",
      categoryId: "owner-dashboard",
  
      title: "Multi-Calendar View & Drag-to-Block Room Management",
      summary:
        "Unified timeline view across all rooms and channels with drag-to-block holds and booking detail drawers.",
      readTime: "4 min read",
      views: 2800,
      helpfulCount: 750,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Multi-Calendar View
  
  The calendar is the heart of your PMS dashboard. It shows every room, every booking, and every blocked date across all channels in a single unified timeline.
  
  ## Understanding the Calendar
  
  - **Rows** = Your room types (Deluxe Double, Garden Suite, etc.)
  - **Columns** = Dates (scrollable left/right, default: 30-day view)
  - **Color Blocks** = Bookings (color-coded by source channel)
    - 🟢 Green = Direct booking (WhatsApp/Storefront)
    - 🔵 Blue = Airbnb
    - 🟣 Purple = Booking.com
    - 🟠 Orange = Agoda/MakeMyTrip
    - ⬛ Grey = Manual block (personal use/maintenance)
  
  ## Drag-to-Block
  
  Need to block dates? Simply **click and drag** across the date range on any room row. Select a reason (Personal Use, Maintenance, Other) and confirm. The block syncs to all OTAs automatically.
  
  ## Booking Detail Drawer
  
  Click any booking block to open the **slide-over detail panel** showing:
  - Guest name, phone, headcount, special requests
  - Source channel and booking ID
  - Payment status (Paid / Partial / Pending)
  - Operational logs (housekeeping status, check-in/out timestamps)
  - Guest master folio (all charges)
  
  "I check my calendar every morning with my coffee. Green blocks make me happy — that's direct revenue with zero commission."
      `,
    },
    {
      id: "revenue-dashboard-adr",
      categoryId: "owner-dashboard",
  
      title: "Revenue Dashboard — Net Revenue, ADR & Occupancy Reports",
      summary:
        "Track net revenue after OTA commissions, average daily rate, RevPAR, occupancy percentage, and channel contribution breakdown.",
      readTime: "4 min read",
      views: 3400,
      helpfulCount: 920,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Revenue Dashboard
  
  The Revenue Dashboard gives you a clear financial picture of your property performance. No more maintaining Excel sheets.
  
  ## Key Metrics
  
  - **Net Revenue** — Total revenue after subtracting OTA commissions. Direct bookings show 100% revenue.
  - **ADR (Average Daily Rate)** — Total room revenue ÷ number of rooms sold.
  - **RevPAR (Revenue Per Available Room)** — Total revenue ÷ total available room-nights. Shows how well you're utilizing capacity.
  - **Occupancy %** — Rooms sold ÷ total rooms available × 100.
  - **Channel Contribution** — Pie chart showing what % of bookings came from each channel (Airbnb, Booking.com, Direct, WhatsApp, etc.)
  
  ## Date Range Filters
  
  View reports for: Today, This Week, This Month, Last Month, Custom Range, or Year-to-Date.
  
  > [!TIP]
  > The Channel Contribution pie chart is your most powerful tool for reducing OTA dependency. If 80% of your bookings come from Airbnb, focus on growing your direct channel (storefront + WhatsApp) to reduce commission costs.
  
  "One villa owner in Lonavala discovered that 40% of their Booking.com guests had actually found them on Instagram first. They redirected those guests to their direct storefront and saved ₹1.8 lakhs in 3 months."
  
  ## Expense Tracker
  
  Below the revenue metrics, the **Expense Tracker** shows:
  - Approved petty cash disbursements (with receipt photos)
  - Monthly utility summaries (electricity, water, gas)
  - Vendor payments (laundry, gardening, pool maintenance)
  - Net profit calculation (Revenue - Expenses - OTA Commissions)
      `,
    },
    {
      id: "guest-folio-invoice",
      categoryId: "owner-dashboard",
  
      title: "Guest Master Folio & Invoice Generation",
      summary:
        "Consolidated per-stay invoices with room charges, meal add-ons, transport, and petty cash pass-throughs. PDF export and WhatsApp share.",
      readTime: "3 min read",
      views: 1600,
      helpfulCount: 420,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Guest Master Folio
  
  Every guest stay generates a **master folio** — a consolidated invoice that captures every charge during their stay.
  
  ## What's Included in the Folio
  
  - **Room Charges** — Base rate × number of nights
  - **Meal Add-Ons** — Breakfast, lunch, dinner charges logged by caretaker
  - **Transport** — Airport pickup, local sightseeing, taxi charges
  - **Activities** — Trekking, plantation tour, cooking class bookings
  - **Petty Cash Pass-Throughs** — Specific guest requests (e.g. special groceries)
  - **Taxes** — GST calculated automatically based on room rate slab
  
  ## Viewing & Sharing the Folio
  
  1. Go to **Bookings → Select Booking → View Folio**.
  2. Review all line items.
  3. Options:
     - **Export as PDF** — Generates a professional invoice with your property logo
     - **Share via WhatsApp** — Sends the PDF directly to the guest's WhatsApp
     - **Email** — Sends to the guest's email address on file
  
  > [!NOTE]
  > The folio is finalized when the caretaker marks the guest as checked out. After finalization, no more charges can be added (but corrections can be requested through the owner dashboard).
  
  "No more handwritten bills or mental math at checkout. The folio calculates everything including GST automatically."
      `,
    },
  
    /* ====================================================================
       BILLING, PLANS & ENTITLEMENTS (3 articles)
       ==================================================================== */
    {
      id: "subscription-plans-limits",
      categoryId: "billing-subscriptions",
  
      title: "Subscription Tiers — Lite, Pro Growth & Multi-Property Hub",
      summary:
        "Complete comparison of Lite (₹1,499/mo), Pro Growth (₹2,999/mo), and Multi-Property Hub (₹5,999/mo) with room caps and feature matrix.",
      readTime: "4 min read",
      views: 3100,
      helpfulCount: 890,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Subscription Plans
  
  StayOps India operates on a pure SaaS subscription model — **zero booking commissions**. Unlike OTAs that take 15-20% per booking, you pay a flat monthly fee.
  
  ## Plan Comparison
  
  - **Lite Plan — ₹1,499/month**
    - 1 property, maximum 3 rooms
    - iCal-only OTA sync (5-minute polling)
    - Auto-generated subdomain (yourproperty.stayops.in)
    - Basic WhatsApp (inquiry capture only, no bot automation)
    - Caretaker app with housekeeping checklists
  
  - **Pro Growth — ₹2,999/month**
    - 1 property, unlimited rooms
    - Real-time API sync (Airbnb + Booking.com)
    - Custom domain mapping (e.g. www.yourvilla.com)
    - Full WhatsApp bot with automated booking + Razorpay payment links
    - Guest master folio with PDF export
    - Revenue dashboard with ADR & occupancy reports
  
  - **Multi-Property Hub — ₹5,999/month**
    - Up to 5 properties
    - Centralized multi-property dashboard
    - Portfolio-level roll-up reports
    - Staff management hub (assign caretakers across properties)
    - Priority support with dedicated account manager
  
  > [!TIP]
  > Annual billing saves you 2 months! Pro Growth Annual is ₹29,990/year instead of ₹35,988 (saving ₹5,998).
  
  "Zero commission means every rupee your guest pays goes to YOU, not to an OTA middleman."
      `,
    },
    {
      id: "room-cap-upgrade-flow",
      categoryId: "billing-subscriptions",
  
      title: "Room & Property Cap Limits — What Happens at the Cap?",
      summary:
        "Understanding soft alerts at 80% usage, hard blocks at cap limits, and the inline upgrade prompt flow.",
      readTime: "2 min read",
      views: 1200,
      helpfulCount: 340,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Room & Property Cap Enforcement
  
  Each plan has limits on the number of rooms (Lite: 3 rooms) or properties (Hub: 5 properties). Here's what happens as you approach and hit those limits.
  
  ## Soft Alert — 80% Usage
  
  When you've used 80% of your allowance (e.g. 2 out of 3 rooms on Lite), you'll see:
  - A yellow banner on your dashboard
  - A notification suggesting you explore the next plan tier
  
  ## Hard Block — At Cap
  
  When you try to add a room beyond your limit:
  - The "Add Room" button is disabled
  - An **inline upgrade prompt** appears showing the next plan's benefits and pricing
  - One-click upgrade via Razorpay — your new plan activates instantly
  
  > [!NOTE]
  > Upgrading is instant. Downgrading takes effect at the end of your current billing cycle to avoid disruption.
  
  "We designed the upgrade flow to feel helpful, not annoying. You'll see the prompt exactly when you need it."
      `,
    },
    {
      id: "gst-invoicing-razorpay",
      categoryId: "billing-subscriptions",
  
      title: "GST-Compliant Invoicing & Razorpay Subscription Billing",
      summary:
        "Automatic monthly GST invoices via Razorpay recurring subscriptions with GSTIN support and downloadable tax documents.",
      readTime: "2 min read",
      views: 890,
      helpfulCount: 210,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
      content: `
  # GST Invoicing & Subscription Billing
  
  StayOps uses Razorpay Subscriptions for automated monthly billing. Every invoice is GST-compliant.
  
  ## How Billing Works
  
  1. When you subscribe, Razorpay creates a recurring mandate on your payment method (credit card, debit card, or UPI autopay).
  2. On your billing date each month, Razorpay auto-charges the subscription amount.
  3. A GST-compliant invoice is auto-generated and sent to your registered email.
  4. All invoices are downloadable from **Settings → Billing → Invoice History**.
  
  ## Adding Your GSTIN
  
  If you have a GST registration:
  1. Go to **Settings → Billing → Tax Details**.
  2. Enter your GSTIN number.
  3. Future invoices will include your GSTIN, enabling you to claim input tax credit.
  
  > [!NOTE]
  > StayOps charges 18% GST on all subscription plans (as per Indian IT services tax rules). This is included in the displayed price.
  
  "Your CA will love you. Every invoice is auto-generated, GST-compliant, and downloadable as PDF."
      `,
    },
  
    /* ====================================================================
       DIRECT STOREFRONT & CUSTOM DOMAINS (2 articles)
       ==================================================================== */
    {
      id: "custom-domain-mapping",
      categoryId: "direct-storefront",
  
      title: "Mapping Your Custom Domain (CNAME Setup Guide)",
      summary:
        "Connect your own domain (e.g. www.coorgheavenlystay.com) to your StayOps storefront using CNAME DNS records.",
      readTime: "3 min read",
      views: 1450,
      helpfulCount: 385,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Custom Domain Mapping
  
  Available on Pro Growth (₹2,999/mo) and Multi-Property Hub (₹5,999/mo) plans. Map your own domain to your StayOps storefront for a professional branded experience.
  
  ## Setup Steps
  
  1. **Purchase a domain** from any registrar (GoDaddy, Namecheap, Google Domains, Hostinger).
  2. In StayOps, go to **Settings → Storefront → Custom Domain**.
  3. Enter your domain (e.g. \`www.coorgheavenlystay.com\`).
  4. StayOps provides a **CNAME record value** (e.g. \`storefronts.stayops.in\`).
  5. Go to your domain registrar's DNS settings and add:
     - Type: CNAME
     - Host: www
     - Value: storefronts.stayops.in
  6. Wait 15-30 minutes for DNS propagation.
  7. Return to StayOps and click **Verify Domain**.
  
  > [!TIP]
  > Use both \`www.yourdomain.com\` and \`yourdomain.com\` (root domain). StayOps handles the redirect automatically.
  
  "Your guests see www.coorgheavenlystay.com — professional, branded, and commission-free."
      `,
    },
    {
      id: "storefront-seo-optimization",
      categoryId: "direct-storefront",
  
      title: "SEO Optimization for Your Direct Storefront",
      summary:
        "Auto-generated title tags, meta descriptions, Open Graph tags, and Google Search tips to rank your property page.",
      readTime: "3 min read",
      views: 1100,
      helpfulCount: 290,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=1200&q=80",
      content: `
  # SEO for Your Storefront
  
  StayOps auto-generates SEO metadata from your property details, but a few tweaks can significantly improve your Google ranking.
  
  ## What's Auto-Generated
  
  - **Title Tag**: "[Property Name] — Book Direct | [Location]"
  - **Meta Description**: Your property description (first 160 characters)
  - **Open Graph Tags**: Hero image + title + description for social media sharing
  - **Structured Data**: Schema.org LodgingBusiness markup for rich Google results
  
  ## Tips to Improve Rankings
  
  1. **Write a unique property description** — Don't copy from Airbnb. Google penalizes duplicate content.
  2. **Use location keywords naturally** — "Luxury homestay in Coorg with coffee plantation views" beats "Nice homestay."
  3. **Add your Google Business Profile** — Link your storefront URL as your website.
  4. **Collect Google Reviews** — StayOps sends post-stay feedback requests that link directly to your Google Review page.
  5. **Share on social media** — Every Instagram post should link to your storefront, not your Airbnb listing.
  
  > [!TIP]
  > Register your storefront with Google Search Console for detailed search performance data and indexing status.
  
  "One Jaipur haveli owner went from zero Google visibility to Page 1 for 'heritage homestay Jaipur' in 4 months by following these SEO tips."
      `,
    },
  
    /* ====================================================================
       SECURITY, RBAC & AUDIT LOGS (3 articles)
       ==================================================================== */
    {
      id: "role-access-control-rbac",
      categoryId: "security-rbac",
  
      title: "Role-Based Access Control (RBAC) & Permission Scoping",
      summary:
        "How StayOps enforces different access levels for Owners, Managers, Caretakers, and Guests with tenant-isolated data.",
      readTime: "3 min read",
      views: 750,
      helpfulCount: 195,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Role-Based Access Control (RBAC)
  
  Different people in your property operation need different views. Your caretaker doesn't need to see revenue reports. Your manager doesn't need bank payout details. StayOps enforces this at the system level.
  
  ## The Four Roles
  
  - **Property Owner** — Full access to everything:
    - Financial metrics (net revenue, ADR, RevPAR)
    - Bank payout details and expense approvals
    - Billing settings and subscription management
    - Staff management (invite/remove caretakers)
    - All operational data
  
  - **Property Manager** — Operations access, limited financials:
    - Multi-property scheduling and calendar management
    - Staff assignment and task oversight
    - Guest communications
    - ❌ No bank payout details or billing settings
  
  - **Caretaker / Ground Staff** — Task-only mobile view:
    - Today's check-ins/check-outs
    - Housekeeping checklists with photo upload
    - Petty cash logging and meal entry
    - ❌ No financial data, no revenue reports, no booking prices
  
  - **Guest** — Read-only access:
    - Booking voucher and confirmation details
    - Check-in portal with directions and Wi-Fi info
    - ❌ No operational or financial visibility
  
  > [!IMPORTANT]
  > Financial reports (net revenue, bank payouts) are STRICTLY hidden from Caretaker and Manager roles. This is enforced at the database query level, not just the UI level.
  
  "Your caretaker Raju sees rooms to clean. Your manager Priya sees the calendar. Only you see the money."
      `,
    },
    {
      id: "tenant-data-isolation",
      categoryId: "security-rbac",
  
      title: "Multi-Tenant Data Isolation & Database Security",
      summary:
        "How StayOps ensures your property data is completely isolated from every other property owner on the platform.",
      readTime: "3 min read",
      views: 620,
      helpfulCount: 165,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Multi-Tenant Data Isolation
  
  When you use a SaaS platform, your data sits on shared infrastructure alongside other customers. StayOps ensures your data is completely walled off from every other property owner.
  
  ## How Isolation Works
  
  - Every database query is automatically scoped to your **tenant ID** (your owner account).
  - Cross-tenant queries are **architecturally impossible** — the application layer physically cannot request another owner's data.
  - Even StayOps support staff access your data only through an audited, time-limited support tunnel.
  
  "Think of it like individual safe deposit boxes in a bank vault. Everyone uses the same bank, but no one can open your box."
  
  ## Session Security
  
  - **JWT-based sessions** — Your login creates an encrypted token that expires after 24 hours of inactivity.
  - **Forced re-authentication** — Sensitive operations (billing changes, staff removal, bank detail updates) require you to re-enter your password.
  - **Device tracking** — View all active sessions in Settings → Security → Active Sessions. Terminate any suspicious session with one click.
  
  > [!NOTE]
  > StayOps will never ask for your password via email or WhatsApp. If you receive such a request, report it to security@stayops.in immediately.
      `,
    },
    {
      id: "audit-logs-compliance",
      categoryId: "security-rbac",
  
      title: "Immutable Audit Logs & Compliance Trail",
      summary:
        "Every booking change, status update, and petty cash approval is logged with timestamp, actor, and before/after snapshot.",
      readTime: "2 min read",
      views: 480,
      helpfulCount: 130,
      updatedAt: "July 2026",
      image:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80",
      content: `
  # Immutable Audit Logs
  
  Every data change in StayOps is permanently recorded. This creates a tamper-proof trail for dispute resolution, compliance, and operational accountability.
  
  ## What Gets Logged
  
  - **Booking Changes** — Creation, modification, cancellation (with reason)
  - **Room Status Updates** — Dirty → In Progress → Ready (with photo timestamps)
  - **Check-In/Check-Out** — Exact timestamps and who performed the action
  - **Petty Cash** — Submission, approval, rejection (with actor and amounts)
  - **Staff Changes** — Invitation, role modification, deactivation
  - **Rate & Availability Changes** — Who changed what rate, when, and on which channel
  
  ## Log Entry Format
  
  Each entry captures:
  - **Timestamp** — Exact date and time (down to the second)
  - **Actor** — Who performed the action (name, role, email)
  - **Action** — What was done (created, updated, deleted)
  - **Before/After Snapshot** — The exact data before and after the change
  
  > [!NOTE]
  > Audit logs are immutable — they cannot be edited or deleted by anyone, including Super Admins. This ensures complete accountability.
  
  "When a guest disputes a charge, you can show them the exact timestamp when the meal was logged, who logged it, and the receipt photo. Case closed."
      `,
    },
  ];
  
  /* -------------------------------------------------------------------------
     FREQUENTLY ASKED QUESTIONS (12 FAQs)
     ------------------------------------------------------------------------- */
  export const helpFaqs = [
    {
      question: "Does StayOps charge commission on bookings?",
      answer:
        "No. StayOps is a pure SaaS subscription. We charge a flat monthly fee (starting ₹1,499/mo) with zero transaction commissions. Every rupee your guest pays goes directly to you.",
      category: "billing-subscriptions",
    },
    {
      question: "Which OTA platforms are supported at launch?",
      answer:
        "Airbnb and Booking.com via real-time API sync (instant, under 3 seconds). Agoda and MakeMyTrip/Goibibo via iCal polling sync (default: every 5 minutes). More integrations are on the roadmap.",
      category: "channel-manager",
    },
    {
      question:
        "How does StayOps handle double bookings across channels?",
      answer:
        "For API-connected channels, row-level database locking blocks dates across all platforms within 3 seconds. For iCal channels, timestamp comparison (down to milliseconds) auto-rejects the later booking and notifies the guest with alternative dates.",
      category: "channel-manager",
    },
    {
      question: "Does the caretaker app work without internet?",
      answer:
        "Yes! The Android-first caretaker app supports full offline mode. Tasks, photos, petty cash entries, and meal charges are saved locally and sync automatically when connectivity resumes. Nothing is ever lost.",
      category: "caretaker-ops",
    },
    {
      question:
        "Can I map my own domain (e.g. www.coorgheavenlystay.com)?",
      answer:
        "Custom domain mapping via CNAME is included in Pro Growth (₹2,999/mo) and Multi-Property Hub (₹5,999/mo) plans. Lite plan users get an auto-generated subdomain: yourproperty.stayops.in.",
      category: "direct-storefront",
    },
    {
      question:
        "What happens if I exceed my room or property cap?",
      answer:
        "You'll receive a soft alert at 80% usage. At the cap limit, the 'Add Room' button is disabled and an inline upgrade prompt shows the next plan's benefits. Upgrading is instant via Razorpay.",
      category: "billing-subscriptions",
    },
    {
      question:
        "Does the WhatsApp bot fully automate booking or just capture inquiries?",
      answer:
        "Full automation on Pro Growth and above: the bot captures dates, checks live availability, sends a photo quote card, generates a Razorpay payment link, and on payment confirmation, auto-creates the booking and sends a confirmation voucher. Lite plan supports inquiry capture only.",
      category: "whatsapp-storefront",
    },
    {
      question:
        "Can caretakers see financial information like revenue or payouts?",
      answer:
        "No. Role-based access control (RBAC) strictly hides all financial data from caretaker accounts. They can only see task-based views: housekeeping checklists, check-in/out flows, and petty cash logging. This is enforced at the database level.",
      category: "security-rbac",
    },
    {
      question:
        "Is there a mobile app for property owners?",
      answer:
        "The owner dashboard is a responsive web app accessible from any mobile browser. A dedicated owner mobile app is on the roadmap. The caretaker app is Android-native and available on Google Play Store.",
      category: "getting-started",
    },
    {
      question:
        "How are petty cash expenses approved?",
      answer:
        "When a caretaker logs an expense with a receipt photo, the owner receives a push notification. The owner can Approve or Reject directly from the notification or from the dashboard. All entries require a receipt photo — this is mandatory.",
      category: "caretaker-ops",
    },
    {
      question:
        "Does StayOps support GST invoicing?",
      answer:
        "Yes. All subscription invoices are GST-compliant with 18% GST. You can add your GSTIN in Settings → Billing → Tax Details, and it will appear on all future invoices for input tax credit claims.",
      category: "billing-subscriptions",
    },
    {
      question:
        "Can I use StayOps for just one apartment or is it only for large villas?",
      answer:
        "StayOps works for any size — from a single 1BHK apartment to a 20-room heritage haveli. The Lite plan (₹1,499/mo) is specifically designed for small operators with 1 property and up to 3 rooms.",
      category: "getting-started",
    },
  ];
  