import React, { useState, useEffect } from "react";
import {
  FiInfo,
  FiChevronRight,
  FiHelpCircle,
} from "react-icons/fi";
import { API_BASE_URL } from "../../../../config/api";
import { toast } from "react-toastify";
import "./PoliciesSettings.css";

import { getCancellationPolicySummary } from "../../../../utils/policyEvaluator";
import CancellationPolicyModal from "./modals/CancellationPolicyModal";
import GenericPolicyModal from "./modals/GenericPolicyModal";
import { DEFAULT_POLICY_DATA } from "./policyDefaults";
import { parseChildPolicy } from "./policyUtils";

export default function PoliciesSettings({ propertyId: initialPropertyId }) {
  const [resolvedPropId, setResolvedPropId] = useState(initialPropertyId || null);
  const [userProperties, setUserProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [policyData, setPolicyData] = useState(DEFAULT_POLICY_DATA);
  const [activeModal, setActiveModal] = useState(null); // 'cancellation' | 'terms' | 'privacy' | 'refund' | 'child'

  useEffect(() => {
    setResolvedPropId(initialPropertyId || null);
  }, [initialPropertyId]);

  useEffect(() => {
    fetchPolicies();
  }, [resolvedPropId]);

  // Helper functions for modular data loading
  const loadUserProperties = async (token) => {
    const propsRes = await fetch(`${API_BASE_URL}/properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!propsRes.ok) return [];
    const myProps = await propsRes.json();
    return Array.isArray(myProps) ? myProps : [];
  };

  const resolvePropertyId = (myProps, currentId) => {
    if (myProps.length === 0) return null;
    const storedId = localStorage.getItem("activePropertyId") || localStorage.getItem("selectedPropertyId") || localStorage.getItem("propertyId");
    const targetId = currentId || storedId;
    const isOwned = myProps.some(p => String(p.id) === String(targetId));
    return (targetId && isOwned) ? Number(targetId) : myProps[0].id;
  };

  const loadPolicySettings = async (token, propertyId) => {
    const res = await fetch(`${API_BASE_URL}/properties/${propertyId}/policies`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch policies (HTTP ${res.status})`);
    }
    const data = await res.json();
    return {
      noCancellationPolicy: data.noCancellationPolicy ?? DEFAULT_POLICY_DATA.noCancellationPolicy,
      cancellationRulesJson: data.cancellationRulesJson || DEFAULT_POLICY_DATA.cancellationRulesJson,
      termsAndConditions: data.termsAndConditions || DEFAULT_POLICY_DATA.termsAndConditions,
      privacyPolicy: data.privacyPolicy || DEFAULT_POLICY_DATA.privacyPolicy,
      refundPolicy: data.refundPolicy || DEFAULT_POLICY_DATA.refundPolicy,
      childAgePolicyJson: data.childAgePolicyJson || DEFAULT_POLICY_DATA.childAgePolicyJson,
    };
  };

  const fetchPolicies = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required to access property policies.");
        return;
      }

      const myProps = await loadUserProperties(token);
      setUserProperties(myProps);
      const activeId = resolvePropertyId(myProps, resolvedPropId);

      if (!activeId) {
        setResolvedPropId(null);
        return;
      }

      if (activeId !== resolvedPropId) {
        setResolvedPropId(activeId);
      }

      const policySettings = await loadPolicySettings(token, activeId);
      setPolicyData(policySettings);
    } catch (err) {
      console.error("Error loading policies:", err);
      setError("Unable to load policy settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicies = async (updatedData) => {
    if (!resolvedPropId) {
      toast.error("No active property found to save policies for.");
      return false;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required: Only logged-in property owners can modify policies.");
      return false;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/properties/${resolvedPropId}/policies`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (res.status === 401 || res.status === 403) {
        toast.error("Unauthorized: Only the logged-in property owner can modify policy settings.");
        return false;
      }

      if (res.ok) {
        const saved = await res.json();
        setPolicyData(saved);
        toast.success("Policy settings updated successfully!");
        return true;
      } else {
        toast.error("Failed to save policy settings.");
        return false;
      }
    } catch (err) {
      console.error("Error saving policies:", err);
      toast.error("Failed to save policy settings");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Summary Generators
  const getCancellationSummary = () => {
    return getCancellationPolicySummary(policyData) || "Cancellation policy not configured";
  };

  const getChildSummary = () => {
    const childObj = parseChildPolicy(policyData.childAgePolicyJson);
    return `Free for children under ${childObj.freeChildMaxAge} yrs. Children ${childObj.freeChildMaxAge}–${childObj.childAgeMax} yrs charged ₹${childObj.childExtraCharge}/night.`;
  };

  if (loading) {
    return (
      <div className="tax-settings-loading">
        <div className="tax-loading-spinner"></div>
        <p>Loading Policies...</p>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="policies-container">
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '24px', textAlign: 'center', margin: '40px auto', maxWidth: 480 }}>
          <h3 style={{ color: '#DC2626', marginBottom: 8, fontSize: 18 }}>Unable to Load Policies</h3>
          <p style={{ color: '#7F1D1D', fontSize: 14, marginBottom: 16 }}>{error}</p>
          <button
            type="button"
            className="res-btn res-btn-primary"
            style={{ background: '#DC2626', borderColor: '#DC2626', padding: '8px 20px', borderRadius: 8, color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
            onClick={fetchPolicies}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="policies-container">
      {/* PAGE HEADER */}
      <div className="policies-header">
        <div>
          <h2>Policies</h2>
          <p className="policies-subtitle">
            Configure stay rules, cancellation policies, refund terms, and guest agreements for this property.
          </p>
        </div>

        {userProperties.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F1F5F9', padding: '6px 12px', borderRadius: 10, border: '1px solid #CBD5E1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Editing Policy For:
            </label>
            <select
              value={resolvedPropId || ''}
              onChange={(e) => setResolvedPropId(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #0284C7',
                fontSize: 13.5,
                fontWeight: 700,
                color: '#0369A1',
                background: '#FFFFFF',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {userProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* POLICIES CARD GRID */}
      <div className="policies-grid">
        {/* CARD 1: CANCELLATION POLICY */}
        <div
          className="policy-card"
          onClick={() => setActiveModal("cancellation")}
        >
          <div className="policy-card-left">
            <div className="policy-card-title-row">
              <h3>Cancellation policy</h3>
              <FiInfo className="policy-info-icon" title="Cancellation rules and penalty tiers" />
            </div>
            <p className="policy-card-desc">{getCancellationSummary()}</p>
          </div>
          <div className="policy-card-right">
            <FiChevronRight size={20} className="policy-chevron" />
          </div>
        </div>

        {/* CARD 2: TERMS AND CONDITIONS */}
        <div
          className="policy-card"
          onClick={() => setActiveModal("terms")}
        >
          <div className="policy-card-left">
            <div className="policy-card-title-row">
              <h3>Terms and conditions</h3>
              <FiInfo className="policy-info-icon" title="Guest responsibilities & stay agreement" />
            </div>
            <p className="policy-card-desc">
              {policyData.termsAndConditions ||
                "Defines the rules, responsibilities, and agreements for using our services and products."}
            </p>
          </div>
          <div className="policy-card-right">
            <FiChevronRight size={20} className="policy-chevron" />
          </div>
        </div>

        {/* CARD 3: PRIVACY POLICY */}
        <div
          className="policy-card"
          onClick={() => setActiveModal("privacy")}
        >
          <div className="policy-card-left">
            <div className="policy-card-title-row">
              <h3>Privacy policy</h3>
              <FiInfo className="policy-info-icon" title="Data protection & privacy terms" />
            </div>
            <p className="policy-card-desc">
              {policyData.privacyPolicy ||
                "Outlines how we collect, use, and protect your personal information."}
            </p>
          </div>
          <div className="policy-card-right">
            <FiChevronRight size={20} className="policy-chevron" />
          </div>
        </div>

        {/* CARD 4: REFUND POLICY */}
        <div
          className="policy-card"
          onClick={() => setActiveModal("refund")}
        >
          <div className="policy-card-left">
            <div className="policy-card-title-row">
              <h3>Refund policy</h3>
              <FiInfo className="policy-info-icon" title="Refund timelines & conditions" />
            </div>
            <p className="policy-card-desc">
              {policyData.refundPolicy ||
                "Explains the conditions and process for requesting and receiving refunds."}
            </p>
          </div>
          <div className="policy-card-right">
            <FiChevronRight size={20} className="policy-chevron" />
          </div>
        </div>

        {/* CARD 5: CHILD AGE POLICY */}
        <div
          className="policy-card"
          onClick={() => setActiveModal("child")}
        >
          <div className="policy-card-left">
            <div className="policy-card-title-row">
              <h3>Child age policy</h3>
              <FiInfo className="policy-info-icon" title="Children stay and extra bed rules" />
            </div>
            <p className="policy-card-desc">{getChildSummary()}</p>
          </div>
          <div className="policy-card-right">
            <FiChevronRight size={20} className="policy-chevron" />
          </div>
        </div>
      </div>

      <div className="policies-footer-note">
        <FiHelpCircle size={15} />
        <span>Learn more about <a href="#policies-help" onClick={(e) => { e.preventDefault(); alert("StayOps Property Policies sync automatically with your invoices, vouchers, and direct booking engine!"); }}>Policies &amp; OTA Synchronization</a></span>
      </div>

      {/* CANCELLATION POLICY MODAL */}
      {activeModal === "cancellation" && (
        <CancellationPolicyModal
          isOpen={true}
          policyData={policyData}
          onClose={() => setActiveModal(null)}
          onSave={async (newPolicyData) => {
            const success = await handleSavePolicies(newPolicyData);
            if (success) {
              setActiveModal(null);
            }
          }}
        />
      )}

      {/* GENERIC POLICY MODALS (TERMS, PRIVACY, REFUND, CHILD) */}
      {activeModal && activeModal !== "cancellation" && (
        <GenericPolicyModal
          isOpen={true}
          type={activeModal}
          policyData={policyData}
          onClose={() => setActiveModal(null)}
          onSave={async (updatedFieldData) => {
            const newPolicyData = { ...policyData, ...updatedFieldData };
            const success = await handleSavePolicies(newPolicyData);
            if (success) {
              setActiveModal(null);
            }
          }}
        />
      )}
    </div>
  );
}
