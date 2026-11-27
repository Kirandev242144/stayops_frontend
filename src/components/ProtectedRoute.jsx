import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function ProtectedRoute() {
  const location = useLocation();

  // Get JWT from localStorage
  const token = localStorage.getItem("token");

  // No token = not logged in
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Token exists = allow access
  return <Outlet />;
}

export default ProtectedRoute;