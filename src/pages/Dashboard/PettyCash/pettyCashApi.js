import { API_BASE_URL } from '../../../config/api';

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json"
  };
}

/**
 * Fetches real petty cash balance for a given property or user portfolio.
 * Enforces multi-tenancy property scoping.
 */
export async function fetchPettyCashBalanceApi(propertyId = 'all', allowedPropertyIds = []) {
  const allowedSet = new Set(allowedPropertyIds.map(id => String(id)));

  // Security Check: If user has 0 properties configured in StayOps, balance is 0
  if (Array.isArray(allowedPropertyIds) && allowedPropertyIds.length === 0) {
    return 0;
  }

  if (propertyId && propertyId !== 'all') {
    if (allowedSet.size > 0 && !allowedSet.has(String(propertyId))) {
      return 0; // User does not own this property
    }
    const res = await fetch(`${API_BASE_URL}/petty-cash/balance?propertyId=${propertyId}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to fetch petty cash balance: ${res.statusText}`);
    }
    const data = await res.json();
    return Number(data.balance ?? data.currentBalance) || 0;
  }

  // For 'all' properties owned by user, sum balance of user's properties
  if (allowedSet.size > 0) {
    const balancePromises = Array.from(allowedSet).map(async (pId) => {
      try {
        const res = await fetch(`${API_BASE_URL}/petty-cash/balance?propertyId=${pId}`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          return Number(data.balance ?? data.currentBalance) || 0;
        }
      } catch {
        // ignore individual property fetch failure
      }
      return 0;
    });

    const balances = await Promise.all(balancePromises);
    return balances.reduce((a, b) => a + b, 0);
  }

  return 0;
}

/**
 * Fetches historical petty cash transaction ledger.
 * Enforces multi-tenancy property scoping.
 */
export async function fetchPettyCashTransactionsApi(propertyId = 'all', allowedPropertyIds = []) {
  const allowedSet = new Set(allowedPropertyIds.map(id => String(id)));

  // Security Check: If user has 0 properties configured in StayOps, transaction list is empty
  if (Array.isArray(allowedPropertyIds) && allowedPropertyIds.length === 0) {
    return [];
  }

  const url = propertyId && propertyId !== 'all'
    ? `${API_BASE_URL}/petty-cash/transactions?propertyId=${propertyId}`
    : `${API_BASE_URL}/petty-cash/transactions`;

  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) {
    throw new Error(`Failed to fetch petty cash transactions: ${res.statusText}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  // Security check: restrict strictly to properties belonging to the logged-in user
  return data.filter(t => {
    if (propertyId && propertyId !== 'all') {
      if (String(t.propertyId) !== String(propertyId)) return false;
    }
    return allowedSet.has(String(t.propertyId));
  });
}

/**
 * Adds cash funds to a property's petty cash balance (Owner / Manager CREDIT).
 */
export async function addPettyCashFundsApi({ propertyId, propertyName = 'Property', amount, notes = '', addedBy = 'Owner' }) {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid funding amount. Must be greater than 0.");
  }

  const propKey = String(propertyId);

  const res = await fetch(`${API_BASE_URL}/petty-cash/add-funds`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      propertyId: propKey,
      propertyName,
      amount: numericAmount,
      notes,
      addedBy
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to add funds (${res.status})`);
  }

  return await res.json();
}

/**
 * Records an operational expense logged by caretaker (DEBIT).
 */
export async function recordPettyCashExpenseApi({ propertyId, propertyName = 'Property', amount, category, notes = '', receiptImageUrl, addedBy = 'Caretaker' }) {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Please enter a valid expense amount greater than 0.");
  }

  if (!receiptImageUrl || !String(receiptImageUrl).trim()) {
    throw new Error("Bill / Receipt photo is compulsory before deducting from petty cash.");
  }

  const propKey = String(propertyId);

  const res = await fetch(`${API_BASE_URL}/petty-cash/record-expense`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      propertyId: propKey,
      propertyName,
      amount: numericAmount,
      category: category || 'General Expense',
      notes,
      receiptImageUrl,
      addedBy
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to record expense (${res.status})`);
  }

  return await res.json();
}
