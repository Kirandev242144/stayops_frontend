import React from "react";
import "./SupportBanner.css";
import Container from "../../../../components/common/Container/Container";
import { FiMail, FiMessageCircle, FiHeadphones, FiArrowUpRight } from "react-icons/fi";

function SupportBanner() {
  return (
    <section className="hc-support-minimal" id="hc-support-section">
      <Container>
        <div className="hc-support-minimal-header">
          <h2 className="hc-support-minimal-title">Still have questions?</h2>
          <p className="hc-support-minimal-sub">
            Can’t find the answer you’re looking for? Reach out to our support team directly.
          </p>
        </div>

        <div className="hc-support-minimal-grid">
          {/* Email Card */}
          <a
            href="mailto:support@stayops.in?subject=StayOps%20Support%20Inquiry"
            className="hc-minimal-card"
          >
            <div className="hc-minimal-card-header">
              <div className="hc-minimal-icon">
                <FiMail />
              </div>
              <FiArrowUpRight className="hc-minimal-arrow" />
            </div>
            <h3 className="hc-minimal-title">Email Support</h3>
            <p className="hc-minimal-desc">
              For account inquiries, billing, and general questions.
            </p>
            <span className="hc-minimal-link">support@stayops.in</span>
          </a>

          {/* WhatsApp Card */}
          <a
            href="https://wa.me/918277177355?text=Hi%20StayOps%20Team%2C%20I%20have%20a%20question%20regarding%20my%20property"
            target="_blank"
            rel="noreferrer"
            className="hc-minimal-card"
          >
            <div className="hc-minimal-card-header">
              <div className="hc-minimal-icon">
                <FiMessageCircle />
              </div>
              <FiArrowUpRight className="hc-minimal-arrow" />
            </div>
            <h3 className="hc-minimal-title">WhatsApp</h3>
            <p className="hc-minimal-desc">
              Fast onboarding assistance and quick setup queries.
            </p>
            <span className="hc-minimal-link">+91 82771 77355</span>
          </a>

          {/* Dashboard Support */}
          <a
            href="#chat"
            className="hc-minimal-card"
            onClick={(e) => {
              e.preventDefault();
              alert("You can chat with our team directly from the StayOps Owner Dashboard or email support@stayops.in");
            }}
          >
            <div className="hc-minimal-card-header">
              <div className="hc-minimal-icon">
                <FiHeadphones />
              </div>
              <FiArrowUpRight className="hc-minimal-arrow" />
            </div>
            <h3 className="hc-minimal-title">Live Chat</h3>
            <p className="hc-minimal-desc">
              Available directly inside your owner portal.
            </p>
            <span className="hc-minimal-link">Open in dashboard</span>
          </a>
        </div>
      </Container>
    </section>
  );
}

export default SupportBanner;