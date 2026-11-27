import React, { useState } from 'react';
import Container from '../../common/Container/Container';
import SectionTitle from '../../common/SectionTitle/SectionTitle';
import './FAQ.css';

/**
 * FAQ Section Component
 * Interactive accordion list answering common host questions.
 */
const FAQ = () => {
  // openIndex keeps track of which accordion item is currently open (null = all closed)
  const [openIndex, setOpenIndex] = useState(0);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqItems = [
    {
      q: 'How long does it take to set up StayOps for my property?',
      a: 'You can set up your StayOps account, add your rooms, and generate your direct booking website in less than 15 minutes. Our onboarding wizard guides you step-by-step.'
    },
    {
      q: 'Can I connect my custom domain to my guest booking website?',
      a: 'Yes! All Pro and Enterprise plans allow you to link your custom domain (e.g., www.mistyhillsvilla.com) with free SSL encryption included.'
    },
    {
      q: 'How does 2-way channel syncing work with Airbnb & Booking.com?',
      a: 'StayOps connects directly to OTAs via instant iCal & API channels. Whenever a guest books on Airbnb or on your direct site, that room is immediately blocked out across all connected platforms to prevent double bookings.'
    },
    {
      q: 'Does StayOps charge any commissions on my direct guest bookings?',
      a: 'Zero! StayOps charges $0 commission on direct bookings. You keep 100% of your booking revenue directly into your connected payment account.'
    },
    {
      q: 'Can my staff use StayOps on their smartphones?',
      a: 'Absolutely. StayOps is fully mobile responsive and works smoothly on smartphones and tablets, allowing housekeepers and front-desk staff to update room statuses on the go.'
    }
  ];

  return (
    <section id="faq" className="faq-section section-padding">
      <Container>
        <SectionTitle
          badge="GOT QUESTIONS?"
          title="Frequently Asked"
          gradientTitle="Questions"
          subtitle="Everything you need to know about StayOps features, pricing, and setup."
        />

        <div className="faq-list">
          {faqItems.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  className="faq-question"
                  onClick={() => toggleAccordion(idx)}
                >
                  <span>{item.q}</span>
                  <span className="faq-icon">+</span>
                </button>
                {isOpen && <div className="faq-answer">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default FAQ;
