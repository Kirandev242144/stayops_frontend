import React, { useState, useEffect, useRef } from 'react';
import { FiGlobe, FiChevronDown, FiCheck } from 'react-icons/fi';
import { PETTY_CASH_LANGUAGES, fetchBackendTranslations } from '../../../pages/Dashboard/PettyCash/pettyCashTranslations';
import './LanguageSelector.css';

export default function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('stayops_petty_cash_lang') || localStorage.getItem('stayops_lang') || 'en';
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync state if another component dispatches language change
  useEffect(() => {
    const handleLangChange = (e) => {
      if (e.detail && e.detail !== currentLang) {
        setCurrentLang(e.detail);
      }
    };
    window.addEventListener('stayops:language_changed', handleLangChange);
    return () => window.removeEventListener('stayops:language_changed', handleLangChange);
  }, [currentLang]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Initial pre-fetch of current language from backend
  useEffect(() => {
    fetchBackendTranslations(currentLang);
  }, [currentLang]);

  const selectLanguage = async (code) => {
    setCurrentLang(code);
    setIsOpen(false);
    localStorage.setItem('stayops_petty_cash_lang', code);
    localStorage.setItem('stayops_lang', code);

    // Warm cache from backend
    await fetchBackendTranslations(code);

    // Notify all listeners
    window.dispatchEvent(new CustomEvent('stayops:language_changed', { detail: code }));
  };

  const activeLangObj = PETTY_CASH_LANGUAGES.find(l => l.code === currentLang) || PETTY_CASH_LANGUAGES[0];

  return (
    <div className="navbar-lang-container" ref={dropdownRef}>
      <button
        type="button"
        className={`navbar-lang-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Change Language"
        aria-label="Change Language"
        aria-expanded={isOpen}
      >
        <FiGlobe className="navbar-lang-icon" size={17} />
        <span className="navbar-lang-current">{activeLangObj.native}</span>
        <FiChevronDown className={`navbar-lang-chevron ${isOpen ? 'open' : ''}`} size={14} />
      </button>

      {isOpen && (
        <div className="navbar-lang-dropdown">
          <div className="navbar-lang-header">
            <span>Select Language / भाषा</span>
          </div>
          <div className="navbar-lang-list">
            {PETTY_CASH_LANGUAGES.map((item) => {
              const isSelected = item.code === currentLang;
              return (
                <button
                  key={item.code}
                  type="button"
                  className={`navbar-lang-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectLanguage(item.code)}
                >
                  <div className="navbar-lang-item-content">
                    <span className="navbar-lang-item-native">{item.native}</span>
                    <span className="navbar-lang-item-label">{item.label}</span>
                  </div>
                  <span className="navbar-lang-item-badge">{item.code.toUpperCase()}</span>
                  {isSelected && <FiCheck className="navbar-lang-check" size={16} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
