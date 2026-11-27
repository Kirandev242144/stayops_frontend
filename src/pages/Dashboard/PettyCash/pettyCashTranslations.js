// Localization dictionary for Petty Cash Ledger (English, Hindi, Tamil, Kannada)

export const PETTY_CASH_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' }
];

export const translations = {
  en: {
    // Header
    badge: 'STAYOPS LEDGER',
    mainHeading: 'Petty Cash Ledger',
    subHeading: 'Track internal cash float, owner funding, and caretaker verified expenses',
    addCashFunds: 'Add Cash Funds',
    recordExpense: 'Record Expense',
    refresh: 'Refresh ledger',

    // Summary Cards
    currentBalance: 'Current Petty Cash Balance',
    lowFloat: 'Low Float',
    balanceSubAll: 'Real live balance across all property units',
    balanceSubSingle: 'Real live balance for selected property',
    cashAdded: 'Cash Added',
    expensesPaid: 'Expenses Paid',

    // Filter Bar
    allProperties: 'All Properties',
    allTime: 'All Time',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    thisYear: 'This Year',
    searchPlaceholder: 'Search category, notes, or user...',
    showingTransactions: 'Showing {count} transaction(s)',

    // Table Headers
    thDateTime: 'DATE & TIME',
    thProperty: 'PROPERTY',
    thType: 'TYPE',
    thCategory: 'CATEGORY',
    thLoggedBy: 'LOGGED BY',
    thNotes: 'NOTES / DETAILS',
    thAmount: 'AMOUNT',
    thReceipt: 'RECEIPT PHOTO',

    // Table Rows
    creditType: 'CREDIT',
    debitType: 'DEBIT',
    viewBill: 'View Bill',
    noProof: 'No photo attached',
    noTransactionsTitle: 'No transactions found',
    noTransactionsSubtitle: 'No petty cash deposits or expense entries recorded for this selection.',

    // Categories
    catCleaning: 'Cleaning Supplies',
    catGrocery: 'Grocery & Tea',
    catRepair: 'Maintenance & Repair',
    catUtility: 'Electricity & Utility',
    catAmenities: 'Room Amenities',
    catOther: 'Other Expense',
    catFunding: 'Petty Cash Funding',

    // Add Cash Funds Modal
    addFundsTitle: 'Add Petty Cash Funds',
    addFundsSub: 'Owner / Manager internal float deposit into property cash drawer',
    currentLiveBalance: 'Current Live Balance',
    selectProperty: 'Select Property Unit',
    fundingAmount: 'Cash Amount to Add',
    fundingAmountPlaceholder: 'e.g. 5000',
    fundingNotes: 'Funding Notes / Purpose',
    fundingNotesPlaceholder: 'e.g. Monthly operating float, weekend advance',
    cancel: 'Cancel',
    confirmAddFunds: 'Confirm & Add Cash Float',
    addingFunds: 'Adding Cash Float...',

    // Record Expense Modal
    recordExpenseTitle: 'Record Petty Cash Expense',
    availableCash: 'Available Cash',
    propertyUnit: 'Property Unit',
    expenseAmount: 'Expense Amount',
    category: 'Category',
    receiptPhoto: 'Receipt Photo',
    required: '* Required',
    uploadReceipt: 'Upload Bill / Receipt Photo',
    billAttached: 'Bill Photo Attached & Ready',
    replacePhoto: 'Replace Photo',
    notesOptional: 'Notes / Item Description (Optional)',
    notesPlaceholder: 'e.g. 2 packs tea bags, cleaning detergent',
    submitExpense: 'Record Expense & Deduct Cash',
    savingExpense: 'Saving Expense...',

    // Receipt Viewer Modal
    receiptViewerTitle: 'Verified Bill / Expense Proof',
    downloadReceipt: 'Download Receipt',
    close: 'Close',

    // Quick presets
    presetAdd1000: '+ ₹1,000',
    presetAdd2000: '+ ₹2,000',
    presetAdd5000: '+ ₹5,000',
    presetAdd10000: '+ ₹10,000',
    presetExp100: '₹100',
    presetExp250: '₹250',
    presetExp500: '₹500',
    presetExp1000: '₹1,000',
    presetExp2000: '₹2,000'
  },

  hi: {
    // Header
    badge: 'स्टेऑप्स लेज़र',
    mainHeading: 'पेट्टी कैश लेज़र (दैनिक खर्च खाता)',
    subHeading: 'आंतरिक नकद राशि, मालिक द्वारा फंडिंग और केयरटेकर के सत्यापित खर्चों को ट्रैक करें',
    addCashFunds: 'नकद फंड जोड़ें',
    recordExpense: 'खर्च दर्ज करें',
    refresh: 'लेज़र रिफ्रेश करें',

    // Summary Cards
    currentBalance: 'वर्तमान पेट्टी कैश बैलेंस',
    lowFloat: 'कम बैलेंस',
    balanceSubAll: 'सभी प्रॉपर्टी का वास्तविक लाइव बैलेंस',
    balanceSubSingle: 'चयनित प्रॉपर्टी का लाइव बैलेंस',
    cashAdded: 'कुल जमा नकद',
    expensesPaid: 'कुल किए गए खर्च',

    // Filter Bar
    allProperties: 'सभी संपत्तियां',
    allTime: 'सभी समय',
    thisMonth: 'इस महीने',
    lastMonth: 'पिछले महीने',
    thisYear: 'इस वर्ष',
    searchPlaceholder: 'श्रेणी, विवरण या उपयोगकर्ता खोजें...',
    showingTransactions: '{count} लेनदेन दिखाए जा रहे हैं',

    // Table Headers
    thDateTime: 'दिनांक और समय',
    thProperty: 'प्रॉपर्टी',
    thType: 'प्रकार',
    thCategory: 'श्रेणी',
    thLoggedBy: 'दर्जकर्ता',
    thNotes: 'विवरण / नोट्स',
    thAmount: 'राशि',
    thReceipt: 'रसीद फोटो',

    // Table Rows
    creditType: 'क्रेडिट (जमा)',
    debitType: 'डेबिट (खर्च)',
    viewBill: 'बिल देखें',
    noProof: 'कोई फोटो संलग्न नहीं',
    noTransactionsTitle: 'कोई लेनदेन नहीं मिला',
    noTransactionsSubtitle: 'इस चयन के लिए कोई पेट्टी कैश जमा या खर्च प्रविष्टि दर्ज नहीं है।',

    // Categories
    catCleaning: 'सफाई सामग्री',
    catGrocery: 'किराना और चाय',
    catRepair: 'रखरखाव और मरम्मत',
    catUtility: 'बिजली और बिल',
    catAmenities: 'कमरे की सुविधाएं',
    catOther: 'अन्य खर्च',
    catFunding: 'पेट्टी कैश फंडिंग',

    // Add Cash Funds Modal
    addFundsTitle: 'पेट्टी कैश फंड जोड़ें',
    addFundsSub: 'मालिक / प्रबंधक द्वारा प्रॉपर्टी कैश ड्रावर में आंतरिक नकद जमा',
    currentLiveBalance: 'वर्तमान लाइव बैलेंस',
    selectProperty: 'प्रॉपर्टी यूनिट चुनें',
    fundingAmount: 'जोड़ने के लिए नकद राशि',
    fundingAmountPlaceholder: 'उदा. 5000',
    fundingNotes: 'फंडिंग विवरण / उद्देश्य',
    fundingNotesPlaceholder: 'उदा. मासिक ऑपरेटिंग फ्लोट, वीकेंड एडवांस',
    cancel: 'रद्द करें',
    confirmAddFunds: 'पुष्टि करें और नकद जोड़ें',
    addingFunds: 'फंड जोड़ा जा रहा है...',

    // Record Expense Modal
    recordExpenseTitle: 'पेट्टी कैश खर्च दर्ज करें',
    availableCash: 'उपलब्ध नकद',
    propertyUnit: 'प्रॉपर्टी यूनिट',
    expenseAmount: 'खर्च की राशि',
    category: 'श्रेणी',
    receiptPhoto: 'रसीद फोटो',
    required: '* अनिवार्य',
    uploadReceipt: 'बिल / रसीद फोटो अपलोड करें',
    billAttached: 'बिल फोटो संलग्न है',
    replacePhoto: 'फोटो बदलें',
    notesOptional: 'विवरण / सामग्री (वैकल्पिक)',
    notesPlaceholder: 'उदा. 2 पैकेट चायपत्ती, फिनाइल',
    submitExpense: 'खर्च दर्ज करें और नकद काटें',
    savingExpense: 'दर्ज किया जा रहा है...',

    // Receipt Viewer Modal
    receiptViewerTitle: 'सत्यापित बिल / खर्च का प्रमाण',
    downloadReceipt: 'रसीद डाउनलोड करें',
    close: 'बंद करें',

    // Quick presets
    presetAdd1000: '+ ₹1,000',
    presetAdd2000: '+ ₹2,000',
    presetAdd5000: '+ ₹5,000',
    presetAdd10000: '+ ₹10,000',
    presetExp100: '₹100',
    presetExp250: '₹250',
    presetExp500: '₹500',
    presetExp1000: '₹1,000',
    presetExp2000: '₹2,000'
  },

  ta: {
    // Header
    badge: 'ஸ்டேஆப்ஸ் லெட்ஜர்',
    mainHeading: 'சில்லறை பண லெட்ஜர் (பெட்டி கேஷ்)',
    subHeading: 'உள்நாட்டு பண இருப்பு, உரிமையாளர் நிதி மற்றும் பராமரிப்பாளர் சரிபார்த்த செலவுகளை கண்காணிக்கவும்',
    addCashFunds: 'பணம் சேர்க்க',
    recordExpense: 'செலவை பதிவு செய்க',
    refresh: 'புதுப்பிக்கவும்',

    // Summary Cards
    currentBalance: 'தற்போதைய பெட்டி கேஷ் இருப்பு',
    lowFloat: 'குறைந்த இருப்பு',
    balanceSubAll: 'அனைத்து சொத்துகளின் நேரடி இருப்பு',
    balanceSubSingle: 'தேர்ந்தெடுக்கப்பட்ட சொத்தின் நேரடி இருப்பு',
    cashAdded: 'சேர்க்கப்பட்ட மொத்த பணம்',
    expensesPaid: 'செலுத்தப்பட்ட மொத்த செலவுகள்',

    // Filter Bar
    allProperties: 'அனைத்து சொத்துக்கள்',
    allTime: 'எல்லா நேரமும்',
    thisMonth: 'இந்த மாதம்',
    lastMonth: 'கடந்த மாதம்',
    thisYear: 'இந்த வருடம்',
    searchPlaceholder: 'வகை, குறிப்புகள் அல்லது பயனரைத் தேடவும்...',
    showingTransactions: '{count} பரிவர்த்தனைகள் காட்டப்படுகின்றன',

    // Table Headers
    thDateTime: 'தேதி & நேரம்',
    thProperty: 'சொத்து',
    thType: 'வகை',
    thCategory: 'பிரிவு',
    thLoggedBy: 'பதிவு செய்தவர்',
    thNotes: 'குறிப்புகள் / விவரங்கள்',
    thAmount: 'தொகை',
    thReceipt: 'ரசீது புகைப்படம்',

    // Table Rows
    creditType: 'வரவு (கிரெடிட்)',
    debitType: 'பற்று (டெபிட்)',
    viewBill: 'பில் பார்க்கவும்',
    noProof: 'புகைப்படம் இணைக்கப்படவில்லை',
    noTransactionsTitle: 'பரிவர்த்தனைகள் எதுவும் இல்லை',
    noTransactionsSubtitle: 'இந்த தேர்விற்கு எந்த பெட்டி கேஷ் வரவு அல்லது செலவு உள்ளீடுகளும் இல்லை.',

    // Categories
    catCleaning: 'துப்புரவு பொருட்கள்',
    catGrocery: 'மளிகை மற்றும் தேநீர்',
    catRepair: 'பராமரிப்பு மற்றும் பழுது',
    catUtility: 'மின்சாரம் & கட்டணங்கள்',
    catAmenities: 'அறை வசதிகள்',
    catOther: 'இதர செலவுகள்',
    catFunding: 'பெட்டி கேஷ் நிதி',

    // Add Cash Funds Modal
    addFundsTitle: 'பெட்டி கேஷ் நிதி சேர்க்க',
    addFundsSub: 'உரிமையாளர் / மேலாளரால் பணப் பெட்டியில் உள்நாட்டு ரொக்க வைப்பு',
    currentLiveBalance: 'தற்போதைய இருப்பு',
    selectProperty: 'சொத்து பிரிவை தேர்ந்தெடுக்கவும்',
    fundingAmount: 'சேர்க்க வேண்டிய தொகை',
    fundingAmountPlaceholder: 'எ.கா. 5000',
    fundingNotes: 'நிதி குறிப்புகள் / நோக்கம்',
    fundingNotesPlaceholder: 'எ.கா. மாதாந்திர இயக்க நிதி, வார இறுதி முன்பணம்',
    cancel: 'ரத்துசெய்',
    confirmAddFunds: 'உறுதிசெய்து பணத்தை சேர்க்கவும்',
    addingFunds: 'பணம் சேர்க்கப்படுகிறது...',

    // Record Expense Modal
    recordExpenseTitle: 'பெட்டி கேஷ் செலவை பதிவு செய்க',
    availableCash: 'கிடைக்கக்கூடிய பணம்',
    propertyUnit: 'சொத்து பிரிவு',
    expenseAmount: 'செலவுத் தொகை',
    category: 'பிரிவு',
    receiptPhoto: 'ரசீது புகைப்படம்',
    required: '* கட்டாயம்',
    uploadReceipt: 'பில் / ரசீதை பதிவேற்றவும்',
    billAttached: 'பில் புகைப்படம் இணைக்கப்பட்டுள்ளது',
    replacePhoto: 'புகைப்படத்தை மாற்றவும்',
    notesOptional: 'குறிப்புகள் (விருப்பத்தேர்வு)',
    notesPlaceholder: 'எ.கா. 2 பாக்கெட் டீத்தூள், துப்புரவு திரவம்',
    submitExpense: 'செலவை பதிவு செய்து பணத்தை கழிக்கவும்',
    savingExpense: 'பதிவு செய்யப்படுகிறது...',

    // Receipt Viewer Modal
    receiptViewerTitle: 'சரிபார்க்கப்பட்ட பில் / செலவு சான்று',
    downloadReceipt: 'ரசீதை பதிவிறக்கவும்',
    close: 'மூடு',

    // Quick presets
    presetAdd1000: '+ ₹1,000',
    presetAdd2000: '+ ₹2,000',
    presetAdd5000: '+ ₹5,000',
    presetAdd10000: '+ ₹10,000',
    presetExp100: '₹100',
    presetExp250: '₹250',
    presetExp500: '₹500',
    presetExp1000: '₹1,000',
    presetExp2000: '₹2,000'
  },

  kn: {
    // Header
    badge: 'ಸ್ಟೇಆಪ್ಸ್ ಲೆಡ್ಜರ್',
    mainHeading: 'ಪೆಟ್ಟಿ ಕ್ಯಾಶ್ (ದಿನನಿತ್ಯದ ಖರ್ಚು)',
    subHeading: 'ದಿನನಿತ್ಯದ ಸಣ್ಣ-ಪುಟ್ಟ ಖರ್ಚುಗಳು ಮತ್ತು ಜಮೆಯಾದ ಕ್ಯಾಶ್ ಲೆಕ್ಕ',
    addCashFunds: 'ಕ್ಯಾಶ್ ಜಮೆ ಮಾಡಿ',
    recordExpense: 'ಖರ್ಚು ಎಂಟ್ರಿ ಮಾಡಿ',
    refresh: 'ರಿಫ್ರೆಶ್ ಮಾಡಿ',

    // Summary Cards
    currentBalance: 'ಈಗಿರುವ ಕ್ಯಾಶ್ ಬ್ಯಾಲೆನ್ಸ್',
    lowFloat: 'ಕ್ಯಾಶ್ ಕಮ್ಮಿ ಇದೆ',
    balanceSubAll: 'ಎಲ್ಲಾ ಪ್ರಾಪರ್ಟಿಗಳಲ್ಲಿ ಸದ್ಯಕ್ಕಿರುವ ಕ್ಯಾಶ್',
    balanceSubSingle: 'ಈ ಪ್ರಾಪರ್ಟಿಯಲ್ಲಿ ಸದ್ಯಕ್ಕಿರುವ ಕ್ಯಾಶ್',
    cashAdded: 'ಜಮೆಯಾದ ಕ್ಯಾಶ್',
    expensesPaid: 'ಆದ ಒಟ್ಟು ಖರ್ಚು',

    // Filter Bar
    allProperties: 'ಎಲ್ಲಾ ಪ್ರಾಪರ್ಟಿಗಳು',
    allTime: 'ಎಲ್ಲವೂ',
    thisMonth: 'ಈ ತಿಂಗಳು',
    lastMonth: 'ಕಳೆದ ತಿಂಗಳು',
    thisYear: 'ಈ ವರ್ಷ',
    searchPlaceholder: 'ಖರ್ಚು, ವಿವರ ಅಥವಾ ಹೆಸರು ಹುಡುಕಿ...',
    showingTransactions: '{count} ಎಂಟ್ರಿಗಳು',

    // Table Headers
    thDateTime: 'ದಿನಾಂಕ & ಸಮಯ',
    thProperty: 'ಪ್ರಾಪರ್ಟಿ',
    thType: 'ವಿಧ',
    thCategory: 'ಖರ್ಚಿನ ವಿವರ',
    thLoggedBy: 'ಎಂಟ್ರಿ ಮಾಡಿದವರು',
    thNotes: 'ವಿವರಗಳು',
    thAmount: 'ಮೊತ್ತ',
    thReceipt: 'ಬಿಲ್ ಫೋಟೋ',

    // Table Rows
    creditType: 'ಜಮೆ',
    debitType: 'ಖರ್ಚು',
    viewBill: 'ಬಿಲ್ ನೋಡಿ',
    noProof: 'ಬಿಲ್ ಫೋಟೋ ಇಲ್ಲ',
    noTransactionsTitle: 'ಯಾವ ಖರ್ಚು-ವೆಚ್ಚಗಳೂ ಇಲ್ಲ',
    noTransactionsSubtitle: 'ಈ ಆಯ್ಕೆಯಲ್ಲಿ ಯಾವುದೇ ಖರ್ಚು ಅಥವಾ ಜಮೆಯ ಎಂಟ್ರಿ ಇಲ್ಲ.',

    // Categories
    catCleaning: 'ಕ್ಲೀನಿಂಗ್ ಸಾಮಾನು',
    catGrocery: 'ದಿನಸಿ ಮತ್ತು ಟೀ-ಕಾಫಿ',
    catRepair: 'ರಿಪೇರಿ & ಮೇಂಟೆನೆನ್ಸ್',
    catUtility: 'ಕರೆಂಟ್ & ನೀರು ಬಿಲ್',
    catAmenities: 'ರೂಮ್ ಸಾಮಾನುಗಳು',
    catOther: 'ಬೇರೆ ಖರ್ಚು',
    catFunding: 'ಪೆಟ್ಟಿ ಕ್ಯಾಶ್ ಜಮೆ',

    // Add Cash Funds Modal
    addFundsTitle: 'ಪೆಟ್ಟಿ ಕ್ಯಾಶ್ ಜಮೆ ಮಾಡಿ',
    addFundsSub: 'ರೆಸಾರ್ಟ್ ಖರ್ಚಿಗಾಗಿ ಮಾಲೀಕರು ಅಥವಾ ಮ್ಯಾನೇಜರ್ ನೀಡಿದ ಕ್ಯಾಶ್ ಜಮೆ',
    currentLiveBalance: 'ಈಗಿರುವ ಕ್ಯಾಶ್ ಬ್ಯಾಲೆನ್ಸ್',
    selectProperty: 'ಪ್ರಾಪರ್ಟಿ ಆಯ್ಕೆ ಮಾಡಿ',
    fundingAmount: 'ಜಮೆ ಮಾಡುವ ದುಡ್ಡು',
    fundingAmountPlaceholder: 'ಉದಾ. 5000',
    fundingNotes: 'ಯಾತಕ್ಕಾಗಿ / ವಿವರ',
    fundingNotesPlaceholder: 'ಉದಾ. ವೀಕೆಂಡ್ ಖರ್ಚಿಗೆ, ತಿಂಗಳ ಮುಂಗಡ',
    cancel: 'ಕ್ಯಾನ್ಸಲ್',
    confirmAddFunds: 'ಕ್ಯಾಶ್ ಜಮೆ ಮಾಡಿ',
    addingFunds: 'ಜಮೆ ಆಗುತ್ತಿದೆ...',

    // Record Expense Modal
    recordExpenseTitle: 'ಖರ್ಚು ಎಂಟ್ರಿ ಮಾಡಿ',
    availableCash: 'ಕೈಯಲ್ಲಿರುವ ಕ್ಯಾಶ್',
    propertyUnit: 'ಪ್ರಾಪರ್ಟಿ',
    expenseAmount: 'ಖರ್ಚಾದ ಮೊತ್ತ',
    category: 'ಖರ್ಚಿನ ವಿಭಾಗ',
    receiptPhoto: 'ಬಿಲ್ ಫೋಟೋ',
    required: '* ಮುಖ್ಯ',
    uploadReceipt: 'ಬಿಲ್ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ',
    billAttached: 'ಬಿಲ್ ಫೋಟೋ ಹಾಕಲಾಗಿದೆ',
    replacePhoto: 'ಬೇರೆ ಫೋಟೋ ಹಾಕಿ',
    notesOptional: 'ಖರ್ಚಿನ ವಿವರ (ಬೇಕಿದ್ದರೆ ಬರೆಯಿರಿ)',
    notesPlaceholder: 'ಉದಾ. 2 ಪ್ಯಾಕೆಟ್ ಟೀ ಪುಡಿ, ಫಿನಾಯಿಲ್',
    submitExpense: 'ಖರ್ಚು ಸೇರಿಸಿ (ಕ್ಯಾಶ್ ಕಡಿತ)',
    savingExpense: 'ಸೇವ್ ಆಗುತ್ತಿದೆ...',

    // Receipt Viewer Modal
    receiptViewerTitle: 'ಖರ್ಚಿನ ಬಿಲ್ ವಿವರ',
    downloadReceipt: 'ಬಿಲ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    close: 'ಮುಚ್ಚಿ',

    // Quick presets
    presetAdd1000: '+ ₹1,000',
    presetAdd2000: '+ ₹2,000',
    presetAdd5000: '+ ₹5,000',
    presetAdd10000: '+ ₹10,000',
    presetExp100: '₹100',
    presetExp250: '₹250',
    presetExp500: '₹500',
    presetExp1000: '₹1,000',
    presetExp2000: '₹2,000'
  }
};

// In-memory cache for backend translations
const backendTranslationCache = {};

export async function fetchBackendTranslations(lang = 'en') {
  try {
    const res = await fetch(`http://localhost:8080/api/localization/petty-cash?lang=${encodeURIComponent(lang)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.translations) {
        backendTranslationCache[lang] = data.translations;
        return data.translations;
      }
    }
  } catch (err) {
    console.warn("Could not fetch backend localization, using local fallback:", err);
  }
  return translations[lang] || translations.en;
}

export function getTranslation(lang, key, params = {}) {
  const backendDict = backendTranslationCache[lang];
  const dict = backendDict || translations[lang] || translations.en;
  let text = (dict && dict[key]) || (translations[lang] && translations[lang][key]) || (translations.en && translations.en[key]) || key;
  Object.keys(params).forEach(k => {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
  });
  return text;
}
