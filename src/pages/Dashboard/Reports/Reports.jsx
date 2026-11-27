import React, { useState, useEffect, useMemo } from 'react';
import {
  FiBarChart2,
  FiDollarSign,
  FiFileText,
  FiDownload,
  FiPercent,
  FiCalendar,
  FiTrendingUp,
  FiLayers,
  FiCheckCircle,
  FiPieChart,
  FiArrowUpRight,
  FiArrowDownRight,
  FiShield,
  FiInfo
} from 'react-icons/fi';
import { fetchReservations } from '../Reservations/reservationApi';
import { fetchProperties } from '../Reservations/propertyApi';
import { fetchPettyCashTransactionsApi } from '../PettyCash/pettyCashApi';
import {
  DATE_PRESETS,
  getPresetDateRange,
  calculateNights,
  filterReservations,
  filterPettyCash,
  calculateFinancialMetrics,
  exportGstr1Csv,
  formatInr
} from './reportsUtils';
import './Reports.css';

export default function Reports() {
  const [reservations, setReservations] = useState([]);
  const [properties, setProperties] = useState([]);
  const [pettyCashTransactions, setPettyCashTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [datePreset, setDatePreset] = useState('this_month');
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [withGst, setWithGst] = useState(false); // false = Without GST (Net), true = With GST (Gross)
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'gst' | 'cashflow'

  // Load initial data from APIs
  useEffect(() => {
    async function loadReportsData() {
      setLoading(true);
      try {
        const [resList, propList, pcList] = await Promise.all([
          fetchReservations().catch(() => []),
          fetchProperties().catch(() => []),
          fetchPettyCashTransactionsApi('all', []).catch(() => [])
        ]);
        setReservations(resList || []);
        setProperties(propList || []);
        setPettyCashTransactions(pcList || []);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportsData();
  }, []);

  // Compute active date boundaries
  const dateRange = useMemo(() => {
    return getPresetDateRange(datePreset);
  }, [datePreset]);

  // Filtered dataset
  const filteredBookings = useMemo(() => {
    return filterReservations(reservations, {
      propertyId: selectedPropertyId,
      startDate: dateRange.start,
      endDate: dateRange.end
    });
  }, [reservations, selectedPropertyId, dateRange]);

  const filteredExpenses = useMemo(() => {
    return filterPettyCash(pettyCashTransactions, {
      propertyId: selectedPropertyId,
      startDate: dateRange.start,
      endDate: dateRange.end
    });
  }, [pettyCashTransactions, selectedPropertyId, dateRange]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const totalRooms = properties.reduce((acc, p) => acc + (p.rooms?.length || 4), 0) || 5;
    return calculateFinancialMetrics(filteredBookings, filteredExpenses, totalRooms);
  }, [filteredBookings, filteredExpenses, properties]);

  const handleExportCsv = () => {
    const presetLabel = DATE_PRESETS.find((p) => p.id === datePreset)?.label || 'Custom';
    exportGstr1Csv(filteredBookings, presetLabel);
  };

  return (
    <div className="reports-page-container">
      {/* Header & Controls */}
      <div className="reports-page-header">
        <div className="reports-title-box">
          <h1 className="reports-page-title">
            <FiBarChart2 className="reports-title-icon" /> Financial Reports & Tax
          </h1>
          <p className="reports-page-subtitle">
            Track net room earnings, GST tax liability, on-ground cash flow, and export CA-ready reports.
          </p>
        </div>

        <div className="reports-header-controls">
          {/* Property Selector */}
          <select
            className="reports-control-select"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
          >
            <option value="all">All Properties ({properties.length || 'Portfolio'})</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || p.name}
              </option>
            ))}
          </select>

          {/* Date Range Preset */}
          <select
            className="reports-control-select"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
          >
            {DATE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>

          {/* With GST / Without GST Toggle */}
          <div className="gst-toggle-wrapper">
            <button
              type="button"
              className={`gst-toggle-btn ${!withGst ? 'active' : ''}`}
              onClick={() => setWithGst(false)}
              title="View Net Room Earnings (Excluding Tax)"
            >
              Without GST (Net)
            </button>
            <button
              type="button"
              className={`gst-toggle-btn ${withGst ? 'active' : ''}`}
              onClick={() => setWithGst(true)}
              title="View Gross Invoiced Total (Including GST)"
            >
              With GST (Gross)
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="reports-kpi-grid">
        {/* Card 1: Revenue (Dynamic based on GST Toggle) */}
        <div className="reports-kpi-card">
          <div className="reports-kpi-body">
            <span className="reports-kpi-label">
              {withGst ? 'Gross Total Billed (With GST)' : 'Net Room Revenue'}
            </span>
            <span className="reports-kpi-value">
              {formatInr(withGst ? metrics.totalGrossTotal : metrics.totalNetRevenue)}
            </span>
            <span className="reports-kpi-subtext">
              {withGst
                ? `Includes ${formatInr(metrics.totalGstCollected)} GST`
                : 'Excluding GST'}
            </span>
          </div>
          <div className="reports-kpi-icon-box cyan">
            <FiDollarSign />
          </div>
        </div>

        {/* Card 2: Output GST */}
        <div className="reports-kpi-card">
          <div className="reports-kpi-body">
            <span className="reports-kpi-label">Output GST (Tax Liability)</span>
            <span className="reports-kpi-value">{formatInr(metrics.totalGstCollected)}</span>
            <span className="reports-kpi-subtext">
              5% accommodation GST (CGST 2.5% + SGST 2.5%)
            </span>
          </div>
          <div className="reports-kpi-icon-box purple">
            <FiFileText />
          </div>
        </div>

        {/* Card 3: Occupancy & ADR */}
        <div className="reports-kpi-card">
          <div className="reports-kpi-body">
            <span className="reports-kpi-label">Average Daily Rate (ADR)</span>
            <span className="reports-kpi-value">{formatInr(metrics.adr)}</span>
            <span className="reports-kpi-subtext highlight">
              Excluding GST • Occupancy: {metrics.occupancyPercentage}%
            </span>
          </div>
          <div className="reports-kpi-icon-box blue">
            <FiTrendingUp />
          </div>
        </div>

        {/* Card 4: Net Cash Movement */}
        <div className="reports-kpi-card">
          <div className="reports-kpi-body">
            <span className="reports-kpi-label">Net Cash Movement</span>
            <span className="reports-kpi-value">{formatInr(metrics.netCashMovement)}</span>
            <span className="reports-kpi-subtext">
              Guest collections {formatInr(metrics.totalGuestCollections)} less expenses {formatInr(metrics.totalExpenses)}
            </span>
          </div>
          <div className="reports-kpi-icon-box green">
            <FiPercent />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="reports-tab-nav">
        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiPieChart /> Revenue Overview & P&L
        </button>
        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'gst' ? 'active' : ''}`}
          onClick={() => setActiveTab('gst')}
        >
          <FiFileText /> GST & CA Filing (GSTR-1)
        </button>
        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'cashflow' ? 'active' : ''}`}
          onClick={() => setActiveTab('cashflow')}
        >
          <FiLayers /> Cash Flow & Expenses
        </button>
      </div>

      {/* Tab 1: Revenue Overview & P&L */}
      {activeTab === 'overview' && (
        <div className="reports-panel">
          <div className="reports-two-col">
            {/* P&L Statement Summary Card */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <FiDollarSign /> Profit & Loss Breakdown
                  </h3>
                  <p className="reports-card-desc">Financial distribution for selected period</p>
                </div>
              </div>

              <div className="breakdown-list">
                <div className="breakdown-item">
                  <div className="breakdown-row">
                    <span className="breakdown-label">Net Room Revenue (Without GST)</span>
                    <span className="breakdown-val">{formatInr(metrics.totalNetRevenue)}</span>
                  </div>
                  <div className="breakdown-track">
                    <div className="breakdown-bar" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div className="breakdown-item">
                  <div className="breakdown-row">
                    <span className="breakdown-label">Output GST (5% Accommodation)</span>
                    <span className="breakdown-val">+{formatInr(metrics.totalGstCollected)}</span>
                  </div>
                  <div className="breakdown-track">
                    <div
                      className="breakdown-bar purple"
                      style={{
                        width: `${metrics.totalGrossTotal > 0 ? (metrics.totalGstCollected / metrics.totalGrossTotal) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="breakdown-item">
                  <div className="breakdown-row">
                    <span className="breakdown-label">Gross Total Billed (Invoice Total)</span>
                    <span className="breakdown-val">{formatInr(metrics.totalGrossTotal)}</span>
                  </div>
                </div>

                <div className="breakdown-item">
                  <div className="breakdown-row">
                    <span className="breakdown-label">Guest Collections Received</span>
                    <span className="breakdown-val">{formatInr(metrics.totalGuestCollections)}</span>
                  </div>
                  <div className="breakdown-track">
                    <div
                      className="breakdown-bar green"
                      style={{
                        width: `${metrics.totalGrossTotal > 0 ? (metrics.totalGuestCollections / metrics.totalGrossTotal) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="breakdown-item">
                  <div className="breakdown-row">
                    <span className="breakdown-label">Caretaker Expenses (Petty Cash Debits)</span>
                    <span className="breakdown-val">−{formatInr(metrics.totalExpenses)}</span>
                  </div>
                </div>

                <div
                  className="breakdown-item"
                  style={{
                    paddingTop: '8px',
                    borderTop: '1px solid #f1f5f9'
                  }}
                >
                  <div className="breakdown-row">
                    <span className="breakdown-label" style={{ fontWeight: 650, color: '#0f172a' }}>
                      Net Cash Movement
                    </span>
                    <span className="breakdown-val" style={{ color: '#059669', fontSize: '1rem' }}>
                      {formatInr(metrics.netCashMovement)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Channel & Source Distribution Card */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <FiLayers /> Booking Channel Share
                  </h3>
                  <p className="reports-card-desc">Revenue contribution by booking source</p>
                </div>
              </div>

              <div className="breakdown-list">
                {Object.keys(metrics.channelBreakdown).length === 0 ? (
                  <div className="reports-empty">No bookings recorded for this period</div>
                ) : (
                  Object.entries(metrics.channelBreakdown).map(([source, amount]) => {
                    const percent =
                      metrics.totalNetRevenue > 0
                        ? Math.round((amount / metrics.totalNetRevenue) * 100)
                        : 0;
                    return (
                      <div key={source} className="breakdown-item">
                        <div className="breakdown-row">
                          <span className="breakdown-label">{source}</span>
                          <span className="breakdown-val">
                            {formatInr(amount)} ({percent}%)
                          </span>
                        </div>
                        <div className="breakdown-track">
                          <div className="breakdown-bar" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Bookings Summary Table */}
          <div className="reports-card">
            <div className="reports-card-header">
              <div>
                <h3 className="reports-card-title">
                  <FiCalendar /> Booking Records ({filteredBookings.length})
                </h3>
                <p className="reports-card-desc">
                  Displaying {withGst ? 'Gross Total (With GST)' : 'Net Tariff (Without GST)'}
                </p>
              </div>
              <button type="button" className="reports-export-btn" onClick={handleExportCsv}>
                <FiDownload /> Export CSV
              </button>
            </div>

            <div className="reports-table-responsive">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Booking Ref</th>
                    <th>Guest</th>
                    <th>Stay Dates</th>
                    <th>Property</th>
                    <th>Channel</th>
                    <th className="text-right">Taxable Value</th>
                    <th className="text-right">GST (5%)</th>
                    <th className="text-right">{withGst ? 'Gross Total' : 'Net Total'}</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="reports-empty">
                        No bookings found for the selected range.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const gross = Number(b.totalAmount) || 0;
                      const gst =
                        b.roomGstAmount !== undefined && b.roomGstAmount !== null
                          ? Number(b.roomGstAmount)
                          : (gross * (5 / 105));
                      const net = Math.max(0, gross - gst);

                      return (
                        <tr key={b.id || b.dbId}>
                          <td>
                            <strong>{b.id}</strong>
                          </td>
                          <td>
                            <span>{b.guestName || 'Guest'}</span>
                          </td>
                          <td>
                            {b.checkIn} → {b.checkOut}
                          </td>
                          <td>{b.propertyName || 'Property'}</td>
                          <td>{b.bookingSource || 'Direct'}</td>
                          <td className="text-right">{formatInr(net)}</td>
                          <td className="text-right">{formatInr(gst)}</td>
                          <td className="text-right">
                            <strong>{formatInr(withGst ? gross : net)}</strong>
                          </td>
                          <td className="text-right">
                            <span
                              className={`status-badge ${
                                (b.paymentStatus || '').toLowerCase() === 'paid'
                                  ? 'status-active'
                                  : 'status-inactive'
                              }`}
                            >
                              {b.paymentStatus || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: GST & CA Filing */}
      {activeTab === 'gst' && (
        <div className="reports-panel">
          {/* PRD Scope Note / Disclaimer Banner */}
          <div className="reports-disclaimer-banner">
            <FiInfo className="disclaimer-icon" />
            <span>
              <strong>Note:</strong> Basic GST reporting for operational reference & CA export. StayOps MVP excludes accounting-grade ERP reconciliation. Please verify final GSTR-1 filings with your Chartered Accountant.
            </span>
          </div>

          {/* GST Slabs Summary Grid */}
          <div className="reports-two-col">
            {/* 5% Slab Card */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <span className="gst-slab-pill slab5">5% Accommodation GST</span>
                  </h3>
                  <p className="reports-card-desc">Tariffs up to ₹7,500/day (CGST 2.5% + SGST 2.5%)</p>
                </div>
              </div>
              <div className="breakdown-list">
                <div className="breakdown-row">
                  <span className="breakdown-label">Taxable Value</span>
                  <span className="breakdown-val">{formatInr(metrics.gstSlabs.slab5.taxable)}</span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-label">CGST (2.5%)</span>
                  <span className="breakdown-val">{formatInr(metrics.gstSlabs.slab5.cgst)}</span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-label">SGST (2.5%)</span>
                  <span className="breakdown-val">{formatInr(metrics.gstSlabs.slab5.sgst)}</span>
                </div>
                <div className="breakdown-row" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  <span className="breakdown-label" style={{ fontWeight: 600 }}>
                    Total 5% GST
                  </span>
                  <span className="breakdown-val" style={{ color: '#0d9488', fontWeight: 650 }}>
                    {formatInr(metrics.gstSlabs.slab5.totalGst)}
                  </span>
                </div>
              </div>
            </div>

            {/* 18% Slab Card */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <span className="gst-slab-pill slab18">18% Luxury GST</span>
                  </h3>
                  <p className="reports-card-desc">Luxury tariffs above ₹7,500/day (CGST 9% + SGST 9%)</p>
                </div>
              </div>
              <div className="breakdown-list">
                <div className="breakdown-row">
                  <span className="breakdown-label">Taxable Value</span>
                  <span className="breakdown-val">{formatInr(metrics.gstSlabs.slab18.taxable)}</span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-label">CGST (9%)</span>
                  <span className="breakdown-val">{formatInr(metrics.gstSlabs.slab18.cgst)}</span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-label">SGST (9%)</span>
                  <span className="breakdown-val">{formatInr(metrics.gstSlabs.slab18.sgst)}</span>
                </div>
                <div className="breakdown-row" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  <span className="breakdown-label" style={{ fontWeight: 600 }}>
                    Total 18% GST
                  </span>
                  <span className="breakdown-val" style={{ color: '#7e22ce', fontWeight: 650 }}>
                    {formatInr(metrics.gstSlabs.slab18.totalGst)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Invoice Ledger */}
          <div className="reports-card">
            <div className="reports-card-header">
              <div>
                <h3 className="reports-card-title">
                  <FiFileText /> GSTR-1 Tax Invoice Ledger
                </h3>
                <p className="reports-card-desc">
                  Pre-formatted tax schedule for Chartered Accountant filing (B2C & B2B)
                </p>
              </div>
              <button type="button" className="reports-export-btn primary" onClick={handleExportCsv}>
                <FiDownload /> Export GSTR-1 (CSV)
              </button>
            </div>

            <div className="reports-table-responsive">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Invoice / Ref</th>
                    <th>Date</th>
                    <th>Guest Name</th>
                    <th>Place of Supply</th>
                    <th className="text-right">Taxable Value</th>
                    <th>GST Rate</th>
                    <th className="text-right">CGST</th>
                    <th className="text-right">SGST</th>
                    <th className="text-right">Total Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="reports-empty">
                        No tax invoices found for this range.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const gross = Number(b.totalAmount) || 0;
                      const gst =
                        b.roomGstAmount !== undefined && b.roomGstAmount !== null
                          ? Number(b.roomGstAmount)
                          : (gross * (5 / 105));
                      const net = Math.max(0, gross - gst);
                      const nights = calculateNights(b.checkIn, b.checkOut);
                      const isHighSlab = net / nights > 7500;
                      const rate = isHighSlab ? '18%' : '5%';
                      const cgst = gst / 2;
                      const sgst = gst / 2;

                      return (
                        <tr key={b.id || b.dbId}>
                          <td>
                            <strong>{b.id}</strong>
                          </td>
                          <td>{b.createdAt ? b.createdAt.substring(0, 10) : b.checkIn}</td>
                          <td>{b.guestName || 'Guest'}</td>
                          <td>{b.guestState || 'Karnataka (29)'}</td>
                          <td className="text-right">{formatInr(net)}</td>
                          <td>
                            <span className={`gst-slab-pill ${isHighSlab ? 'slab18' : 'slab5'}`}>
                              {rate}
                            </span>
                          </td>
                          <td className="text-right">{formatInr(cgst)}</td>
                          <td className="text-right">{formatInr(sgst)}</td>
                          <td className="text-right">
                            <strong>{formatInr(gross)}</strong>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cash Flow & Operations */}
      {activeTab === 'cashflow' && (
        <div className="reports-panel">
          <div className="reports-two-col">
            {/* Operational Inflow vs Outflow */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <FiTrendingUp /> Cash Flow Summary
                  </h3>
                  <p className="reports-card-desc">Collected funds vs on-ground caretaker expenses</p>
                </div>
              </div>

              <div className="breakdown-list">
                <div className="breakdown-item">
                  <div className="breakdown-row">
                    <span className="breakdown-label">Guest Collections Received</span>
                    <span className="breakdown-val" style={{ color: '#059669' }}>
                      +{formatInr(metrics.totalGuestCollections)}
                    </span>
                  </div>
                </div>

                <div className="breakdown-item">
                  <div className="breakdown-row">
                    <span className="breakdown-label">Caretaker Expenses (Petty Cash Debits)</span>
                    <span className="breakdown-val" style={{ color: '#dc2626' }}>
                      −{formatInr(metrics.totalExpenses)}
                    </span>
                  </div>
                </div>

                <div
                  className="breakdown-item"
                  style={{
                    paddingTop: '10px',
                    borderTop: '1px solid #f1f5f9'
                  }}
                >
                  <div className="breakdown-row">
                    <span className="breakdown-label" style={{ fontWeight: 650, color: '#0f172a' }}>
                      Net Cash Movement
                    </span>
                    <span className="breakdown-val" style={{ color: '#059669', fontSize: '1.1rem' }}>
                      {formatInr(metrics.netCashMovement)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Caretaker Expense Categories */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <FiLayers /> Caretaker Expense Categories
                  </h3>
                  <p className="reports-card-desc">Breakdown of on-ground property expenses</p>
                </div>
              </div>

              <div className="breakdown-list">
                {Object.keys(metrics.expenseCategoryBreakdown).length === 0 ? (
                  <div className="reports-empty">No petty cash expenses logged for this period</div>
                ) : (
                  Object.entries(metrics.expenseCategoryBreakdown).map(([cat, amt]) => {
                    const percent =
                      metrics.totalExpenses > 0
                        ? Math.round((amt / metrics.totalExpenses) * 100)
                        : 0;
                    return (
                      <div key={cat} className="breakdown-item">
                        <div className="breakdown-row">
                          <span className="breakdown-label">{cat}</span>
                          <span className="breakdown-val">
                            {formatInr(amt)} ({percent}%)
                          </span>
                        </div>
                        <div className="breakdown-track">
                          <div
                            className="breakdown-bar amber"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
