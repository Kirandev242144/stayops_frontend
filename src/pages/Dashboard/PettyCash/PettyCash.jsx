import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FiPlusCircle, 
  FiMinusCircle,
  FiRefreshCw, 
  FiSearch, 
  FiCamera, 
  FiArrowUpRight, 
  FiArrowDownLeft, 
  FiAlertCircle, 
  FiX,
  FiFileText
} from 'react-icons/fi';
import { 
  fetchPettyCashBalanceApi, 
  fetchPettyCashTransactionsApi, 
  addPettyCashFundsApi 
} from './pettyCashApi';
import { fetchProperties } from '../Reservations/propertyApi';
import { useWebSocketContext } from '../../../context/WebSocketContext';
import PettyCashExpenseModal from '../../Caretaker/components/PettyCashExpenseModal';
import ReceiptViewerModal from './ReceiptViewerModal';
import { PETTY_CASH } from './pettyCashConstants';
import { PETTY_CASH_LANGUAGES, getTranslation, fetchBackendTranslations } from './pettyCashTranslations';
import { toast } from 'react-toastify';
import './PettyCash.css';

export default function PettyCash() {
  const { subscribe } = useWebSocketContext();

  const [lang, setLang] = useState(() => {
    return localStorage.getItem('stayops_petty_cash_lang') || localStorage.getItem('stayops_lang') || 'en';
  });
  const [, setLangVersion] = useState(0);

  // Sync with global navbar language selector and load backend translations
  useEffect(() => {
    const onLangChanged = async (e) => {
      const newLang = e.detail || localStorage.getItem('stayops_petty_cash_lang') || 'en';
      setLang(newLang);
      await fetchBackendTranslations(newLang);
      setLangVersion(v => v + 1);
    };

    window.addEventListener('stayops:language_changed', onLangChanged);

    // Initial backend fetch for current language
    fetchBackendTranslations(lang).then(() => setLangVersion(v => v + 1));

    return () => window.removeEventListener('stayops:language_changed', onLangChanged);
  }, [lang]);

  const t = (key, params) => getTranslation(lang, key, params);

  const translateCategory = (cat) => {
    if (!cat) return '—';
    const catMap = {
      'Cleaning Supplies': 'catCleaning',
      'Grocery & Tea': 'catGrocery',
      'Maintenance & Repair': 'catRepair',
      'Electricity & Utility': 'catUtility',
      'Room Amenities': 'catAmenities',
      'Other Expense': 'catOther',
      'Petty Cash Funding': 'catFunding'
    };
    const key = catMap[cat];
    return key ? t(key) : cat;
  };

  const [propertiesList, setPropertiesList] = useState([]);
  const [selectedPropId, setSelectedPropId] = useState(PETTY_CASH.ALL_PROPERTIES);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(PETTY_CASH.ALL_TIME);

  // Extract unique months from transactions (YYYY-MM format)
  const availableMonths = Array.from(new Set(
    transactions
      .filter(t => t.createdAt)
      .map(t => {
        const d = new Date(t.createdAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${yyyy}-${mm}`;
      })
  )).sort().reverse();

  // Add Funds & Record Expense Modal State
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);
  const [fundPropertyId, setFundPropertyId] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [fundNotes, setFundNotes] = useState(PETTY_CASH.DEFAULT_FUNDING_NOTE);
  const [isFunding, setIsFunding] = useState(false);

  // View Receipt Photo Modal State
  const [activeReceiptTx, setActiveReceiptTx] = useState(null);

  const [loadError, setLoadError] = useState(null);

  // Dynamically determine authenticated user label from localStorage for UI display
  const loggedInUserLabel = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        const name = u?.name || "Owner";
        const role = u?.role ? (String(u.role).toLowerCase().includes("caretaker") ? "Caretaker" : "Owner") : "Owner";
        return `${name} (${role})`;
      }
    } catch {
      // fallback
    }
    return "Owner";
  }, []);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setLoadError(null);
    try {
      const props = await fetchProperties();
      setPropertiesList(props || []);

      const allowedPropIds = (props || []).map(p => String(p.id));

      const [bal, txs] = await Promise.all([
        fetchPettyCashBalanceApi(selectedPropId, allowedPropIds),
        fetchPettyCashTransactionsApi(selectedPropId, allowedPropIds)
      ]);

      setBalance(bal || 0);
      setTransactions(txs || []);

      if (props.length > 0 && (!fundPropertyId || !props.some(p => String(p.id) === fundPropertyId))) {
        setFundPropertyId(String(props[0].id));
      }
    } catch (err) {
      console.error("Petty cash load error:", err);
      setLoadError(err.message || "Unable to load petty cash data from server.");
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [selectedPropId, fundPropertyId]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Real-time WebSocket listener for instant petty cash updates across clients
  useEffect(() => {
    const handlePettyCashUpdate = (msg) => {
      if (msg && msg.event === PETTY_CASH.UPDATED_EVENT) {
        if (msg.data && msg.data.newBalance !== undefined) {
          setBalance(Number(msg.data.newBalance));
        }
        if (msg.data && msg.data.transaction) {
          setTransactions(prev => {
            const exists = prev.some(t => String(t.id) === String(msg.data.transaction.id));
            if (exists) return prev;
            return [msg.data.transaction, ...prev];
          });
        }
        loadData(true);
      }
    };

    const unsub1 = subscribe(PETTY_CASH.CHANNEL_FRONTDESK, handlePettyCashUpdate);
    const unsub2 = subscribe(PETTY_CASH.CHANNEL_PETTY_CASH, handlePettyCashUpdate);
    return () => {
      unsub1();
      unsub2();
    };
  }, [subscribe, loadData]);

  const handleAddFundsSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(fundAmount);
    if (!fundAmount || isNaN(numAmount) || numAmount <= 0) {
      toast.warning("Please enter a valid funding amount in ₹");
      return;
    }

    const propObj = propertiesList.find(p => String(p.id) === String(fundPropertyId));
    const propName = propObj ? propObj.name : 'Property';

    setIsFunding(true);
    try {
      await addPettyCashFundsApi({
        propertyId: fundPropertyId,
        propertyName: propName,
        amount: numAmount,
        notes: fundNotes || PETTY_CASH.DEFAULT_FUNDING_NOTE,
        addedBy: loggedInUserLabel
      });

      toast.success(`Successfully added ₹${numAmount.toLocaleString('en-IN')} to petty cash!`);
      setIsAddFundsOpen(false);
      setFundAmount('');
      loadData(true);
    } catch (err) {
      toast.error(err.message || "Failed to add funds.");
    } finally {
      setIsFunding(false);
    }
  };

  // Filter transactions by search query and selected month/period
  const filteredTransactions = transactions.filter(t => {
    // 1. Search Query Filter
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchSearch = (
        (t.category || '').toLowerCase().includes(query) ||
        (t.notes || '').toLowerCase().includes(query) ||
        (t.addedBy || '').toLowerCase().includes(query) ||
        (t.propertyName || '').toLowerCase().includes(query)
      );
      if (!matchSearch) return false;
    }

    // 2. Date / Month Period Filter
    if (selectedMonth !== PETTY_CASH.ALL_TIME && t.createdAt) {
      const txDate = new Date(t.createdAt);
      const now = new Date();

      if (selectedMonth === PETTY_CASH.THIS_MONTH) {
        if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (selectedMonth === PETTY_CASH.LAST_MONTH) {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (txDate.getMonth() !== lastMonthDate.getMonth() || txDate.getFullYear() !== lastMonthDate.getFullYear()) {
          return false;
        }
      } else if (selectedMonth === PETTY_CASH.THIS_YEAR) {
        if (txDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else {
        const yyyy = txDate.getFullYear();
        const mm = String(txDate.getMonth() + 1).padStart(2, '0');
        const key = `${yyyy}-${mm}`;
        if (key !== selectedMonth) return false;
      }
    }

    return true;
  });

  // Get human-readable label for selected period
  const getPeriodLabel = () => {
    if (selectedMonth === PETTY_CASH.ALL_TIME) return t('allTime');
    if (selectedMonth === PETTY_CASH.THIS_MONTH) return t('thisMonth');
    if (selectedMonth === PETTY_CASH.LAST_MONTH) return t('lastMonth');
    if (selectedMonth === PETTY_CASH.THIS_YEAR) return `${t('thisYear')} (${new Date().getFullYear()})`;
    if (selectedMonth.includes('-')) {
      const [y, m] = selectedMonth.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, 1);
      const locale = lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : lang === 'kn' ? 'kn-IN' : 'en-US';
      return dateObj.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
    }
    return t('allTime');
  };

  return (
    <div className="pc-container">
      {/* PAGE HEADER CARD */}
      <div className="pc-header-card">
        <div className="pc-top-row">
          <div className="pc-title-box">
            <span className="pc-badge-pill">
              <span className="pc-live-pulse" /> {t('badge')}
            </span>
            <h1 className="pc-main-heading">{t('mainHeading')}</h1>
            <p className="pc-sub-heading">{t('subHeading')}</p>
          </div>

          <div className="pc-top-right">
            <button
              type="button"
              className="pc-primary-btn"
              onClick={() => setIsAddFundsOpen(true)}
            >
              <FiPlusCircle size={16} />
              <span>{t('addCashFunds')}</span>
            </button>

            <button
              type="button"
              className="pc-expense-btn"
              onClick={() => setIsRecordExpenseOpen(true)}
            >
              <FiMinusCircle size={16} />
              <span>{t('recordExpense')}</span>
            </button>

            <button
              type="button"
              className="pc-refresh-btn"
              onClick={() => loadData(false)}
              title={t('refresh')}
            >
              <FiRefreshCw size={14} className={isLoading ? 'spinning' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* BALANCE SUMMARY & CONTROL BAR */}
      <div className="pc-stats-row">
        {/* Available Balance Card (Always real live current balance) */}
        <div className={`pc-balance-card ${balance < PETTY_CASH.LOW_BALANCE_THRESHOLD ? 'is-low-balance' : ''}`}>
          <div className="pc-balance-meta">
            <span className="pc-balance-lbl">{t('currentBalance')}</span>
            {balance < PETTY_CASH.LOW_BALANCE_THRESHOLD && (
              <span className="pc-low-pill">
                <FiAlertCircle size={12} /> {t('lowFloat')} (&lt; ₹{PETTY_CASH.LOW_BALANCE_THRESHOLD.toLocaleString('en-IN')})
              </span>
            )}
          </div>
          <div className="pc-balance-amount">
            ₹{balance.toLocaleString('en-IN')}
          </div>
          <span className="pc-balance-sub">
            {selectedPropId === PETTY_CASH.ALL_PROPERTIES ? t('balanceSubAll') : t('balanceSubSingle')}
          </span>
        </div>

        {/* Quick Audit Stat Cards (Filtered by selected month / period) */}
        <div className="pc-stat-box">
          <div className="pc-stat-icon credit">
            <FiArrowDownLeft size={20} />
          </div>
          <div>
            <span className="pc-stat-lbl">{t('cashAdded')} ({getPeriodLabel()})</span>
            <strong className="pc-stat-val credit">
              ₹{filteredTransactions
                .filter(t => t.type === 'CREDIT')
                .reduce((sum, t) => sum + Number(t.amount || 0), 0)
                .toLocaleString('en-IN')}
            </strong>
          </div>
        </div>

        <div className="pc-stat-box">
          <div className="pc-stat-icon debit">
            <FiArrowUpRight size={20} />
          </div>
          <div>
            <span className="pc-stat-lbl">{t('expensesPaid')} ({getPeriodLabel()})</span>
            <strong className="pc-stat-val debit">
              ₹{filteredTransactions
                .filter(t => t.type === 'DEBIT')
                .reduce((sum, t) => sum + Number(t.amount || 0), 0)
                .toLocaleString('en-IN')}
            </strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR SEARCH & PROPERTY / DATE MONTH FILTERS */}
      <div className="pc-toolbar-card">
        <div className="pc-toolbar-left">
          {/* Property Filter */}
          <div className="pc-select-box">
            <select
              className="pc-property-dropdown"
              value={selectedPropId}
              onChange={e => setSelectedPropId(e.target.value)}
            >
              <option value={PETTY_CASH.ALL_PROPERTIES}>{t('allProperties')}</option>
              {propertiesList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Clean Period & Month Filter */}
          <div className="pc-select-box">
            <select
              className="pc-property-dropdown"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              <option value={PETTY_CASH.ALL_TIME}>{t('allTime')}</option>
              <option value={PETTY_CASH.THIS_MONTH}>{t('thisMonth')}</option>
              <option value={PETTY_CASH.LAST_MONTH}>{t('lastMonth')}</option>
              <option value={PETTY_CASH.THIS_YEAR}>{t('thisYear')} ({new Date().getFullYear()})</option>
            </select>
          </div>

          {/* Search Query Input */}
          <div className="pc-search-field">
            <FiSearch className="pc-search-icon" size={14} />
            <input
              type="text"
              className="pc-search-input"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="pc-tx-count">
          {t('showingTransactions', { count: filteredTransactions.length })} ({getPeriodLabel()})
        </div>
      </div>

      {/* TRANSACTIONS AUDIT TABLE */}
      <div className="pc-table-card">
        {isLoading ? (
          <div className="pc-empty-state">
            <FiRefreshCw className="spinning" size={24} />
            <p>Loading...</p>
          </div>
        ) : loadError ? (
          <div className="pc-empty-state">
            <FiAlertCircle size={32} style={{ color: '#D72C0D' }} />
            <p style={{ color: '#D72C0D', fontWeight: 600 }}>{loadError}</p>
            <button
              type="button"
              className="pc-primary-btn"
              style={{ marginTop: 8 }}
              onClick={() => loadData(false)}
            >
              <FiRefreshCw size={14} /> Retry
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="pc-empty-state">
            <FiFileText size={32} style={{ color: '#94A3B8' }} />
            <p>{t('noTransactionsSubtitle')}</p>
          </div>
        ) : (
          <table className="pc-table">
            <thead>
              <tr>
                <th>{t('thDateTime')}</th>
                <th>{t('thProperty')}</th>
                <th>{t('thType')}</th>
                <th>{t('thCategory')}</th>
                <th>{t('thLoggedBy')}</th>
                <th>{t('thNotes')}</th>
                <th style={{ textAlign: 'right' }}>{t('thAmount')}</th>
                <th style={{ textAlign: 'center' }}>{t('thReceipt')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tRow => {
                const isCredit = tRow.type === 'CREDIT';
                const locale = lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : lang === 'kn' ? 'kn-IN' : 'en-US';
                const dateStr = tRow.createdAt 
                  ? new Date(tRow.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Recent';

                return (
                  <tr key={tRow.id}>
                    <td className="pc-td-date">{dateStr}</td>
                    <td className="pc-td-prop">{tRow.propertyName || 'Property'}</td>
                    <td>
                      <span className={`pc-type-badge ${isCredit ? 'credit' : 'debit'}`}>
                        {isCredit ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                        {isCredit ? t('creditType') : t('debitType')}
                      </span>
                    </td>
                    <td className="pc-td-category">{translateCategory(tRow.category)}</td>
                    <td className="pc-td-user">{tRow.addedBy || 'User'}</td>
                    <td className="pc-td-notes">{tRow.notes || '—'}</td>
                    <td className={`pc-td-amount ${isCredit ? 'credit' : 'debit'}`}>
                      {isCredit ? `+₹${Number(tRow.amount).toLocaleString('en-IN')}` : `-₹${Number(tRow.amount).toLocaleString('en-IN')}`}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {tRow.receiptImageUrl ? (
                        <button
                          type="button"
                          className="pc-receipt-btn"
                          onClick={() => setActiveReceiptTx(tRow)}
                          title={t('viewBill')}
                        >
                          <FiCamera size={13} /> {t('viewBill')}
                        </button>
                      ) : (
                        <span className="pc-no-receipt">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ADD FUNDS MODAL */}
      {isAddFundsOpen && (
        <div className="pc-modal-overlay" onClick={() => setIsAddFundsOpen(false)}>
          <div className="pc-modal-card" onClick={e => e.stopPropagation()}>
            <div className="pc-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiPlusCircle size={20} style={{ color: '#008060' }} />
                <h3 className="pc-modal-title">{t('addFundsTitle')}</h3>
              </div>
              <button type="button" className="pc-close-btn" onClick={() => setIsAddFundsOpen(false)}>
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleAddFundsSubmit} className="pc-modal-form">
              <div className="pc-form-group">
                <label className="pc-label">{t('selectProperty')}</label>
                <select
                  className="pc-input"
                  value={fundPropertyId}
                  onChange={e => setFundPropertyId(e.target.value)}
                >
                  {propertiesList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="pc-form-group">
                <label className="pc-label">{t('fundingAmount')}</label>
                <input
                  type="number"
                  className="pc-input pc-amount-input"
                  placeholder={t('fundingAmountPlaceholder')}
                  value={fundAmount}
                  onChange={e => setFundAmount(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="pc-form-group">
                <label className="pc-label">{t('fundingNotes')}</label>
                <input
                  type="text"
                  className="pc-input"
                  placeholder={t('fundingNotesPlaceholder')}
                  value={fundNotes}
                  onChange={e => setFundNotes(e.target.value)}
                />
              </div>

              <div className="pc-modal-footer">
                <button type="button" className="pc-cancel-btn" onClick={() => setIsAddFundsOpen(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="pc-submit-btn" disabled={isFunding}>
                  {isFunding ? t('addingFunds') : `✓ ${t('confirmAddFunds')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT PHOTO VIEW MODAL LIGHTBOX */}
      {activeReceiptTx && (
        <ReceiptViewerModal
          tx={activeReceiptTx}
          onClose={() => setActiveReceiptTx(null)}
          lang={lang}
        />
      )}

      {/* RECORD EXPENSE MODAL */}
      <PettyCashExpenseModal
        isOpen={isRecordExpenseOpen}
        onClose={() => setIsRecordExpenseOpen(false)}
        propertiesList={propertiesList}
        defaultPropertyId={selectedPropId !== PETTY_CASH.ALL_PROPERTIES ? selectedPropId : (propertiesList[0]?.id || '')}
        currentBalance={balance}
        addedBy={loggedInUserLabel}
        lang={lang}
        onExpenseRecorded={() => {
          loadData(true);
        }}
      />
    </div>
  );
}

