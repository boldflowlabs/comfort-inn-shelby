"use client";

import React from "react";
import Script from "next/script";
import {
  Wifi,
  Coffee,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  ArrowRight,
  Check,
  Info,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import "./home.css";

export default function Home() {
  const openElara = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const iframe = document.getElementById("elara-chat-iframe") as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: "ELARA_OPEN" }, "*");
    } else {
      // Fallback: search for launcher button inside host DOM if present
      const launcher = document.querySelector(".launcher-button") as HTMLButtonElement;
      if (launcher) launcher.click();
    }
  };

  return (
    <div className="home-wrapper">
      {/* Script Loader for floating chatbot widget */}
      <Script src="/widget.js" strategy="lazyOnload" />

      {/* Navbar */}
      <nav className="home-nav">
        <div className="home-nav-logo">
          <div className="home-nav-brand">
            Comfort Inn <span>Shelby</span>
          </div>
          <span className="home-nav-tagline">North Carolina</span>
        </div>
        <div className="home-nav-links">
          <a href="#rooms" className="home-nav-link">Rooms</a>
          <a href="#amenities" className="home-nav-link">Amenities</a>
          <a href="#renovations" className="home-nav-link">Renovation Updates</a>
        </div>
        <button onClick={() => openElara()} className="home-nav-btn">
          Chat with Elara
        </button>
      </nav>

      {/* Asymmetrical Hero Section */}
      <header className="home-hero">
        <div className="home-hero-grid animate-slide-up">
          <div className="home-hero-left">
            <span className="home-hero-badge">
              <Sparkles size={12} style={{ marginRight: 6, display: "inline" }} />
              Direct Booking Rate Guarantee
            </span>
            <h1 className="home-hero-title">
              Comfortable Stay <br />in Shelby, NC
              <span className="home-hero-serif-sub">Welcoming Southern Hospitality</span>
            </h1>
            <p className="home-hero-tagline">
              Enjoy premium comfort, free hot breakfast, high-speed Wi-Fi, and convenient highway access. Chat with Elara, our virtual concierge, to claim your exclusive direct booking discount.
            </p>
            <div className="home-hero-actions">
              <button onClick={() => openElara()} className="home-booking-btn">
                Check Direct Rates
              </button>
              <a href="#rooms" className="btn-secondary">
                Explore Rooms
              </a>
            </div>
          </div>
          <div className="home-hero-right">
            <div className="home-hero-img-frame">
              <div className="home-hero-img" style={{ backgroundImage: "url('/hotel_hero_lobby.png')" }} />
              <span className="home-hero-img-caption">
                Comfort Inn Shelby Lobby & Breakfast Parlor
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="home-section" style={{ paddingBottom: 20 }}>
        
        {/* Renovation Notice Card */}
        <section id="renovations" className="home-renovation-card" style={{ animation: "fadeIn 0.5s ease" }}>
          <div className="home-renovation-badge">
            <AlertTriangle size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />
            Update
          </div>
          <div className="home-renovation-content">
            <h3 className="home-renovation-title">Elevator & Swimming Pool Modernization Notice</h3>
            <p className="home-renovation-text">
              We are currently resurfacing our outdoor swimming pool to improve guest experiences; it will remain closed until **Memorial Day Weekend 2026**. Additionally, our elevator is closed for mechanical modernization. Rest assured, guest rooms are fully accessible on the 1st floor. Please request a ground floor room when making a reservation if you require step-free accessibility. Thank you for your understanding!
            </p>
          </div>
        </section>

        {/* Amenities Section */}
        <section id="amenities" style={{ marginTop: 40 }}>
          <div className="home-section-header">
            <h2 className="home-section-title">Hotel Amenities <span>& Benefits</span></h2>
            <p className="home-section-subtitle">
              Everything you need for a comfortable, stress-free stay at Comfort Inn Shelby.
            </p>
          </div>

          <div className="home-amenities-grid">
            <div className="home-amenity-card">
              <div className="home-amenity-icon">
                <Coffee size={24} />
              </div>
              <h3 className="home-amenity-title">Free Hot Breakfast</h3>
              <p className="home-amenity-desc">
                Start your day right with a delicious array of fresh hot waffles, eggs, sausage, yogurt, fresh fruit, and premium coffee served daily from **6:00 AM to 9:30 AM**.
              </p>
            </div>

            <div className="home-amenity-card">
              <div className="home-amenity-icon">
                <Wifi size={24} />
              </div>
              <h3 className="home-amenity-title">High-Speed Wi-Fi</h3>
              <p className="home-amenity-desc">
                Stay connected throughout the entire hotel property with complimentary high-speed fiber-optic Wi-Fi, perfect for business meetings, remote work, or streaming.
              </p>
            </div>

            <div className="home-amenity-card">
              <div className="home-amenity-icon">
                <Calendar size={24} />
              </div>
              <h3 className="home-amenity-title">Modern Fitness Center</h3>
              <p className="home-amenity-desc">
                Maintain your workout routine in our on-site gym featuring state-of-the-art treadmills, stationary bikes, and free weights, open daily from **6:00 AM to 10:00 PM**.
              </p>
            </div>

            <div className="home-amenity-card">
              <div className="home-amenity-icon">
                <MapPin size={24} />
              </div>
              <h3 className="home-amenity-title">EV Charging Station</h3>
              <p className="home-amenity-desc">
                Charge your electric vehicle overnight. We provide Level 2 J1772 and Tesla destination chargers in our secure, well-lit parking lot for guest convenience.
              </p>
            </div>
          </div>
        </section>

        {/* Rooms Section */}
        <section id="rooms" style={{ marginTop: 80, marginBottom: 60 }}>
          <div className="home-section-header">
            <h2 className="home-section-title">Sleek, Comfortable <span>Guest Rooms</span></h2>
            <p className="home-section-subtitle">
              Settle into spacious accommodations designed for productivity and relaxation.
            </p>
          </div>

          <div className="home-rooms-grid">
            {/* Room 1 */}
            <div className="home-room-card">
              <div className="home-room-img-container">
                <div className="home-room-img" style={{ backgroundImage: "url('/hotel_room_deluxe.png')" }} />
                <span className="home-room-badge">Popular</span>
              </div>
              <div className="home-room-info">
                <h3 className="home-room-title">1 King Bed Deluxe Suite</h3>
                <div className="home-room-specs">
                  <div className="home-room-spec-item">
                    <Check size={14} style={{ color: "var(--gold-500)" }} />
                    <span>Sleeps 2</span>
                  </div>
                  <div className="home-room-spec-item">
                    <Check size={14} style={{ color: "var(--gold-500)" }} />
                    <span>Microwave & Fridge</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.5, marginBottom: 20 }}>
                  Enjoy a spacious layout featuring a plush pillow-top King Bed, a dedicated writing desk with ergonomic chair, flat-screen HDTV, coffee maker, and modern bathroom amenities.
                </p>
                <div className="home-room-price-notice">
                  <div className="home-room-price">
                    Direct Rate from <span>$99</span>/night
                  </div>
                  <button onClick={(e) => openElara(e)} className="home-room-price-btn">
                    <span>Book Direct</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Room 2 */}
            <div className="home-room-card">
              <div className="home-room-img-container">
                <div className="home-room-img" style={{ backgroundImage: "url('/hotel_room_deluxe.png')", filter: "hue-rotate(20deg)" }} />
                <span className="home-room-badge">Family Friendly</span>
              </div>
              <div className="home-room-info">
                <h3 className="home-room-title">2 Queen Beds Deluxe Room</h3>
                <div className="home-room-specs">
                  <div className="home-room-spec-item">
                    <Check size={14} style={{ color: "var(--gold-500)" }} />
                    <span>Sleeps 4</span>
                  </div>
                  <div className="home-room-spec-item">
                    <Check size={14} style={{ color: "var(--gold-500)" }} />
                    <span>Microwave & Fridge</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.5, marginBottom: 20 }}>
                  Ideal for travel groups and families, this room offers two premium Queen Beds, high-speed Wi-Fi, a workspace, individual climate control, and standard home conveniences.
                </p>
                <div className="home-room-price-notice">
                  <div className="home-room-price">
                    Direct Rate from <span>$109</span>/night
                  </div>
                  <button onClick={(e) => openElara(e)} className="home-room-price-btn">
                    <span>Book Direct</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="home-booking-banner">
          <span className="home-booking-subtitle">Exclusive Reward</span>
          <h2 className="home-booking-title">Get 10% Off Direct Bookings</h2>
          <p className="home-booking-text">
            Avoid third-party booking fees and receive our lowest rate guarantee. Simply chat with Elara, our virtual concierge, to enter dates, verify rooms, and get your custom discount link.
          </p>
          <div className="home-booking-benefits">
            <div className="home-booking-benefit-item">
              <Check size={16} />
              <span>No Hidden Booking Fees</span>
            </div>
            <div className="home-booking-benefit-item">
              <Check size={16} />
              <span>Flexible 24h Cancellation</span>
            </div>
            <div className="home-booking-benefit-item">
              <Check size={16} />
              <span>Complimentary Room Upgrades</span>
            </div>
          </div>
          <button onClick={() => openElara()} className="home-booking-btn">
            Unlock 10% Discount
          </button>
        </section>

      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-grid">
          <div>
            <div className="home-footer-brand">
              Comfort Inn <span>Shelby</span>
            </div>
            <p className="home-footer-desc">
              Your home away from home in Shelby, North Carolina. Experience clean, comfortable rooms, rich breakfast spreads, and warm hospitality.
            </p>
          </div>
          <div>
            <h4 className="home-footer-col-title">Location</h4>
            <div className="home-footer-links" style={{ color: "#94a3b8", fontSize: "0.88rem" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <MapPin size={16} style={{ color: "var(--gold-400)", flexShrink: 0, marginTop: 3 }} />
                <span>
                  2012 E Marion St,<br />
                  Shelby, NC 28152
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="home-footer-col-title">Contact</h4>
            <div className="home-footer-links">
              <a href="tel:704-482-5666" className="home-footer-link">
                <Phone size={16} style={{ color: "var(--gold-400)" }} />
                <span>704-482-5666</span>
              </a>
            </div>
          </div>
        </div>
        <div className="home-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Comfort Inn Shelby. All rights reserved.</span>
          <span>Designed with Elara Concierge Chatbot Integration.</span>
        </div>
      </footer>
    </div>
  );
}
