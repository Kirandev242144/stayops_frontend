import React, { useState, useEffect, memo } from "react";
import {
  FiCalendar,
  FiChevronRight,
  FiGlobe,
} from "react-icons/fi";
import { TbBed, TbCurrencyRupee } from "react-icons/tb";
import { SiAirbnb, SiBookingdotcom } from "react-icons/si";
import relaxedMan from "../../../assets/login/relaxed-young-man.png";
import "./LoginShowcase.css";

// Ultra-smooth leaf counter: prevents parent re-renders and eliminates frame drops
const AnimatedCount = memo(({ target, duration = 1800, delay = 250, prefix = "", suffix = "" }) => {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let animId = null;
    let startTime = null;

    const timer = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Silky exponential ease-out
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.round(ease * target);
        setVal(current);

        if (progress < 1) {
          animId = requestAnimationFrame(step);
        }
      };
      animId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [target, duration, delay]);

  return (
    <span>
      {prefix}
      {val.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
});

const LoginShowcase = () => {
  return (
    <div className="showcase-stage">
      {/* Centered Relaxed Host Image */}
      <div className="showcase-man-wrapper">
        <img
          src={relaxedMan}
          alt="StayOps Property Host"
          className="showcase-man-img"
        />
      </div>

      {/* 1. OCCUPANCY RATE CARD (Top Left) */}
      <div className="metric-card card-occupancy">
        <div className="card-top-row">
          <div className="card-icon-title">
            <span className="card-icon-pill icon-teal">
              <TbBed size={15} />
            </span>
            <span className="card-label">Occupancy Rate</span>
          </div>
          <span className="card-time-pill">This Month ▾</span>
        </div>
        <div className="card-body-row">
          <div className="card-stat-group">
            <div className="card-stat-num">
              <AnimatedCount target={72} suffix="%" duration={1300} delay={200} />
            </div>
            <div className="card-trend trend-green">
              <span>▲</span> 12% vs last month
            </div>
          </div>
          <div className="card-mini-bars bars-teal">
            <span style={{ "--target-height": "45%", animationDelay: "0.2s" }}></span>
            <span style={{ "--target-height": "65%", animationDelay: "0.3s" }}></span>
            <span style={{ "--target-height": "50%", animationDelay: "0.4s" }}></span>
            <span style={{ "--target-height": "80%", animationDelay: "0.5s" }}></span>
            <span style={{ "--target-height": "100%", animationDelay: "0.6s" }}></span>
          </div>
        </div>
      </div>

      {/* 2. TOTAL BOOKINGS CARD (Top Right) */}
      <div className="metric-card card-bookings">
        <div className="card-top-row">
          <div className="card-icon-title">
            <span className="card-icon-pill icon-orange">
              <FiCalendar size={14} />
            </span>
            <span className="card-label">Total Bookings</span>
          </div>
          <span className="card-time-pill">This Month ▾</span>
        </div>
        <div className="card-body-row">
          <div className="card-stat-group">
            <div className="card-stat-num">
              <AnimatedCount target={28} duration={1200} delay={250} />
            </div>
            <div className="card-trend trend-green">
              <span>▲</span> 27% vs last month
            </div>
          </div>
          <div className="card-mini-bars bars-orange">
            <span style={{ "--target-height": "35%", animationDelay: "0.3s" }}></span>
            <span style={{ "--target-height": "55%", animationDelay: "0.4s" }}></span>
            <span style={{ "--target-height": "75%", animationDelay: "0.5s" }}></span>
            <span style={{ "--target-height": "60%", animationDelay: "0.6s" }}></span>
            <span style={{ "--target-height": "95%", animationDelay: "0.7s" }}></span>
          </div>
        </div>
      </div>

      {/* 3. REVENUE CARD (Middle Left) */}
      <div className="metric-card card-revenue">
        <div className="card-top-row">
          <div className="card-icon-title">
            <span className="card-icon-pill icon-blue">
              <TbCurrencyRupee size={15} />
            </span>
            <span className="card-label">Revenue</span>
          </div>
          <span className="card-time-pill">This Month ▾</span>
        </div>
        <div className="revenue-main-stat">
          <div className="card-stat-num revenue-counter">
            <AnimatedCount target={248500} prefix="₹" duration={1800} delay={200} />
          </div>
          <div className="card-trend trend-green">
            <span>▲</span> 18% vs last month
          </div>
        </div>
        <div className="revenue-chart-wrap">
          <svg viewBox="0 0 170 38" className="revenue-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Fill Area with Gradient */}
            <path
              d="M 0,30 Q 30,34 50,22 T 95,20 T 135,10 L 170,6 L 170,38 L 0,38 Z"
              className="revenue-chart-area"
              fill="url(#revGradient)"
            />
            {/* Animated Stroke Line */}
            <path
              d="M 0,30 Q 30,34 50,22 T 95,20 T 135,10 L 170,6"
              className="revenue-chart-line"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Pulsing Highlight Dot at Curve End */}
            <circle cx="170" cy="6" r="3.5" className="revenue-chart-dot" fill="#2563EB" />
            <circle cx="170" cy="6" r="6" className="revenue-chart-pulse" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* 4. UPCOMING CHECK-INS CARD (Middle Right) */}
      <div className="metric-card card-checkins">
        <div className="card-header-action">
          <span className="card-section-title">Upcoming Check-ins</span>
          <FiChevronRight size={14} className="card-chevron" />
        </div>
        <div className="checkins-list">
          <div className="checkin-item">
            <div className="checkin-avatar av-1">RM</div>
            <div className="checkin-info">
              <span className="checkin-name">Rahul Mehta</span>
              <span className="checkin-meta">2 Guests • 3 Nights</span>
            </div>
            <span className="status-pill status-today">Today</span>
          </div>

          <div className="checkin-item">
            <div className="checkin-avatar av-2">PS</div>
            <div className="checkin-info">
              <span className="checkin-name">Priya Sharma</span>
              <span className="checkin-meta">4 Guests • 2 Nights</span>
            </div>
            <span className="status-pill status-tomorrow">Tomorrow</span>
          </div>

          <div className="checkin-item">
            <div className="checkin-avatar av-3">AN</div>
            <div className="checkin-info">
              <span className="checkin-name">Arjun Nair</span>
              <span className="checkin-meta">2 Guests • 1 Night</span>
            </div>
            <span className="status-pill status-date">12 Nov</span>
          </div>
        </div>
      </div>

      {/* 5. ROOM AVAILABILITY CARD (Bottom Left) */}
      <div className="metric-card card-rooms">
        <div className="card-header-action">
          <span className="card-section-title">Room Availability</span>
          <FiChevronRight size={14} className="card-chevron" />
        </div>
        <div className="rooms-list">
          <div className="room-item">
            <span className="room-name">Deluxe Room</span>
            <div className="room-bar-track">
              <div className="room-bar-fill bar-teal anim-progress" style={{ "--target-width": "75%" }}></div>
            </div>
            <span className="room-count">6 / 8</span>
          </div>

          <div className="room-item">
            <span className="room-name">Standard Room</span>
            <div className="room-bar-track">
              <div className="room-bar-fill bar-orange anim-progress" style={{ "--target-width": "66%", animationDelay: "0.15s" }}></div>
            </div>
            <span className="room-count">4 / 6</span>
          </div>

          <div className="room-item">
            <span className="room-name">Family Room</span>
            <div className="room-bar-track">
              <div className="room-bar-fill bar-blue anim-progress" style={{ "--target-width": "50%", animationDelay: "0.3s" }}></div>
            </div>
            <span className="room-count">2 / 4</span>
          </div>
        </div>
      </div>

      {/* 6. CHANNEL BOOKINGS CARD (Bottom Right) */}
      <div className="metric-card card-channels">
        <div className="card-header-action">
          <span className="card-section-title">Channel Bookings</span>
          <FiChevronRight size={14} className="card-chevron" />
        </div>
        <div className="channels-list">
          <div className="channel-item">
            <div className="channel-brand">
              <span className="channel-icon-bg abnb">
                <SiAirbnb size={13} color="#FFFFFF" />
              </span>
              <span className="channel-name">Airbnb</span>
            </div>
            <span className="channel-stat-num">12</span>
            <span className="channel-trend">▲ 33%</span>
          </div>

          <div className="channel-item">
            <div className="channel-brand">
              <span className="channel-icon-bg bcom">
                <SiBookingdotcom size={13} color="#FFFFFF" />
              </span>
              <span className="channel-name">Booking.com</span>
            </div>
            <span className="channel-stat-num">8</span>
            <span className="channel-trend">▲ 14%</span>
          </div>

          <div className="channel-item">
            <div className="channel-brand">
              <span className="channel-icon-bg mmt">
                my
              </span>
              <span className="channel-name">MakeMyTrip</span>
            </div>
            <span className="channel-stat-num">5</span>
            <span className="channel-trend">▲ 25%</span>
          </div>

          <div className="channel-item">
            <div className="channel-brand">
              <span className="channel-icon-bg direct">
                <FiGlobe size={13} color="#FFFFFF" />
              </span>
              <span className="channel-name">Direct Website</span>
            </div>
            <span className="channel-stat-num">3</span>
            <span className="channel-trend">▲ 50%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginShowcase;
