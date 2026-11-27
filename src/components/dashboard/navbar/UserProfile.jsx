import React, { useState, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import { API_BASE_URL } from "../../../config/api";

const UserProfile = () => {
  const [displayName, setDisplayName] = useState(() => {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    return user?.name || "Owner";
  });

  // Fetch authenticated owner profile directly from Spring Boot database API
  useEffect(() => {
    const fetchUserFromDatabase = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const userData = await res.json();
          if (userData && userData.name) {
            setDisplayName(userData.name);
            localStorage.setItem("user", JSON.stringify(userData));
          }
        }
      } catch (err) {
        console.warn("Could not fetch user profile from DB:", err);
      }
    };

    fetchUserFromDatabase();
  }, []);

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <button className="user-profile">
      <div className="user-avatar">{initial}</div>

      <div className="user-info">
        <h4>{displayName}</h4>
        <span>Owner</span>
      </div>

      <FiChevronDown className="user-chevron" />
    </button>
  );
};

export default UserProfile;