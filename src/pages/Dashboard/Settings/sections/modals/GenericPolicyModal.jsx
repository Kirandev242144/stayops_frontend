import React, { useState, useEffect } from "react";
import { FiX, FiAlertCircle } from "react-icons/fi";
import "./GenericPolicyModal.css";
import { DEFAULT_TERMS, DEFAULT_PRIVACY, DEFAULT_REFUND } from "../policyDefaults";
import { parseChildPolicy, validateChildPolicy } from "../policyUtils";

const POLICY_TITLES = {
  terms: "Terms and conditions",
  privacy: "Privacy policy",
  refund: "Refund policy",
  child: "Child age policy",
};

const PAYLOAD_FIELD_MAP = {
  terms: "termsAndConditions",
  privacy: "privacyPolicy",
  refund: "refundPolicy",
  child: "childAgePolicyJson",
};

const DEFAULT_TEXT_MAP = {
  terms: DEFAULT_TERMS,
  privacy: DEFAULT_PRIVACY,
  refund: DEFAULT_REFUND,
};

export default function GenericPolicyModal({
  isOpen,
  type, // 'terms' | 'privacy' | 'refund' | 'child'
  policyData,
  onClose,
  onSave,
}) {
  const [textVal, setTextVal] = useState("");
  const [childObj, setChildObj] = useState({
    freeChildMaxAge: "5",
    childAgeMax: "12",
    childExtraCharge: "500",
  });
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setErrorMsg("");
    if (type === "child") {
      const parsed = parseChildPolicy(policyData?.childAgePolicyJson);
      setChildObj({
        freeChildMaxAge: String(parsed.freeChildMaxAge),
        childAgeMax: String(parsed.childAgeMax),
        childExtraCharge: String(parsed.childExtraCharge),
      });
    } else {
      const fieldKey = PAYLOAD_FIELD_MAP[type];
      setTextVal(policyData?.[fieldKey] || DEFAULT_TEXT_MAP[type] || "");
    }
  }, [type, policyData]);

  if (!isOpen) return null;

  const title = POLICY_TITLES[type] || "Policy Settings";
  const payloadField = PAYLOAD_FIELD_MAP[type];

  const handleSave = () => {
    setErrorMsg("");
    if (type === "child") {
      const numericChildObj = {
        freeChildMaxAge: childObj.freeChildMaxAge === "" ? NaN : Number(childObj.freeChildMaxAge),
        childAgeMax: childObj.childAgeMax === "" ? NaN : Number(childObj.childAgeMax),
        childExtraCharge: childObj.childExtraCharge === "" ? NaN : Number(childObj.childExtraCharge),
      };

      const validation = validateChildPolicy(numericChildObj);
      if (!validation.isValid) {
        setErrorMsg(validation.errorMsg);
        return;
      }

      onSave({
        [payloadField]: JSON.stringify({
          freeChildMaxAge: Number(childObj.freeChildMaxAge),
          childAgeMax: Number(childObj.childAgeMax),
          childExtraCharge: Number(childObj.childExtraCharge),
        }),
      });
    } else {
      onSave({ [payloadField]: textVal });
    }
  };

  return (
    <div className="gpm-backdrop" onClick={onClose}>
      <div className="gpm-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="gpm-header">
          <h3>{title}</h3>
          <button type="button" className="gpm-close-btn" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="gpm-body">
          {errorMsg && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <FiAlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {type === "child" ? (
            <div className="gpm-child-form">
              <p className="gpm-help">
                Specify child age brackets and extra guest charges for your property stay bookings.
              </p>

              <div className="gpm-field">
                <label>Free Child Maximum Age</label>
                <div className="gpm-input-with-sub">
                  <input
                    type="number"
                    min="0"
                    max="18"
                    value={childObj.freeChildMaxAge}
                    onChange={(e) =>
                      setChildObj((prev) => ({
                        ...prev,
                        freeChildMaxAge: e.target.value,
                      }))
                    }
                  />
                  <span>years old (Children below this age stay for free)</span>
                </div>
              </div>

              <div className="gpm-field">
                <label>Child Age Upper Limit</label>
                <div className="gpm-input-with-sub">
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={childObj.childAgeMax}
                    onChange={(e) =>
                      setChildObj((prev) => ({
                        ...prev,
                        childAgeMax: e.target.value,
                      }))
                    }
                  />
                  <span>years old (Guests older than this are counted as adults)</span>
                </div>
              </div>

              <div className="gpm-field">
                <label>Child Extra Charge (per night)</label>
                <div className="gpm-input-with-sub">
                  <span>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={childObj.childExtraCharge}
                    onChange={(e) =>
                      setChildObj((prev) => ({
                        ...prev,
                        childExtraCharge: e.target.value,
                      }))
                    }
                  />
                  <span>per child / night</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="gpm-text-form">
              <label className="gpm-label">Policy Content &amp; Terms</label>
              <textarea
                rows={8}
                className="gpm-textarea"
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
                placeholder={`Enter your property ${title} details...`}
              />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="gpm-footer">
          <button type="button" className="gpm-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="gpm-btn primary" onClick={handleSave}>
            Save Policy
          </button>
        </div>
      </div>
    </div>
  );
}
