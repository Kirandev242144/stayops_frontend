import React, { useState, useEffect, useMemo, useCallback } from "react";
import { API_BASE_URL } from "../../../../config/api";
import {
  normalizePaymentLog,
  calculatePaymentStats,
  exportPaymentLogsToCSV,
} from "./paymentLogUtils";
import "./PaymentLogsSettings.css";

const PaymentLogsSettings = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [gatewayFilter, setGatewayFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch payment logs exclusively from GET /payments/logs
  const fetchLogsFromDatabase = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      };

      const response = await fetch(`${API_BASE_URL}/payments/logs`, { headers });

      if (!response.ok) {
        throw new Error(`Unable to load payment logs (HTTP ${response.status}).`);
      }

      const data = await response.json();
      const recordsArray = Array.isArray(data) ? data : data.content || [];

      // Normalize backend payment log records
      const normalized = recordsArray.map((item, idx) =>
        normalizePaymentLog(item, idx)
      );

      setLogs(normalized);
    } catch (err) {
      console.error("Failed to fetch payment logs:", err);
      setError(err.message || "Unable to load payment logs from server.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogsFromDatabase();
  }, [fetchLogsFromDatabase]);

  // Filter logs by search term and dropdown selections
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        log.bookingRef?.toLowerCase().includes(term) ||
        log.guestName?.toLowerCase().includes(term) ||
        log.orderId?.toLowerCase().includes(term) ||
        log.paymentId?.toLowerCase().includes(term) ||
        log.refundId?.toLowerCase().includes(term) ||
        log.referenceNumber?.toLowerCase().includes(term) ||
        log.id?.toLowerCase().includes(term);

      const matchesGateway =
        gatewayFilter === "ALL" || log.paymentGateway === gatewayFilter;

      const matchesType = typeFilter === "ALL" || log.type === typeFilter;

      const matchesStatus =
        statusFilter === "ALL" || log.status === statusFilter;

      return matchesSearch && matchesGateway && matchesType && matchesStatus;
    });
  }, [logs, searchTerm, gatewayFilter, typeFilter, statusFilter]);

  // Calculate owner summary metrics
  const stats = useMemo(() => {
    return calculatePaymentStats(logs);
  }, [logs]);

  return (
    <div className="payment-logs-container">
      {/* Header */}
      <div className="payment-logs-header">
        <div>
          <h2>Payment & Gateway Logs</h2>
          <p>
            Audit trail for all payment transactions, refunds, and gateway activity across Razorpay, Cashfree, and manual settlements.
          </p>
        </div>
        <div className="payment-logs-actions">
          <button
            type="button"
            className="settings-secondary-button"
            onClick={fetchLogsFromDatabase}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button
            type="button"
            className="settings-primary-button"
            onClick={() => exportPaymentLogsToCSV(filteredLogs)}
            disabled={filteredLogs.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Backend Connection Error Banner */}
      {error && (
        <div className="payment-logs-error-banner">
          <span>
            <strong>Connection Alert:</strong> {error}
          </span>
          <button
            type="button"
            className="payment-logs-retry-btn"
            onClick={fetchLogsFromDatabase}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 4 Owner Summary Stat Cards */}
      <div className="payment-logs-stats-grid">
        <div className="payment-stat-card">
          <span className="payment-stat-label">Total Payments Received</span>
          <span className="payment-stat-value">
            ₹{stats.totalPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="payment-stat-subtext">Online & Cash payments</span>
        </div>

        <div className="payment-stat-card">
          <span className="payment-stat-label">Total Refunds Issued</span>
          <span className="payment-stat-value refunds">
            ₹{stats.totalRefunds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="payment-stat-subtext">Refunds recorded</span>
        </div>

        <div className="payment-stat-card">
          <span className="payment-stat-label">Total Logged Transactions</span>
          <span className="payment-stat-value">{stats.totalCount}</span>
          <span className="payment-stat-subtext">Database audit records</span>
        </div>

        <div className="payment-stat-card">
          <span className="payment-stat-label">Pending / Failed</span>
          <span className="payment-stat-value pending">
            {stats.pendingOrFailedCount}
          </span>
          <span className="payment-stat-subtext">Transactions requiring review</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="payment-logs-filters-card">
        <div className="payment-logs-search-row">
          <input
            type="text"
            className="payment-logs-search-input"
            placeholder="Search guest name, booking ref, order ID, or payment/refund ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="payment-logs-select"
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
          >
            <option value="ALL">All Gateways</option>
            <option value="RAZORPAY">Razorpay</option>
            <option value="CASHFREE">Cashfree</option>
            <option value="MANUAL">Manual (Cash/UPI)</option>
          </select>

          <select
            className="payment-logs-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Event Types</option>
            <option value="PAYMENT">Payment</option>
            <option value="REFUND">Refund</option>
          </select>

          <select
            className="payment-logs-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="CAPTURED">Captured / Success</option>
            <option value="REFUNDED">Refunded</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="payment-logs-table-wrapper">
        <table className="payment-logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Booking / Guest</th>
              <th>Type</th>
              <th>Original Gateway</th>
              <th>Payment / Refund ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="payment-logs-empty">
                  Fetching payment logs from database...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="8" className="payment-logs-empty">
                  No payment logs found matching your filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="log-timestamp-text">{log.timestamp}</div>
                    <div className="log-id-subtext">{log.id}</div>
                  </td>
                  <td>
                    <div className="log-booking-ref-text">{log.bookingRef}</div>
                    <div className="log-guest-name-text">{log.guestName}</div>
                  </td>
                  <td>
                    <span className={`log-type-badge ${log.type?.toLowerCase()}`}>
                      {log.type}
                    </span>
                  </td>
                  <td>
                    <span className={`gateway-tag ${log.paymentGateway?.toLowerCase()}`}>
                      {log.paymentGateway}
                    </span>
                  </td>
                  <td>
                    <div>
                      {log.paymentId && log.paymentId !== "-" && (
                        <span className="log-id-code" title={log.paymentId}>
                          Pay: {log.paymentId}
                        </span>
                      )}
                      {log.refundId && (
                        <div>
                          <span className="log-id-code refund" title={log.refundId}>
                            Rfnd: {log.refundId}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="log-amount-text">
                      ₹{log.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${log.status?.toLowerCase()}`}>
                      <span className="status-badge-dot"></span>
                      {log.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="settings-secondary-button btn-view-details"
                      onClick={() => setSelectedLog(log)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Audit Details Modal */}
      {selectedLog && (
        <div className="log-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="log-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="log-modal-header">
              <h3>Payment Transaction Audit ({selectedLog.id})</h3>
              <button
                type="button"
                className="log-modal-close-btn"
                onClick={() => setSelectedLog(null)}
              >
                &times;
              </button>
            </div>

            <div className="log-modal-body">
              <div className="log-detail-grid">
                <div className="log-detail-item">
                  <span className="log-detail-label">Booking Reference</span>
                  <span className="log-detail-value">{selectedLog.bookingRef}</span>
                </div>

                <div className="log-detail-item">
                  <span className="log-detail-label">Guest Name</span>
                  <span className="log-detail-value">
                    {selectedLog.guestName} {selectedLog.guestPhone !== "-" ? `(${selectedLog.guestPhone})` : ""}
                  </span>
                </div>

                <div className="log-detail-item">
                  <span className="log-detail-label">Original Payment Gateway</span>
                  <span className="log-detail-value">{selectedLog.paymentGateway}</span>
                </div>

                <div className="log-detail-item">
                  <span className="log-detail-label">Payment Method</span>
                  <span className="log-detail-value">{selectedLog.paymentMethod}</span>
                </div>

                {selectedLog.refundMethod && (
                  <div className="log-detail-item">
                    <span className="log-detail-label">Refund Settlement Method</span>
                    <span className="log-detail-value">{selectedLog.refundMethod}</span>
                  </div>
                )}

                <div className="log-detail-item">
                  <span className="log-detail-label">Gateway Order ID</span>
                  <span className="log-detail-value">{selectedLog.orderId}</span>
                </div>

                <div className="log-detail-item">
                  <span className="log-detail-label">Gateway Payment ID</span>
                  <span className="log-detail-value">{selectedLog.paymentId}</span>
                </div>

                {selectedLog.refundId && (
                  <div className="log-detail-item">
                    <span className="log-detail-label">Gateway Refund ID</span>
                    <span className="log-detail-value">{selectedLog.refundId}</span>
                  </div>
                )}

                {selectedLog.referenceNumber && (
                  <div className="log-detail-item">
                    <span className="log-detail-label">Bank Reference / RRN</span>
                    <span className="log-detail-value">{selectedLog.referenceNumber}</span>
                  </div>
                )}

                <div className="log-detail-item">
                  <span className="log-detail-label">Transaction Amount</span>
                  <span className="log-detail-value">
                    ₹{selectedLog.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {selectedLog.notes && (
                <div className="log-audit-notes-box">
                  <strong>Audit Notes:</strong> {selectedLog.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentLogsSettings;
