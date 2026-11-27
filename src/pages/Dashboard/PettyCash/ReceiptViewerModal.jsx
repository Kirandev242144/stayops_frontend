import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiX, 
  FiZoomIn, 
  FiZoomOut, 
  FiRotateCw, 
  FiMaximize2, 
  FiDownload, 
  FiExternalLink,
  FiCheckCircle,
  FiFileText,
  FiUser,
  FiClock,
  FiHome,
  FiTag
} from 'react-icons/fi';
import { getTranslation } from './pettyCashTranslations';
import './ReceiptViewerModal.css';

export default function ReceiptViewerModal({ tx, onClose, lang = 'en' }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const t = (key, params) => getTranslation(lang, key, params);

  // Keyboard navigation shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === '+' || e.key === '=') {
      setZoom(prev => Math.min(prev + 0.25, 3));
    } else if (e.key === '-') {
      setZoom(prev => Math.max(prev - 0.25, 0.5));
    } else if (e.key === 'r' || e.key === 'R') {
      setRotation(prev => (prev + 90) % 360);
    } else if (e.key === '0') {
      setZoom(1);
      setRotation(0);
    }
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!tx || !tx.receiptImageUrl) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => { setZoom(1); setRotation(0); };

  const handleToggleZoomClick = () => {
    setZoom(prev => (prev === 1 ? 2 : 1));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = tx.receiptImageUrl;
    link.download = `Receipt-${tx.category ? tx.category.replace(/\s+/g, '-') : 'Expense'}-${tx.id || 'photo'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dateStr = tx.createdAt 
    ? new Date(tx.createdAt).toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : 'Recent';

  return (
    <div className="rv-overlay" onClick={onClose}>
      <div className="rv-lightbox-container" onClick={e => e.stopPropagation()}>
        {/* TOP TOOLBAR */}
        <div className="rv-toolbar">
          <div className="rv-toolbar-left">
            <span className="rv-title-badge">
              <FiCheckCircle size={14} /> {t('receiptViewerTitle')}
            </span>
            <span className="rv-sub-info">
              {tx.category} • ₹{Number(tx.amount).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="rv-controls">
            <button 
              type="button" 
              className="rv-ctrl-btn" 
              onClick={handleZoomOut} 
              disabled={zoom <= 0.5}
              title="Zoom Out (-)"
            >
              <FiZoomOut size={16} />
            </button>
            <span className="rv-zoom-indicator">{Math.round(zoom * 100)}%</span>
            <button 
              type="button" 
              className="rv-ctrl-btn" 
              onClick={handleZoomIn} 
              disabled={zoom >= 3}
              title="Zoom In (+)"
            >
              <FiZoomIn size={16} />
            </button>
            <button 
              type="button" 
              className="rv-ctrl-btn" 
              onClick={handleRotate}
              title="Rotate 90° (R)"
            >
              <FiRotateCw size={16} />
            </button>
            <button 
              type="button" 
              className="rv-ctrl-btn" 
              onClick={handleReset}
              title="Reset Zoom & Rotation (0)"
            >
              <FiMaximize2 size={16} />
            </button>
            <button 
              type="button" 
              className="rv-ctrl-btn" 
              onClick={handleDownload}
              title="Download Receipt Image"
            >
              <FiDownload size={16} />
            </button>
            <a 
              href={tx.receiptImageUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="rv-ctrl-btn"
              title="Open Original Image in New Tab"
            >
              <FiExternalLink size={16} />
            </a>
            <div className="rv-ctrl-divider" />
            <button 
              type="button" 
              className="rv-close-btn" 
              onClick={onClose}
              title="Close (Esc)"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* MAIN BODY: VIEWPORT + SIDEBAR */}
        <div className="rv-body">
          {/* IMAGE VIEWPORT CANVAS */}
          <div className="rv-canvas" onClick={handleToggleZoomClick} title="Click to toggle 2x zoom">
            <div className="rv-img-wrapper">
              <img 
                src={tx.receiptImageUrl} 
                alt="Verified Bill Receipt" 
                className="rv-img"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`
                }}
              />
            </div>
          </div>

          {/* AUDIT METADATA SIDEBAR */}
          <aside className="rv-sidebar">
            <div className="rv-sidebar-header">
              <h4 className="rv-sidebar-title">{t('receiptViewerTitle')}</h4>
              <span className="rv-status-verified">
                <FiCheckCircle size={13} /> {t('billAttached')}
              </span>
            </div>

            <div className="rv-sidebar-hero-amount">
              <span className="rv-hero-lbl">{t('expenseAmount')}</span>
              <strong className="rv-hero-val">-₹{Number(tx.amount).toLocaleString('en-IN')}</strong>
            </div>

            <div className="rv-meta-list">
              <div className="rv-meta-item">
                <div className="rv-meta-icon"><FiTag size={15} /></div>
                <div>
                  <span className="rv-meta-lbl">{t('category')}</span>
                  <strong className="rv-meta-val">{tx.category}</strong>
                </div>
              </div>

              <div className="rv-meta-item">
                <div className="rv-meta-icon"><FiHome size={15} /></div>
                <div>
                  <span className="rv-meta-lbl">{t('propertyUnit')}</span>
                  <strong className="rv-meta-val">{tx.propertyName || 'Property'}</strong>
                </div>
              </div>

              <div className="rv-meta-item">
                <div className="rv-meta-icon"><FiUser size={15} /></div>
                <div>
                  <span className="rv-meta-lbl">{t('thLoggedBy')}</span>
                  <strong className="rv-meta-val">{tx.addedBy || 'Caretaker'}</strong>
                </div>
              </div>

              <div className="rv-meta-item">
                <div className="rv-meta-icon"><FiClock size={15} /></div>
                <div>
                  <span className="rv-meta-lbl">{t('thDateTime')}</span>
                  <strong className="rv-meta-val">{dateStr}</strong>
                </div>
              </div>

              <div className="rv-meta-item notes-item">
                <div className="rv-meta-icon"><FiFileText size={15} /></div>
                <div>
                  <span className="rv-meta-lbl">{t('thNotes')}</span>
                  <p className="rv-notes-txt">{tx.notes || '—'}</p>
                </div>
              </div>
            </div>

            <div className="rv-sidebar-footer">
              <button 
                type="button" 
                className="rv-download-btn"
                onClick={handleDownload}
              >
                <FiDownload size={15} />
                <span>{t('downloadReceipt')}</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
