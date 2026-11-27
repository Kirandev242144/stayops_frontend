import React from 'react';

/**
 * Minimalist, highly accessible custom checkbox component.
 * Uses standard W3C label-wrapped input to guarantee single click dispatch.
 */
export default function NeatCheckbox({
  checked,
  onChange,
  label,
  sublabel,
  id,
  name,
  disabled = false,
  className = ''
}) {
  return (
    <label
      className={`neat-checkbox-wrapper ${checked ? 'is-checked' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={Boolean(checked)}
        onChange={onChange}
        disabled={disabled}
        className="neat-checkbox-input"
      />
      <span className="neat-checkbox-box" aria-hidden="true">
        <svg
          className="neat-checkbox-check"
          viewBox="0 0 12 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.5 5L4.5 8L10.5 1.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {(label || sublabel) && (
        <span className="neat-checkbox-content">
          {label && <span className="neat-checkbox-label">{label}</span>}
          {sublabel && <span className="neat-checkbox-sublabel">{sublabel}</span>}
        </span>
      )}
    </label>
  );
}
