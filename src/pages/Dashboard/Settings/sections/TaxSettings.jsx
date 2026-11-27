import React, { useState, useEffect } from "react";
import { FiSave, FiAlertTriangle, FiCheckCircle, FiInfo } from "react-icons/fi";
import { API_BASE_URL } from "../../../../config/api";
import { toast } from "react-toastify";
import "./TaxSettings.css";

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

export default function TaxSettings({ propertyId: initialPropertyId }) {
  const [propertiesList, setPropertiesList] = useState([]);
  const [resolvedPropId, setResolvedPropId] = useState(initialPropertyId || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    isGstRegistered: false,
    gstin: "",
    taxesEnabled: true,
    taxMode: "SLAB_INDIA_GST",
    fixedTaxRate: 12,
    taxInclusive: false,
    serviceChargeEnabled: true,
    serviceChargePercent: 10,
    specifiedPremises: "NOT_DECLARED"
  });

  useEffect(() => {
    fetchTaxSettings();
  }, [resolvedPropId]);

  const fetchTaxSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      let currentId = resolvedPropId;
      if (propertiesList.length === 0) {
        const propsRes = await fetch(`${API_BASE_URL}/properties`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" }
        });
        if (propsRes.ok) {
          const props = await propsRes.json();
          const list = Array.isArray(props) ? props : [];
          setPropertiesList(list);
          if (list.length > 0 && !currentId) {
            currentId = list[0].id;
            setResolvedPropId(currentId);
          }
        }
      }

      if (!currentId) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/properties/${currentId}/taxes`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          isGstRegistered: data.isGstRegistered ?? false,
          gstin: data.gstin || "",
          taxesEnabled: data.taxesEnabled ?? true,
          taxMode: data.taxMode || "SLAB_INDIA_GST",
          fixedTaxRate: data.fixedTaxRate ?? 12,
          taxInclusive: data.taxInclusive ?? false,
          serviceChargeEnabled: data.serviceChargeEnabled ?? true,
          serviceChargePercent: data.serviceChargePercent ?? 10,
          specifiedPremises: data.specifiedPremises || "NOT_DECLARED"
        });
      }
    } catch (err) {
      console.error("Failed to load property tax settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field) => {
    setFormData(prev => {
      const nextVal = !prev[field];
      if (field === "isGstRegistered" && !nextVal) {
        return { ...prev, isGstRegistered: false, taxesEnabled: false };
      }
      return { ...prev, [field]: nextVal };
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isGstinValid = GSTIN_REGEX.test(formData.gstin.trim());

  const isTaxActive = formData.isGstRegistered && formData.taxesEnabled;

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!resolvedPropId) {
      toast.error("No active property found to save tax settings.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/properties/${resolvedPropId}/taxes`, {
        method: "POST",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("Save tax settings response error:", res.status, errText);
        throw new Error("Failed to save tax settings: " + (errText || res.statusText));
      }
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        isGstRegistered: data.isGstRegistered ?? prev.isGstRegistered,
        gstin: data.gstin ?? prev.gstin,
        taxesEnabled: data.taxesEnabled ?? prev.taxesEnabled,
        taxMode: data.taxMode || prev.taxMode,
        fixedTaxRate: data.fixedTaxRate ?? prev.fixedTaxRate,
        taxInclusive: data.taxInclusive ?? prev.taxInclusive,
        serviceChargeEnabled: data.serviceChargeEnabled ?? prev.serviceChargeEnabled,
        serviceChargePercent: data.serviceChargePercent ?? prev.serviceChargePercent,
        specifiedPremises: data.specifiedPremises || prev.specifiedPremises
      }));
      toast.success("Taxes & Charges settings saved successfully!");
    } catch (err) {
      console.error("Error saving tax settings:", err);
      toast.error("Failed to save tax settings.");
    } finally {
      setSaving(false);
    }
  };

 if (loading) {
  return (
    <div className="tax-settings-loading">
      <div className="tax-loading-spinner"></div>
      <p>Loading tax settings...</p>
    </div>
  );
}

  return (
    <div className="tax-settings-container">
      
      {/* HEADER BAR */}
      <div className="tax-settings-header">
        <div>
          <div className="tax-header-title">
            <span className="tax-header-icon">💵</span>
            <h2>Taxes &amp; Charges</h2>
          </div>
          <p className="tax-header-subtitle">
            Same accommodation GST as hotels (5% / 18% slabs) on stay quotes
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {propertiesList.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label htmlFor="prop-tax-select" style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                Property:
              </label>
              <select
                id="prop-tax-select"
                value={resolvedPropId || ""}
                onChange={(e) => setResolvedPropId(Number(e.target.value))}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#1E293B",
                  backgroundColor: "#FFFFFF"
                }}
              >
                {propertiesList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            className="tax-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            <FiSave size={15} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="tax-settings-form">
        
        {!formData.isGstRegistered && (
          <div className="tax-warning-banner" style={{ background: "#FEF3C7", borderColor: "#F59E0B", color: "#92400E", marginBottom: 20 }}>
            <FiInfo size={22} style={{ color: "#D97706", flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: 14, display: "block", marginBottom: 2 }}>GST Registration Turned Off — Taxes System-Wide Disabled</strong>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                Since this property is not GST registered, tax calculations are completely OFF. Guest billing and vouchers will be issued as non-tax Bill of Supply receipts without any GST line items.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 1: GST REGISTRATION */}
        <div className="tax-card">
          <div className="tax-row-toggle">
            <div>
              <h3>GST registered</h3>
              <p>Your property is registered under GST. Tax invoices will be issued.</p>
            </div>
            <label className="tax-switch">
              <input
                type="checkbox"
                checked={formData.isGstRegistered}
                onChange={() => handleToggle("isGstRegistered")}
              />
              <span className="tax-slider"></span>
            </label>
          </div>

          {formData.isGstRegistered && (
            <div className="tax-field-group">
              <label className="tax-label">GSTIN *</label>
              <p className="tax-help-text">
                Required. 15-character GSTIN of this property. Taxes will not be applied until a valid GSTIN is saved.
              </p>
              <div className="tax-input-wrapper">
                <input
                  type="text"
                  maxLength={15}
                  className={`tax-input ${isGstinValid ? "valid" : "invalid"}`}
                  value={formData.gstin}
                  onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                  placeholder="29ABCDE1234F1Z5"
                />
              </div>
              {isGstinValid ? (
                <div className="gstin-badge valid">
                  <FiCheckCircle size={14} /> Valid GSTIN
                </div>
              ) : (
                <div className="gstin-badge invalid">
                  <FiAlertTriangle size={14} /> Enter a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5)
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: ENABLE TAXES */}
        <div className={`tax-card ${!formData.isGstRegistered ? "disabled-row" : ""}`}>
          <div className="tax-row-toggle">
            <div>
              <h3>Enable taxes</h3>
              <p>Turn off temporarily without changing your registration status</p>
            </div>
            <label className={`tax-switch ${!formData.isGstRegistered ? "disabled" : ""}`}>
              <input
                type="checkbox"
                checked={formData.taxesEnabled}
                disabled={!formData.isGstRegistered}
                onChange={() => handleToggle("taxesEnabled")}
              />
              <span className="tax-slider"></span>
            </label>
          </div>
        </div>

        {/* SECTION 3: TAX MODE */}
        <div className={`tax-card ${!isTaxActive ? "disabled-row" : ""}`}>
          <div className="tax-field-group">
            <h3>Tax mode</h3>
            <p className="tax-help-text">
              India GST slabs (SAC 9963, effective 22-Sep-2025): <strong>5% no-ITC</strong> for ≤ &#8377;7,500/night, <strong>18% with ITC</strong> above &#8377;7,500/night. Slab is determined by the per-night room tariff.
            </p>
            <select
              className="tax-select"
              value={formData.taxMode}
              disabled={!isTaxActive}
              onChange={(e) => handleChange("taxMode", e.target.value)}
            >
              <option value="SLAB_INDIA_GST">Slab (India GST)</option>
              <option value="FIXED_PERCENT">Fixed Percentage</option>
              <option value="EXEMPT">Exempt (0% Tax)</option>
            </select>
          </div>

          {formData.taxMode === "FIXED_PERCENT" && (
            <div className="tax-field-group" style={{ marginTop: 16 }}>
              <label className="tax-label">Fixed Tax Rate (%)</label>
              <div className="tax-input-with-symbol">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="tax-input"
                  value={formData.fixedTaxRate}
                  onChange={(e) => handleChange("fixedTaxRate", Number(e.target.value))}
                />
                <span className="tax-symbol">%</span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: TAX-INCLUSIVE PRICING */}
        <div className="tax-card">
          <div className="tax-row-toggle disabled-row">
            <div>
              <h3>Tax-inclusive pricing</h3>
              <p>Not supported — tax is always added on top of the room rate. This setting is disabled.</p>
            </div>
            <label className="tax-switch disabled">
              <input
                type="checkbox"
                checked={false}
                disabled
              />
              <span className="tax-slider"></span>
            </label>
          </div>
        </div>

        {/* SECTION 5: SERVICE CHARGE */}
        <div className="tax-card">
          <div className="tax-row-toggle">
            <div>
              <h3>Service charge</h3>
              <p>Optional. Applied alongside GST on the same taxable base for all new bookings.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label className="tax-switch">
                <input
                  type="checkbox"
                  checked={formData.serviceChargeEnabled}
                  onChange={() => handleToggle("serviceChargeEnabled")}
                />
                <span className="tax-slider"></span>
              </label>

              {formData.serviceChargeEnabled && (
                <div className="tax-input-with-symbol" style={{ width: 90 }}>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    className="tax-input"
                    value={formData.serviceChargePercent}
                    onChange={(e) => handleChange("serviceChargePercent", Number(e.target.value))}
                  />
                  <span className="tax-symbol">%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 6: F&B SPECIFIED PREMISES DECLARATION */}
        <div className={`tax-card ${!isTaxActive ? "disabled-row" : ""}`}>
          <div className="tax-field-group">
            <h3>F&amp;B "Specified Premises" Declaration</h3>
            <p className="tax-help-text" style={{ lineHeight: 1.6 }}>
              Per the 22-Sep-2025 GST 2.0 rule, F&amp;B (restaurant &amp; room service) tax is a <strong>property-level flag</strong> — not per-guest, not per-room. If <strong>any room</strong> in your property is priced at <strong>&#8377;7,500 or more per night</strong>, the entire property is "specified premises" and <strong>all F&amp;B charges attract 18% GST with ITC</strong> — even for guests staying in cheaper rooms. If no room reaches &#8377;7,500, F&amp;B is taxed at 5% with no ITC.
            </p>

            <div style={{ marginTop: 14 }}>
              <label className="tax-label">Specified premises</label>
              <select
                className="tax-select"
                value={formData.specifiedPremises}
                disabled={!isTaxActive}
                onChange={(e) => handleChange("specifiedPremises", e.target.value)}
              >
                <option value="NOT_DECLARED">Not declared</option>
                <option value="YES">Yes (Specified Premises - 18% GST on F&amp;B)</option>
                <option value="NO">No (Non-Specified Premises - 5% GST on F&amp;B)</option>
              </select>
            </div>

            {formData.specifiedPremises === "NOT_DECLARED" && (
              <div className="tax-warning-banner">
                <FiAlertTriangle size={20} className="warning-icon" />
                <div>
                  <strong>Specified-premises status not yet declared for this financial year.</strong>
                  <p>F&amp;B is currently defaulting to 5% no-ITC. If your property has any room at &#8377;7,500/night or higher, please select <strong>Yes</strong> to comply with GST 2.0 rules.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SAVE BAR */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            type="submit"
            className="tax-save-btn"
            disabled={saving}
          >
            <FiSave size={15} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>

    </div>
  );
}
