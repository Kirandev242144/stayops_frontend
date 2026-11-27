// ==========================================
// AUTH STORAGE
// ==========================================

const TOKEN_KEY = "token";

// ==========================================
// GET TOKEN
// ==========================================

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// ==========================================
// CHECK LOGIN
// ==========================================

export const isAuthenticated = () => {
  const token = getToken();

  return !!token;
};

// ==========================================
// SAVE TOKEN
// ==========================================

export const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

// ==========================================
// LOGOUT
// ==========================================

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);

  // Optional cleanup if you store user information
  localStorage.removeItem("user");

  // Send user to login
  window.location.replace("/login");
};