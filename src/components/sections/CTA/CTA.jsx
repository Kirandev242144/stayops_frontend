import React from 'react';
import { Link } from 'react-router-dom';
import Container from '../../common/Container/Container';
import Button from '../../common/Button/Button';
import './CTA.css';

/**
 * CTA (Call-To-Action) Component
 * Prominent banner encouraging property owners to sign up for a trial or book a demo.
 */
const CTA = () => {
  const handleScrollToDemo = (e) => {
    e.preventDefault();
    const el = document.getElementById("book-demo");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#book-demo";
    }
  };

  return (
    <section className="cta-section section-padding">
      <Container>
        <div className="cta-box">
          <h2 className="cta-title">
            Ready to Automate Your Property & <span className="text-gradient">Maximize Revenue?</span>
          </h2>
          <p className="cta-subtitle">
            Join hundreds of homestays, villas, and boutique resorts already growing their business with StayOps. No credit card required.
          </p>

          <div className="cta-buttons">
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg">
                Start Your 14-Day Free Trial
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleScrollToDemo}
            >
              Schedule Live Demo
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default CTA;
