import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiCheck, 
  FiDollarSign, 
  FiCalendar, 
  FiHome, 
  FiRotateCcw 
} from 'react-icons/fi';
import './InlineRateEditModal.css';

export default function InlineRateEditModal({
  isOpen,
  onClose,
  targetData,
  onSaveSingleRate
}) {
  if (!isOpen || !targetData) return null;

  const originalRate = targetData.currentRate || 0;
  const [rateVal, setRateVal] = useState(originalRate);

  // Sync state whenever targetData changes or modal opens
  useEffect(() => {
    if (targetData) {
      setRateVal(targetData.currentRate || 0);
    }
  }, [targetData]);

  const numericVal = Number(rateVal);
  const diff = numericVal - originalRate;
  const percentDiff = originalRate > 0 ? ((diff / originalRate) * 100).toFixed(1) : '0';

  const handleApplyPreset = (percent) => {
    const calculated = Math.round(originalRate * (1 + percent / 100));
    setRateVal(calculated);
  };

  const handleReset = () => {
    setRateVal(originalRate);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = Number(rateVal);
    if (isNaN(val) || val < 0) return;

    onSaveSingleRate({
      roomId: targetData.room?.id || targetData.roomId,
      dateKey: targetData.dateKey,
      newRate: val
    });

    onClose();
  };

  return (
    <div className="irm-backdrop" onClick={onClose}>
      <div className="irm-card" onClick={e => e.stopPropagation()}>
        
        {/* Minimalist Light Header */}
        <div className="irm-header">
          <div className="irm-header-content">
            <div className="irm-header-icon-box">
              <FiDollarSign size={20} />
            </div>
            <div>
              <h3 className="irm-title">Edit Nightly Rate</h3>
              <span className="irm-subtitle">
                Update rack rate for this specific date
              </span>
            </div>
          </div>
          <button type="button" className="irm-close-btn" onClick={onClose} aria-label="Close modal">
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="irm-body">
            
            {/* Room & Date Info Card */}
            <div className="irm-info-card">
              <div className="irm-info-item">
                <FiHome size={15} className="irm-info-icon" />
                <span>{targetData.room?.name || 'Selected Room'}</span>
              </div>
              <div className="irm-info-divider" />
              <div className="irm-info-item">
                <FiCalendar size={15} className="irm-info-icon" />
                <span>{targetData.dateKey}</span>
              </div>
            </div>

            {/* Input Group */}
            <div className="irm-form-group">
              <label className="irm-label">Nightly Rate</label>
              <div className="irm-input-wrapper">
                <span className="irm-currency-symbol">₹</span>
                <input
                  type="number"
                  className="irm-input"
                  value={rateVal}
                  onChange={e => setRateVal(e.target.value)}
                  step="50"
                  min="0"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Presets Pills */}
            <div className="irm-presets-container">
              <button
                type="button"
                className="irm-preset-btn"
                onClick={() => handleApplyPreset(5)}
              >
                +5%
              </button>
              <button
                type="button"
                className="irm-preset-btn"
                onClick={() => handleApplyPreset(10)}
              >
                +10%
              </button>
              <button
                type="button"
                className="irm-preset-btn"
                onClick={() => handleApplyPreset(-5)}
              >
                -5%
              </button>
              <button
                type="button"
                className="irm-preset-btn"
                onClick={() => handleApplyPreset(-10)}
              >
                -10%
              </button>
              <button
                type="button"
                className="irm-preset-btn irm-preset-reset"
                onClick={handleReset}
                title="Reset to original rate"
              >
                <FiRotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} />
                Reset
              </button>
            </div>

            {/* Difference Preview Card */}
            <div className={`irm-diff-card ${diff > 0 ? 'increase' : diff < 0 ? 'decrease' : 'neutral'}`}>
              <span>Rate Adjustment:</span>
              <span className="irm-diff-amount">
                {diff === 0 ? (
                  `No change (₹${originalRate.toLocaleString('en-IN')})`
                ) : diff > 0 ? (
                  `+₹${diff.toLocaleString('en-IN')} (+${percentDiff}%)`
                ) : (
                  `-₹${Math.abs(diff).toLocaleString('en-IN')} (${percentDiff}%)`
                )}
              </span>
            </div>

          </div>

          {/* Minimalist Footer */}
          <div className="irm-footer">
            <button type="button" className="irm-btn irm-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="irm-btn irm-btn-primary">
              <FiCheck size={16} /> Update Rate
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
