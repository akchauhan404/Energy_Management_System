import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const DESCRIPTION =
  'GridPulse is an intelligent energy management platform that predicts energy consumption, optimizes future demand, and helps reduce energy costs for a more sustainable future.';

const splitText = (text) =>
  text.split('').map((char, index) => (
    <span
      key={`${char}-${index}`}
      className="gridpulse-description-char"
      style={{ '--char-index': index }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));

const splitBouncyText = (text) =>
  text.split('').map((char, index) => (
    <span
      key={`${char}-${index}`}
      className="gridpulse-bouncy-char"
      style={{ '--char-index': index }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));

export const LandingPage = () => {
  const [showCtaButtons, setShowCtaButtons] = useState(false);
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHeroReady(true);
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowCtaButtons(false);

          const timer = window.setTimeout(() => {
            setShowCtaButtons(true);
          }, 2600);

          return () => window.clearTimeout(timer);
        }
      },
      {
        threshold: 0.65
      }
    );

    const section = document.querySelector('.gridpulse-get-started');

    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const scrollToDescription = () => {
    document
      .querySelector('.gridpulse-description')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="gridpulse-landing">
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="gridpulse-hero">
        <video
          className="gridpulse-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source
            src="/gridpulse-energy.webm"
            type="video/webm"
          />
        </video>

        <div className="gridpulse-hero-overlay" />
        <div className="gridpulse-hero-glow" />

        <div
          className={`gridpulse-hero-content ${
            heroReady ? 'is-visible' : ''
          }`}
        >
          {/* GridPulse title */}
          <div className="gridpulse-title-wrapper">
            <svg
              className="gridpulse-title-svg"
              viewBox="0 0 1400 260 "
              role="img" 
              aria-label="GridPulse"
            >
              <text
                x="50%"
                y="60%"
                textAnchor="middle"
                fontWeight="800"
                className="gridpulse-title-stroke"
              >
                GridPulse
              </text>

              <text
                x="50%"
                y="58%"
                textAnchor="middle"
                className="gridpulse-title-fill"
              >
                GridPulse
              </text>
            </svg>
          </div>

          {/* Tagline */}
          <p className="gridpulse-tagline">
            Predict. Optimize. Sustain.
          </p>
        </div>

        {/* Scroll indicator */}
        <button
          type="button"
          className="gridpulse-scroll-indicator"
          onClick={scrollToDescription}
          aria-label="Scroll to description"
        >
          <span className="gridpulse-mouse">
            <span className="gridpulse-mouse-wheel" />
          </span>

          <span className="gridpulse-scroll-label">
            Scroll
          </span>
        </button>
      </section>

      {/* =====================================================
          DESCRIPTION
      ====================================================== */}
      <section className="gridpulse-description">
        <div className="gridpulse-description-inner">
          <span className="gridpulse-section-label">
            INTELLIGENT ENERGY MANAGEMENT
          </span>

          <div className="gridpulse-description-line" />

          <p className="gridpulse-description-text">
            {splitText(DESCRIPTION)}
          </p>
        </div>
      </section>

      {/* =====================================================
          GET STARTED
      ====================================================== */}
      <section className="gridpulse-get-started">
        <div className="gridpulse-get-started-inner">
          <span className="gridpulse-section-label">
            TAKE CONTROL OF YOUR ENERGY
          </span>

          <h2 className="gridpulse-get-started-title">
            {splitBouncyText('GET STARTED')}
          </h2>

          <div
            className={`gridpulse-auth-actions ${
              showCtaButtons ? 'is-visible' : ''
            }`}
          >
            <Link
              to="/login"
              className="gridpulse-auth-button gridpulse-auth-primary"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="gridpulse-auth-button gridpulse-auth-secondary"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;