import React, { useState } from 'react';
import Container from '../../common/Container/Container';
import SectionTitle from '../../common/SectionTitle/SectionTitle';
import Button from '../../common/Button/Button';
import './Pricing.css';

/**
 * Pricing Section Component
 * Interactive pricing matrix with stateful Monthly/Annual billing frequency toggle.
 */
const Pricing = () => {
  // useState hook: isAnnual state toggles between monthly (false) and annual (true) pricing
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: 'Starter Homestay',
      desc: 'Ideal for single homestays, bed & breakfasts, and boutique rooms.',
      monthlyPrice: 19,
      annualPrice: 15,
      features: [
        'Up to 5 Rooms / Units',
        'Direct Booking Website',
        'Unified Multi-Calendar',
        'Guest CRM & Meal Logs',
        'Basic Financial Reports',
        'Standard Email Support'
      ],
      featured: false,
      buttonText: 'Start Free Trial'
    },
    {
      name: 'Pro Villa & Resort',
      desc: 'Perfect for luxury villas, resort managers, and growing stays.',
      monthlyPrice: 49,
      annualPrice: 39,
      features: [
        'Up to 25 Rooms / Units',
        'Everything in Starter',
        '2-Way iCal & API Channel Sync',
        'Airbnb & Booking.com Sync',
        'Automated WhatsApp Messages',
        'Custom Domain Support',
        'Priority 24/7 Support'
      ],
      featured: true,
      buttonText: 'Start 14-Day Pro Trial'
    },
    {
      name: 'Enterprise Portfolio',
      desc: 'For multi-property chains and high-volume property managers.',
      monthlyPrice: 119,
      annualPrice: 99,
      features: [
        'Unlimited Rooms & Properties',
        'Everything in Pro',
        'Multi-User Staff Permissions',
        'Dedicated Account Manager',
        'Custom API & Zapier Webhooks',
        'White-label Guest Portal',
        '99.9% Uptime SLA Guarantee'
      ],
      featured: false,
      buttonText: 'Contact Sales'
    }
  ];

  return (
    <section id="pricing" className="pricing-section section-padding">
      <Container>
        <SectionTitle
          badge="TRANSPARENT PRICING"
          title="Simple plans with"
          gradientTitle="Zero Commission Fees"
          subtitle="Keep 100% of your earnings. No hidden charges, setup fees, or lock-in contracts."
        />

        {/* Monthly vs Annual Toggle */}
        <div className="pricing-toggle-wrapper">
          <span className={`pricing-toggle-label ${!isAnnual ? 'active' : ''}`}>
            Monthly Billing
          </span>
          <div
            className={`toggle-switch ${isAnnual ? 'annual' : ''}`}
            onClick={() => setIsAnnual(!isAnnual)}
          >
            <div className="toggle-thumb" />
          </div>
          <span className={`pricing-toggle-label ${isAnnual ? 'active' : ''}`}>
            Annual Billing <span className="badge" style={{ padding: '0.2rem 0.5rem' }}>SAVE 20%</span>
          </span>
        </div>

        {/* Pricing Cards Grid */}
        <div className="pricing-grid">
          {plans.map((plan, idx) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={idx}
                className={`glass-card pricing-card ${plan.featured ? 'featured' : ''}`}
              >
                {plan.featured && <div className="popular-badge">MOST POPULAR</div>}
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-desc">{plan.desc}</p>

                <div className="plan-price-box">
                  <span className="plan-price">${price}</span>
                  <span className="plan-period">/ month {isAnnual ? '(billed annually)' : ''}</span>
                </div>

                <div className="plan-features">
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="plan-feature-item">
                      <span className="feature-check">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant={plan.featured ? 'primary' : 'secondary'}
                  size="md"
                  style={{ width: '100%' }}
                >
                  {plan.buttonText}
                </Button>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default Pricing;
