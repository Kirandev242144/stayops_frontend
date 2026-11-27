import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { MEAL_TYPES, MEAL_SUGGESTIONS } from '../frontdeskConstants';
import './AddServiceOrderModal.css';

/**
 * Minimalist Food & Dining Order Modal (Shopify Polaris style).
 * Lets user select from common meal tags without prices, and enter their own custom amount.
 */
export default function MealOrderModal({
  isOpen,
  res,
  onClose,
  onSaveMealOrder
}) {
  const [mealType, setMealType] = useState('Dinner');
  const [itemName, setItemName] = useState('Dinner Thali');
  const [quantity, setQuantity] = useState(1);
  const [unitRate, setUnitRate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMealType('Dinner');
      setItemName('');
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
    if (!itemName.trim() || totalAmount <= 0) {
      alert('Please enter a meal description and an amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetId = res.dbId || res.id;
      const formattedItemName = quantity > 1 ? `${quantity}x ${itemName.trim()}` : itemName.trim();

      await onSaveMealOrder({
        reservationId: targetId,
        guestName: res.guest || 'Guest',
        mealType: mealType || 'Meal',
        itemName: formattedItemName,
        amount: totalAmount,
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      console.error('Failed to save meal order:', err);
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
            <h3 className="asom-title">Add Meal Order</h3>
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
            {/* Meal Type Selection */}
            <div className="asom-field">
              <label className="asom-label">Meal Type</label>
              <div className="asom-pill-tabs">
                {MEAL_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`asom-pill-tab ${mealType === type ? 'active' : ''}`}
                    onClick={() => setMealType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Description & Suggestions without prices */}
            <div className="asom-field">
              <label className="asom-label">Item Description</label>
              <input
                type="text"
                className="asom-input"
                placeholder="e.g. Dinner Thali, Veg Sandwich"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                autoFocus
              />
              <div className="asom-chips-row">
                {MEAL_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`asom-chip ${itemName === item ? 'active' : ''}`}
                    onClick={() => setItemName(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
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

            {/* Staff / Kitchen Notes */}
            <div className="asom-field">
              <label className="asom-label">
                Kitchen Note <span className="asom-label-opt">(optional)</span>
              </label>
              <input
                type="text"
                className="asom-input"
                placeholder="e.g. Serve at 8:30 PM, less spicy"
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
              disabled={isSubmitting || !itemName.trim() || totalAmount <= 0}
            >
              {isSubmitting
                ? 'Adding...'
                : totalAmount > 0
                ? `+ Add ₹${totalAmount.toLocaleString('en-IN')} to Folio`
                : '+ Add Meal to Folio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
