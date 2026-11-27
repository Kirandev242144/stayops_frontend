import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiCamera, 
  FiUploadCloud, 
  FiCheckCircle, 
  FiAlertCircle,
  FiDroplet,
  FiCoffee,
  FiTool,
  FiZap,
  FiHome,
  FiTag
} from 'react-icons/fi';
import { recordPettyCashExpenseApi, fetchPettyCashBalanceApi } from '../../Dashboard/PettyCash/pettyCashApi';
import { getTranslation } from '../../Dashboard/PettyCash/pettyCashTranslations';
import { toast } from 'react-toastify';
import './PettyCashExpenseModal.css';

const EXPENSE_CATEGORIES = [
  { id: 'Cleaning Supplies', labelKey: 'catCleaning', label: 'Cleaning', icon: FiDroplet },
  { id: 'Grocery & Tea', labelKey: 'catGrocery', label: 'Grocery', icon: FiCoffee },
  { id: 'Maintenance & Repair', labelKey: 'catRepair', label: 'Repair', icon: FiTool },
  { id: 'Electricity & Utility', labelKey: 'catUtility', label: 'Utility', icon: FiZap },
  { id: 'Room Amenities', labelKey: 'catAmenities', label: 'Amenities', icon: FiHome },
  { id: 'Other Expense', labelKey: 'catOther', label: 'Other', icon: FiTag }
];

export default function PettyCashExpenseModal({
  isOpen,
  onClose,
  propertiesList = [],
  currentBalance = 0,
  defaultPropertyId = null,
  addedBy = 'Ramesh (Caretaker)',
  onExpenseRecorded,
  lang = 'en'
}) {
  const t = (key, params) => getTranslation(lang, key, params);

  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptBase64, setReceiptBase64] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [propertyBalance, setPropertyBalance] = useState(currentBalance);

  // Sync selectedPropertyId when modal opens or properties change
  useEffect(() => {
    if (!isOpen) return;

    if (defaultPropertyId && defaultPropertyId !== 'all' && propertiesList.some(p => String(p.id) === String(defaultPropertyId))) {
      setSelectedPropertyId(String(defaultPropertyId));
    } else if (selectedPropertyId && propertiesList.some(p => String(p.id) === String(selectedPropertyId))) {
      // Keep existing valid property selection
    } else if (propertiesList.length > 0) {
      setSelectedPropertyId(String(propertiesList[0].id));
    }
  }, [isOpen, defaultPropertyId, propertiesList]);

  // Derive guaranteed active property id
  const activePropertyId = selectedPropertyId || (propertiesList.length > 0 ? String(propertiesList[0].id) : '1');
  const currentPropertyObj = propertiesList.find(p => String(p.id) === String(activePropertyId)) || propertiesList[0];
  const propertyName = currentPropertyObj ? (currentPropertyObj.name || 'Property') : 'Property';

  // Dynamically fetch accurate balance for the chosen property
  useEffect(() => {
    if (!isOpen || !activePropertyId) return;

    const allowedIds = propertiesList.map(p => String(p.id));
    fetchPettyCashBalanceApi(activePropertyId, allowedIds)
      .then(bal => setPropertyBalance(bal))
      .catch(() => setPropertyBalance(currentBalance));
  }, [isOpen, activePropertyId, propertiesList, currentBalance]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Receipt image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptBase64(reader.result);
      toast.success("Bill photo attached successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      toast.warning("Please enter a valid expense amount in ₹");
      return;
    }

    if (!receiptBase64) {
      toast.warning("A bill or receipt photo is required before deducting petty cash.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await recordPettyCashExpenseApi({
        propertyId: activePropertyId,
        propertyName,
        amount: numericAmount,
        category: selectedCategory,
        notes: notes || `${selectedCategory} purchased`,
        receiptImageUrl: receiptBase64,
        addedBy: addedBy || 'Caretaker'
      });

      toast.success(`Expense of ₹${numericAmount.toLocaleString('en-IN')} recorded! New petty cash balance: ₹${result.newBalance.toLocaleString('en-IN')}`);
      
      if (onExpenseRecorded) {
        onExpenseRecorded(result);
      }

      setAmount('');
      setNotes('');
      setReceiptBase64(null);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to record petty cash expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="petty-modal-overlay" onClick={onClose}>
      <div className="petty-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="petty-modal-header">
          <div className="petty-header-left">
            <h3 className="petty-modal-title">{t('recordExpenseTitle')}</h3>
          </div>
          <button type="button" className="petty-close-btn" onClick={onClose} aria-label={t('close')}>
            <FiX size={18} />
          </button>
        </div>

        {/* Balance Badge Strip */}
        <div className="petty-balance-strip">
          <span className="petty-balance-lbl">{t('availableCash')} ({propertyName})</span>
          <strong className="petty-balance-val">₹{propertyBalance.toLocaleString('en-IN')}</strong>
        </div>

        <form onSubmit={handleSubmit} className="petty-modal-form">
          {/* Property Selector */}
          <div className="petty-form-group">
            <label className="petty-label">{t('propertyUnit')}</label>
            {propertiesList.length > 1 ? (
              <select
                className="petty-input"
                value={activePropertyId}
                onChange={e => setSelectedPropertyId(e.target.value)}
              >
                {propertiesList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="petty-input"
                value={propertyName}
                disabled
                style={{ backgroundColor: '#F8FAFC', color: '#1E293B', fontWeight: 600, cursor: 'default' }}
              />
            )}
          </div>

          {/* Primary Expense Amount Input */}
          <div className="petty-form-group petty-hero-amount-group">
            <label className="petty-label">{t('expenseAmount')}</label>
            <div className="petty-amount-input-box">
              <span className="petty-currency-symbol">₹</span>
              <input
                type="number"
                className="petty-amount-input"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="1"
                required
                autoFocus
              />
            </div>
            <div className="petty-preset-chips">
              {[100, 250, 500, 1000, 2000].map(val => (
                <button
                  key={val}
                  type="button"
                  className="petty-preset-btn"
                  onClick={() => setAmount(String(val))}
                >
                  +₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Compact Selectable Category Tiles */}
          <div className="petty-form-group">
            <label className="petty-label">{t('category')}</label>
            <div className="petty-category-grid">
              {EXPENSE_CATEGORIES.map(cat => {
                const CategoryIcon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`petty-cat-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span className="petty-cat-icon">
                      <CategoryIcon size={14} />
                    </span>
                    <span className="petty-cat-text">{cat.labelKey ? t(cat.labelKey) : cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Receipt Photo Attachment */}
          <div className="petty-form-group">
            <label className="petty-label">
              {t('receiptPhoto')} <span className="petty-req">{t('required')}</span>
            </label>

            <div className="petty-upload-box">
              <input
                type="file"
                id="petty-bill-upload"
                accept="image/*"
                capture="environment"
                className="petty-file-input"
                onChange={handleFileChange}
              />
              <label htmlFor="petty-bill-upload" className="petty-upload-btn">
                <FiCamera size={15} />
                <span>{receiptBase64 ? t('replacePhoto') : t('uploadReceipt')}</span>
              </label>
            </div>

            {/* Receipt Preview */}
            {receiptBase64 ? (
              <div className="petty-preview-img-card">
                <img src={receiptBase64} alt="Bill Receipt Proof" className="petty-preview-img" />
                <span className="petty-proof-verified-pill">
                  <FiCheckCircle size={12} /> {t('billAttached')}
                </span>
              </div>
            ) : (
              <span className="petty-upload-hint">
                {t('required')}
              </span>
            )}
          </div>

          {/* Optional Note */}
          <div className="petty-form-group">
            <label className="petty-label">{t('notesOptional')}</label>
            <input
              type="text"
              className="petty-input"
              placeholder={t('notesPlaceholder')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Two-Button Footer */}
          <div className="petty-modal-footer">
            <button
              type="button"
              className="petty-cancel-btn"
              onClick={onClose}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="petty-submit-btn"
              disabled={isSubmitting || !receiptBase64}
            >
              {isSubmitting ? t('savingExpense') : t('submitExpense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
