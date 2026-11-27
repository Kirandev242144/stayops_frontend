import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../config/api";
import "./Overview.css";

const Overview = () => {
  // Step 1: Create State for Data, Loading, and Errors
  const [mealOrders, setMealOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Step 2: Use useEffect to fetch data when component loads
  useEffect(() => {
    const fetchMealOrders = async () => {
      try {
        setLoading(true);
        setError("");

        // Get authentication token from localStorage
        const token = localStorage.getItem("token");

        // Step 3: Call the Spring Boot backend REST API endpoint
        const response = await fetch(`${API_BASE_URL}/meal-orders`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        // Parse JSON response data
        const data = await response.json();
        setMealOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch meal orders:", err);
        setError("Unable to connect to StayOps database.");
      } finally {
        setLoading(false);
      }
    };

    fetchMealOrders();
  }, []);

  return (
    <div className="overview-page">
      {/* Page Title & Header */}
      <div className="overview-header">
        <h1>Overview</h1>
        <p>Recent F&B Meal Orders from StayOps Database</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="overview-status-card">
          <div className="status-spinner"></div>
          <p>Fetching meal orders from database...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="overview-status-card error">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Step 4: Display Fetched Meal Orders Table */}
      {!loading && !error && (
        <div className="meal-orders-card">
          <div className="card-header">
            <h2>Meal Orders</h2>
            <span className="count-badge">{mealOrders.length}</span>
          </div>

          {mealOrders.length === 0 ? (
            <div className="empty-orders-state">
              <p>No meal orders recorded yet in database.</p>
            </div>
          ) : (
            <div className="meal-orders-table-wrapper">
              <table className="meal-orders-table">
                <thead>
                  <tr>
                    <th>Guest Name</th>
                    <th>Item Name</th>
                    <th>Meal Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {mealOrders.map((order) => (
                    <tr key={order.id || Math.random()}>
                      <td className="guest-name-cell">
                        <span className="guest-avatar">
                          {(order.guestName || "G").charAt(0).toUpperCase()}
                        </span>
                        {order.guestName || "N/A"}
                      </td>
                      <td className="item-name-cell">{order.itemName || "N/A"}</td>
                      <td>
                        <span className={`meal-type-pill ${(order.mealType || "").toLowerCase()}`}>
                          {order.mealType || "Standard"}
                        </span>
                      </td>
                      <td className="amount-cell">₹{Number(order.amount || 0).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Overview;
