import React, { useState, useEffect } from "react";
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiHelpCircle,
} from "react-icons/fi";
import "./CancellationPolicyModal.css";
import { normalizeCancellationRules, generateCancellationPreview } from "../policyUtils";

export default function CancellationPolicyModal({
  isOpen,
  policyData,
  onClose,
  onSave,
}) {
  const [noCancellationPolicy, setNoCancellationPolicy] = useState(
    policyData?.noCancellationPolicy || false
  );
  const [activeTab, setActiveTab] = useState("BEFORE_CHECKIN"); // 'BEFORE_CHECKIN' | 'AFTER_RESERVATION' | 'PRESETS'
  const [rules, setRules] = useState([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(policyData?.cancellationRulesJson || "[]");
      setRules(normalizeCancellationRules(parsed));
    } catch (e) {
      setRules(normalizeCancellationRules([]));
    }
  }, [policyData]);

  if (!isOpen) return null;

  const handleAddRule = () => {
    const newRule = {
      id: Date.now().toString(),
      type: activeTab,
      chargeValue: activeTab === "AFTER_RESERVATION" ? 100 : 20,
      chargeType: "PERCENTAGE",
      beforeValue: 1,
      beforeUnit: "Day",
      afterTiming: "IMMEDIATELY",
      active: true,
    };
    setRules((prev) => [...prev, newRule]);
  };

  const handleToggleRule = (id) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const handleDeleteRule = (id) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRuleChange = (id, field, value) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const applyPreset = (presetType) => {
    if (rules.length > 0) {
      const confirmOverwrite = window.confirm(
        "Applying this preset will replace your current cancellation rules. Continue?"
      );
      if (!confirmOverwrite) return;
    }

    setNoCancellationPolicy(false);
    if (presetType === "FLEXIBLE") {
      setRules([
        {
          id: Date.now().toString(),
          type: "BEFORE_CHECKIN",
          chargeValue: 100,
          chargeType: "PERCENTAGE",
          beforeValue: 1,
          beforeUnit: "Day",
          afterTiming: "IMMEDIATELY",
          active: true,
        },
      ]);
    } else if (presetType === "MODERATE") {
      setRules([
        {
          id: Date.now().toString(),
          type: "BEFORE_CHECKIN",
          chargeValue: 50,
          chargeType: "PERCENTAGE",
          beforeValue: 7,
          beforeUnit: "Day",
          afterTiming: "IMMEDIATELY",
          active: true,
        },
      ]);
    } else if (presetType === "STRICT") {
      setRules([
        {
          id: Date.now().toString(),
          type: "BEFORE_CHECKIN",
          chargeValue: 100,
          chargeType: "PERCENTAGE",
          beforeValue: 14,
          beforeUnit: "Day",
          afterTiming: "IMMEDIATELY",
          active: true,
        },
      ]);
    } else if (presetType === "NON_REFUNDABLE") {
      setRules([
        {
          id: Date.now().toString(),
          type: "AFTER_RESERVATION",
          chargeValue: 100,
          chargeType: "PERCENTAGE",
          beforeValue: 0,
          beforeUnit: "Day",
          afterTiming: "IMMEDIATELY",
          active: true,
        },
      ]);
    }
  };

  const handleSave = () => {
    const cleanedRules = rules.map((r) => ({
      ...r,
      chargeValue: r.chargeValue === "" || isNaN(Number(r.chargeValue)) ? 0 : Number(r.chargeValue),
      beforeValue: r.beforeValue === "" || isNaN(Number(r.beforeValue)) ? 0 : Number(r.beforeValue),
    }));

    onSave({
      ...policyData,
      noCancellationPolicy,
      cancellationRulesJson: JSON.stringify(cleanedRules),
    });
  };

  const filteredRules = rules.filter((r) => r.type === activeTab);
  const previewSentences = generateCancellationPreview(rules, noCancellationPolicy, activeTab);

  return (
    <div className="cpm-backdrop" onClick={onClose}>
      <div className="cpm-modal" onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="cpm-header">
          <h3>Cancellation policy</h3>
          <button
            type="button"
            className="cpm-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="cpm-body">
          {/* NO CANCELLATION POLICY CHECKBOX */}
          <div className="cpm-no-policy-row">
            <label className="cpm-checkbox-label">
              <input
                type="checkbox"
                checked={noCancellationPolicy}
                onChange={(e) => setNoCancellationPolicy(e.target.checked)}
              />
              <span>
                <strong>No cancellation policy</strong>
                <span className="cpm-help-text">
                  No booking amount deducted with no cancellation policy
                </span>
              </span>
            </label>
          </div>

          {!noCancellationPolicy && (
            <>
              {/* SUB-TABS BAR */}
              <div className="cpm-tabs-bar">
                <div className="cpm-tabs">
                  <button
                    type="button"
                    className={`cpm-tab ${activeTab === "BEFORE_CHECKIN" ? "active" : ""}`}
                    onClick={() => setActiveTab("BEFORE_CHECKIN")}
                  >
                    Before Check-ins
                  </button>
                  <button
                    type="button"
                    className={`cpm-tab ${activeTab === "AFTER_RESERVATION" ? "active" : ""}`}
                    onClick={() => setActiveTab("AFTER_RESERVATION")}
                  >
                    After reservation
                  </button>
                  <button
                    type="button"
                    className={`cpm-tab ${activeTab === "PRESETS" ? "active" : ""}`}
                    onClick={() => setActiveTab("PRESETS")}
                  >
                    Policy Presets <FiHelpCircle size={14} className="cpm-idea-icon" />
                  </button>
                </div>

                {activeTab !== "PRESETS" && (
                  <button
                    type="button"
                    className="cpm-add-rule-btn"
                    onClick={handleAddRule}
                  >
                    <FiPlus size={14} /> Add rule +
                  </button>
                )}
              </div>

              {activeTab === "PRESETS" ? (
                /* PRESETS TAB */
                <div className="cpm-presets-section">
                  <p className="cpm-section-desc">
                    Use OTA-style presets as a starting point for your property rules.
                  </p>

                  <div className="cpm-preset-grid">
                    <div className="cpm-preset-card" onClick={() => applyPreset("FLEXIBLE")}>
                      <span className="cpm-preset-badge green">Flexible</span>
                      <h4>Flexible (24 Hours)</h4>
                      <p>100% refund up to 1 day before arrival. 100% penalty within 24 hours.</p>
                      <span className="cpm-preset-ota">Preset Style: Flexible 24h</span>
                    </div>

                    <div className="cpm-preset-card" onClick={() => applyPreset("MODERATE")}>
                      <span className="cpm-preset-badge blue">Moderate</span>
                      <h4>Moderate (7 Days)</h4>
                      <p>100% refund up to 7 days before arrival. 50% penalty if cancelled within 7 days.</p>
                      <span className="cpm-preset-ota">Preset Style: Moderate 7D</span>
                    </div>

                    <div className="cpm-preset-card" onClick={() => applyPreset("STRICT")}>
                      <span className="cpm-preset-badge purple">Strict</span>
                      <h4>Strict (14 Days)</h4>
                      <p>100% refund up to 14 days before arrival. 100% penalty within 14 days.</p>
                      <span className="cpm-preset-ota">Preset Style: Strict 14D</span>
                    </div>

                    <div className="cpm-preset-card" onClick={() => applyPreset("NON_REFUNDABLE")}>
                      <span className="cpm-preset-badge red">Non-Refundable</span>
                      <h4>Non-Refundable (100% Fee)</h4>
                      <p>0% refund at any time. Booking is 100% non-refundable immediately upon reservation.</p>
                      <span className="cpm-preset-ota">Preset Style: Non-Refundable</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* RULES EDITOR LIST */
                <div className="cpm-rules-section">
                  <div className="cpm-rules-table-container">
                    <table className="cpm-rules-table">
                      <colgroup>
                        <col className="col-charge" />
                        <col className="col-when" />
                        <col className="col-active" />
                        <col className="col-actions" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>CHARGE</th>
                          <th>{activeTab === "BEFORE_CHECKIN" ? "WHEN CANCELLATION IS MADE" : "WHEN"}</th>
                          <th style={{ textAlign: "center" }}>ACTIVE</th>
                          <th style={{ textAlign: "center" }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRules.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="cpm-empty-table">
                              No rules added for this tab yet. Click <strong>Add rule +</strong> to create one.
                            </td>
                          </tr>
                        ) : (
                          filteredRules.map((rule) => (
                            <tr key={rule.id}>
                              {/* CHARGE COLUMN */}
                              <td>
                                <div className="cpm-rule-inputs">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100000"
                                    className="cpm-num-input"
                                    value={rule.chargeValue}
                                    onChange={(e) =>
                                      handleRuleChange(
                                        rule.id,
                                        "chargeValue",
                                        e.target.value === "" ? "" : Number(e.target.value)
                                      )
                                    }
                                  />
                                  <select
                                    className="cpm-select-input"
                                    value={rule.chargeType}
                                    onChange={(e) =>
                                      handleRuleChange(
                                        rule.id,
                                        "chargeType",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="PERCENTAGE">Percentage (%)</option>
                                    <option value="NIGHTS">Night(s) tariff</option>
                                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                                  </select>
                                  {rule.chargeType === "PERCENTAGE" && (
                                    <span className="cpm-inline-label">of booking amount</span>
                                  )}
                                </div>
                              </td>

                              {/* WHEN / TRIGGER COLUMN */}
                              <td>
                                {rule.type === "BEFORE_CHECKIN" ? (
                                  <div className="cpm-rule-inputs">
                                    <input
                                      type="number"
                                      min="0"
                                      max="365"
                                      className="cpm-num-input"
                                      value={rule.beforeValue}
                                      onChange={(e) =>
                                        handleRuleChange(
                                          rule.id,
                                          "beforeValue",
                                          e.target.value === "" ? "" : Number(e.target.value)
                                        )
                                      }
                                    />
                                    <select
                                      className="cpm-select-input"
                                      value={rule.beforeUnit}
                                      onChange={(e) =>
                                        handleRuleChange(
                                          rule.id,
                                          "beforeUnit",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="Day">Day</option>
                                      <option value="Hour">Hour</option>
                                    </select>
                                    <span className="cpm-inline-label">before check-in</span>
                                  </div>
                                ) : (
                                  <div className="cpm-rule-inputs">
                                    <select
                                      className="cpm-select-input wide"
                                      value={rule.afterTiming}
                                      onChange={(e) =>
                                        handleRuleChange(
                                          rule.id,
                                          "afterTiming",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="IMMEDIATELY">Immediately after reservation</option>
                                      <option value="WITHIN_24H">Within 24 hours of reservation</option>
                                      <option value="WITHIN_48H">Within 48 hours of reservation</option>
                                    </select>
                                  </div>
                                )}
                              </td>

                              {/* ACTIVE COLUMN */}
                              <td style={{ textAlign: "center" }}>
                                <label className="cpm-switch">
                                  <input
                                    type="checkbox"
                                    checked={rule.active}
                                    onChange={() => handleToggleRule(rule.id)}
                                  />
                                  <span className="cpm-slider"></span>
                                </label>
                              </td>

                              {/* ACTIONS COLUMN */}
                              <td style={{ textAlign: "center" }}>
                                <button
                                  type="button"
                                  className="cpm-icon-btn delete"
                                  onClick={() => handleDeleteRule(rule.id)}
                                  title="Delete rule"
                                >
                                  <FiTrash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* LIVE CANCELLATION POLICY PREVIEW */}
          <div className="cpm-preview-box">
            <h4>Cancellation policy preview</h4>
            <span className="cpm-preview-sub">
              {activeTab === "BEFORE_CHECKIN"
                ? "Before Check-ins rules"
                : activeTab === "AFTER_RESERVATION"
                ? "After reservation rules"
                : "Active Policy Summary"}
            </span>

            <div className="cpm-preview-list">
              {previewSentences.map((line, idx) => (
                <div key={idx} className="cpm-preview-item">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="cpm-footer">
          <button
            type="button"
            className="cpm-btn secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cpm-btn primary"
            onClick={handleSave}
          >
            Save Policy
          </button>
        </div>
      </div>
    </div>
  );
}


