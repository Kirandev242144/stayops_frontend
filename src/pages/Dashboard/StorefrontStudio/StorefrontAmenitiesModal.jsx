import React, { useState, useMemo, useEffect } from 'react';
import { 
  FiX, 
  FiSearch, 
  FiCheck, 
  FiPlus, 
  FiTrash2, 
  FiAward,
  FiFilter
} from 'react-icons/fi';
import { PROPERTY_AMENITY_CATEGORIES } from '../../../constants/amenities';
import './StorefrontAmenitiesModal.css';

export default function StorefrontAmenitiesModal({
  isOpen,
  onClose,
  selectedAmenities = [],
  onSave
}) {
  const [selectedList, setSelectedList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedList(Array.isArray(selectedAmenities) ? [...selectedAmenities] : []);
      setSearchTerm('');
      setSelectedCategory('All');
      setCustomInput('');
    }
  }, [isOpen, selectedAmenities]);

  const categories = useMemo(() => {
    return ['All', ...PROPERTY_AMENITY_CATEGORIES.map(c => c.category)];
  }, []);

  // Filtered categories and items based on search and selected category
  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return PROPERTY_AMENITY_CATEGORIES.map(cat => {
      if (selectedCategory !== 'All' && cat.category !== selectedCategory) {
        return null;
      }

      const matchingItems = cat.items.filter(item => {
        if (!term) return true;
        return item.toLowerCase().includes(term);
      });

      if (matchingItems.length === 0) return null;

      return {
        category: cat.category,
        items: matchingItems
      };
    }).filter(Boolean);
  }, [searchTerm, selectedCategory]);

  const isSelected = (item) => {
    return selectedList.some(s => s.toLowerCase() === item.toLowerCase());
  };

  const toggleAmenity = (item) => {
    setSelectedList(prev => {
      const exists = prev.some(s => s.toLowerCase() === item.toLowerCase());
      if (exists) {
        return prev.filter(s => s.toLowerCase() !== item.toLowerCase());
      } else {
        return [...prev, item];
      }
    });
  };

  const handleAddCustom = (e) => {
    e?.preventDefault();
    const clean = customInput.trim();
    if (!clean) return;

    if (!selectedList.some(s => s.toLowerCase() === clean.toLowerCase())) {
      setSelectedList(prev => [...prev, clean]);
    }
    setCustomInput('');
  };

  const handleRemoveAmenity = (item) => {
    setSelectedList(prev => prev.filter(s => s.toLowerCase() !== item.toLowerCase()));
  };

  const handleClearAll = () => {
    setSelectedList([]);
  };

  const handleSave = () => {
    onSave(selectedList);
    onClose();
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="sfa-modal-overlay" 
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayMouseDown}
    >
      <div className="sfa-modal-container" onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div className="sfa-modal-header">
          <div>
            <div className="sfa-header-title-row">
              <FiAward className="sfa-header-icon" />
              <h3>Property Amenities Library</h3>
              <span className="sfa-count-badge">{selectedList.length} Selected</span>
            </div>
            <p className="sfa-header-sub">
              Search or browse pre-made amenities to showcase on your guest storefront
            </p>
          </div>
          <button className="sfa-close-btn" onClick={onClose} aria-label="Close modal">
            <FiX size={18} />
          </button>
        </div>

        {/* SEARCH & CATEGORY BAR */}
        <div className="sfa-controls-bar">
          <div className="sfa-search-wrapper">
            <FiSearch className="sfa-search-icon" />
            <input
              type="text"
              placeholder="Search amenities (e.g. WiFi, Pool, Kitchen, Bonfire)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="sfa-search-input"
            />
            {searchTerm && (
              <button 
                type="button" 
                className="sfa-search-clear"
                onClick={() => setSearchTerm('')}
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          <div className="sfa-category-tabs">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`sfa-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* CURRENTLY SELECTED TRAY */}
        {selectedList.length > 0 && (
          <div className="sfa-selected-tray">
            <div className="sfa-tray-header">
              <span className="sfa-tray-title">
                Active Amenities ({selectedList.length}):
              </span>
              <button type="button" className="sfa-tray-clear" onClick={handleClearAll}>
                <FiTrash2 size={12} /> Clear All
              </button>
            </div>
            <div className="sfa-selected-chips">
              {selectedList.map(item => (
                <span key={item} className="sfa-selected-chip">
                  <FiCheck size={11} className="sfa-chip-check" />
                  {item}
                  <button
                    type="button"
                    className="sfa-chip-remove"
                    onClick={() => handleRemoveAmenity(item)}
                    title={`Remove ${item}`}
                  >
                    <FiX size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* MAIN AMENITIES DIRECTORY BODY */}
        <div className="sfa-modal-body">
          {filteredCategories.length === 0 ? (
            <div className="sfa-empty-state">
              <FiFilter size={32} />
              <p>No pre-made amenities found matching "{searchTerm}".</p>
              <span>You can add it as a custom amenity below!</span>
            </div>
          ) : (
            filteredCategories.map(cat => (
              <div key={cat.category} className="sfa-category-group">
                <h4 className="sfa-group-title">{cat.category}</h4>
                <div className="sfa-grid">
                  {cat.items.map(item => {
                    const checked = isSelected(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        className={`sfa-amenity-card ${checked ? 'selected' : ''}`}
                        onClick={() => toggleAmenity(item)}
                      >
                        <span className="sfa-card-checkbox">
                          {checked && <FiCheck size={12} />}
                        </span>
                        <span className="sfa-card-label">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* CUSTOM AMENITY FOOTER TRAY */}
        <div className="sfa-custom-bar">
          <form onSubmit={handleAddCustom} className="sfa-custom-form">
            <input
              type="text"
              placeholder="Can't find an amenity? Add custom (e.g. Plantation Walk, Gazebo)..."
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              className="sfa-custom-input"
            />
            <button
              type="submit"
              className="sfa-btn-add-custom"
              disabled={!customInput.trim()}
            >
              <FiPlus size={14} /> Add
            </button>
          </form>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="sfa-modal-footer">
          <button type="button" className="sfa-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="sfa-btn-apply" onClick={handleSave}>
            Apply & Update Storefront ({selectedList.length})
          </button>
        </div>
      </div>
    </div>
  );
}
