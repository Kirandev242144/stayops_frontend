import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../config/api";

const Greeting = () => {
  const [ownerName, setOwnerName] = useState(() => {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    return user?.name || "";
  });

  // Time-based greeting
  const hour = new Date().getHours();
  let greetingText = "Good morning";
  let emoji = "🌅";

  if (hour >= 12 && hour < 17) {
    greetingText = "Good afternoon";
    emoji = "☀️";
  } else if (hour >= 17 || hour < 5) {
    greetingText = "Good evening";
    emoji = "👋";
  }

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
            setOwnerName(userData.name);
            localStorage.setItem("user", JSON.stringify(userData));
          }
        }
      } catch (err) {
        console.warn("Could not fetch user profile from DB:", err);
      }
    };

    fetchUserFromDatabase();
  }, []);

  return (
    <div className="navbar-greeting">
      <h2>
        {greetingText}{ownerName ? `, ${ownerName}` : ""}
      </h2>
    </div>
  );
};

export default Greeting;