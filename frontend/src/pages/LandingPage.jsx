import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackgroundAnimation from '../components/BackgroundAnimation';

const descriptionText =
  'GridPulse is an intelligent energy management platform that predicts energy consumption, optimizes future demand, and helps reduce energy costs for a more sustainable future.';

export const LandingPage = () => {
  const navigate = useNavigate();

  const descriptionRef = useRef(null);
  const getStartedRef = useRef(null);

  const [descriptionVisible, setDescriptionVisible] = useState(false);
  const [getStartedVisible, setGetStartedVisible] = useState(false);

  /*
   * ---------------------------------------------------------
   * HERO ANIMATION
   * ---------------------------------------------------------
   * The hero is visible immediately when the page loads.
   * Its SVG title animation is controlled entirely by CSS.
   */

  /*
   * ---------------------------------------------------------
   * SCROLL-TRIGGERED ANIMATIONS
   * ---------------------------------------------------------
   *
   * Description animation:
   * Starts only when the description section enters the viewport.
   *
   * Get Started animation:
   * Starts only when the Get Started section enters the viewport.
   */

  useEffect(() => {
    const observers = [];

    // Description observer
    if (descriptionRef.current) {
      const descriptionObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setDescriptionVisible(true);
            descriptionObserver.disconnect();
          }
        },
        {
          threshold: 0.35,
        }
      );

      descriptionObserver.observe(descriptionRef.current);
      observers.push(descriptionObserver);
    }

    // Get Started observer
    if (getStartedRef.current) {
      const getStartedObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setGetStartedVisible(true);
            getStartedObserver.disconnect();
          }
        },
        {
          threshold: 0.35,
        }
      );

      getStartedObserver.observe(getStartedRef.current);
      observers.push(getStartedObserver);
    }

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * DESCRIPTION CHARACTERS
   * ---------------------------------------------------------
   */

  const descriptionCharacters = descriptionText.split('');

  /*
   * ---------------------------------------------------------
   * GET STARTED CHARACTERS
   * ---------------------------------------------------------
   */

  const getStartedText = 'GET STARTED';

  const getStartedCharacters = getStartedText.split('');

  return (
    <main className="gridpulse-landing">

      {/* =====================================================
          HERO SECTION
          ===================================================== */}

      <section className="gridpulse-hero">

        {/* Background video */}
        <BackgroundAnimation/>

        {/* Light overlay */}
        <div className="gridpulse-hero-overlay" />

        {/* Hero content */}
        <div className="gridpulse-hero-content is-visible">

          {/* GridPulse SVG title */}
          <div className="gridpulse-title-wrapper">

            <svg
              className="gridpulse-title-svg"
              viewBox="0 0 1400 260"
              role="img"
              aria-label="GridPulse"
            >
              {/* Stroke drawing */}
              <text
                x="50%"
                y="62%"
                textAnchor="middle"
                fontWeight="800"
                className="gridpulse-title-stroke"
              >
                GridPulse
              </text>

              {/* Filled text */}
              <text
                x="50%"
                y="62%"
                textAnchor="middle"
                fontWeight="800"
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
        <div className="gridpulse-scroll-indicator">
          <span className="gridpulse-scroll-text">
            SCROLL
          </span>

          <span className="gridpulse-scroll-line" />
        </div>

      </section>


      {/* =====================================================
          DESCRIPTION SECTION
          ===================================================== */}

      <section
        ref={descriptionRef}
        className={`gridpulse-description ${
          descriptionVisible ? 'is-visible' : ''
        }`}
      >

        <div className="gridpulse-description-inner">

          <p className="gridpulse-description-label">
            INTELLIGENT ENERGY MANAGEMENT
          </p>

          <p className="gridpulse-description-text">
            {descriptionCharacters.map((char, index) => (
              <span
                key={`${char}-${index}`}
                style={{
                  '--char-index': index,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </p>

        </div>

      </section>


      {/* =====================================================
          GET STARTED SECTION
          ===================================================== */}

      <section
        ref={getStartedRef}
        className={`gridpulse-get-started ${
          getStartedVisible ? 'is-visible' : ''
        }`}
      >

        <div className="gridpulse-get-started-inner">

          {/* GET STARTED animated text */}
          <h2 className="gridpulse-get-started-title">
            {getStartedCharacters.map((char, index) => (
              <span
                key={`${char}-${index}`}
                style={{
                  '--char-index': index,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h2>


          {/* Authentication buttons */}
          <div className="gridpulse-auth-actions">

            <button
              type="button"
              className="gridpulse-auth-button gridpulse-auth-primary"
              onClick={() => navigate('/login')}
            >
              LOGIN
            </button>

            <button
              type="button"
              className="gridpulse-auth-button gridpulse-auth-secondary"
              onClick={() => navigate('/register')}
            >
              SIGN UP
            </button>

          </div>

        </div>

      </section>

    </main>
  );
};

export default LandingPage;