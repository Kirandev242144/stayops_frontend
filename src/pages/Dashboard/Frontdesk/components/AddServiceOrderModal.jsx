import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { IN_STAY_SERVICE_SUGGESTIONS } from '../frontdeskConstants';
import './AddServiceOrderModal.css';

/**
 * Minimalist In-Stay Service & Charge Modal (Shopify Polaris style).
 * Lets user select from common service tags without prices, and enter their own custom amount.
 */
export default function AddServiceOrderModal({
  isOpen,
  res,
  onClose,
  onSaveServiceOrder
}) {
  const [serviceName, setServiceName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitRate, setUnitRate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setServiceName('');
      setQuantity(1);
      setUnitRate('');
      setNotes('');
      setIsSubmitting(false);
    }
  }, [isOpen, res]);

  if (!isOpen || !res) return null;

  const rateNum = parseFloat(unitRate) || 0;
  const totalAmount = Math.max(0, quantity * rateNum);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceName.trim() || totalAmount <= 0) {
      alert('Please enter a service description and an amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetId = res.dbId || res.id;
      const formattedName = quantity > 1 ? `${quantity}x ${serviceName.trim()}` : serviceName.trim();

      await onSaveServiceOrder({
        reservationId: targetId,
        guestName: res.guest || 'Guest',
        mealType: 'Service',
        itemName: formattedName,
        amount: totalAmount,
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      console.error('Failed to save service order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="asom-overlay" onClick={onClose}>
      <div className="asom-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="asom-header">
          <div className="asom-title-group">
            <h3 className="asom-title">Add Extra Service</h3>
            <span className="asom-subtitle">
              {res.guest} • {res.id} {res.unit ? `• Room ${res.unit}` : ''}
            </span>
          </div>
          <button type="button" className="asom-close-btn" onClick={onClose} aria-label="Close">
            <FiX size={17} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="asom-body">
            {/* Quick Suggestions Chips without prices */}
            <div className="asom-field">
              <label className="asom-label">Popular Services</label>
              <div className="asom-chips-row">
                {IN_STAY_SERVICE_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`asom-chip ${serviceName === item ? 'active' : ''}`}
                    onClick={() => setServiceName(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Name Input */}
            <div className="asom-field">
              <label className="asom-label">Service Description</label>
              <input
                type="text"
                className="asom-input"
                placeholder="e.g. Bonfire, Camping tent, Extra mattress, Tour..."
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Qty & Rate Row */}
            <div className="asom-row-cols">
              <div className="asom-field">
                <label className="asom-label">Qty</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="asom-input"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div className="asom-field">
                <label className="asom-label">Rate (₹)</label>
                <div className="asom-currency-wrap">
                  <span className="asom-currency-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="asom-input asom-input-currency"
                    placeholder="Enter amount"
                    value={unitRate}
                    onChange={(e) => setUnitRate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Caretaker / Staff Notes */}
            <div className="asom-field">
              <label className="asom-label">
                Staff Note <span className="asom-label-opt">(optional)</span>
              </label>
              <input
                type="text"
                className="asom-input"
                placeholder="e.g. Lawn setup scheduled for 8:00 PM"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="asom-footer">
            <button type="button" className="asom-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="asom-btn-primary"
              disabled={isSubmitting || !serviceName.trim() || totalAmount <= 0}
            >
              {isSubmitting
                ? 'Adding...'
                : totalAmount > 0
                ? `+ Add ₹${totalAmount.toLocaleString('en-IN')} to Folio`
                : '+ Add Service to Folio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
