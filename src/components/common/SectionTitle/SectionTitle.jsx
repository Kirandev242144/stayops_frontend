import React from 'react';
import './SectionTitle.css';

/**
 * SectionTitle Component
 * Renders structured headings for sections.
 * 
 * @param {Object} props
 * @param {string} [props.badge] - Optional pill badge text (e.g. "FEATURES")
 * @param {string} props.title - Main title text
 * @param {string} [props.gradientTitle] - Portion of title highlighted with gradient
 * @param {string} [props.subtitle] - Subtitle description
 * @param {'center' | 'left'} [props.align='center'] - Alignment orientation
 */
const SectionTitle = ({
  badge,
  title,
  gradientTitle,
  subtitle,
  align = 'center'
}) => {
  return (
    <div className={`section-title-wrapper align-${align}`}>
      {badge && <span className="badge">{badge}</span>}
      <h2 className="section-title">
        {title}{' '}
        {gradientTitle && <span className="text-gradient">{gradientTitle}</span>}
      </h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  );
};

export default SectionTitle;
