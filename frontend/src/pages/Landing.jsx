import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import './Landing.css';

const SPLINE_URL =
  'https://my.spline.design/r4xbot-WfgFt3TFUFdcG8QixXdtDqhd/';

export default function Landing() {
  const navigate = useNavigate();
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('r4x-landing-html');
    document.body.classList.add('r4x-landing-body');
    return () => {
      document.documentElement.classList.remove('r4x-landing-html');
      document.body.classList.remove('r4x-landing-body');
    };
  }, []);

  const scrollToJourney = () => {
    const authSection = document.getElementById('landing-auth');
    if (authSection) {
      setTimeout(() => {
        authSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const goToLogin = (role) => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className={`r4x-landing ${sceneReady ? 'is-ready' : ''}`}>
      <section className="r4x-landing__hero">
        <div className="r4x-landing__scene">
          <iframe
            className="r4x-landing__spline"
            src={SPLINE_URL}
            title="R4X Bot — GrowMint"
            frameBorder="0"
            loading="eager"
            allow="autoplay; fullscreen; xr-spatial-tracking"
            onLoad={() => setSceneReady(true)}
          />

          {!sceneReady && (
            <div className="r4x-landing__loader" aria-label="Loading 3D scene">
              <div className="r4x-landing__loader-ring" />
            </div>
          )}
        </div>

        <header className="r4x-landing__brand-bar">
          <span className="r4x-landing__brand">GrowMint</span>
        </header>

        <button
          type="button"
          className="r4x-landing__scroll"
          onClick={scrollToJourney}
          aria-label="Scroll to choose journey"
        >
          <ChevronDown size={22} strokeWidth={1.5} />
          <span>Scroll down</span>
        </button>
      </section>

      <section id="landing-auth" className="r4x-landing__signin">
        <div className="r4x-landing__signin-inner">
          <div className="r4x-landing__signin-header">
            <h2 className="r4x-landing__signin-title">Choose Your Journey</h2>
            <p className="r4x-landing__signin-sub">Tailor your experience based on your role in the learning ecosystem.</p>
          </div>

          <div className="r4x-landing__mode-grid">
            <button
              type="button"
              className="r4x-landing__role-card"
              onClick={() => goToLogin('student')}
            >
              <div className="r4x-landing__role-card-icon">👩‍🎓</div>
              <h3 className="r4x-landing__role-card-title">I am a Student</h3>
              <p className="r4x-landing__role-card-desc">Access personalized courses, track progress, and unlock achievements as you grow.</p>
              <span className="r4x-landing__role-card-action">
                Explore dashboard <ArrowRight size={16} />
              </span>
            </button>

            <button
              type="button"
              className="r4x-landing__role-card"
              onClick={() => goToLogin('educator')}
            >
              <div className="r4x-landing__role-card-icon">👨‍🏫</div>
              <h3 className="r4x-landing__role-card-title">I am an Educator</h3>
              <p className="r4x-landing__role-card-desc">Manage classrooms, design curricula, and empower students through focused instruction.</p>
              <span className="r4x-landing__role-card-action">
                Enter teaching hub <ArrowRight size={16} />
              </span>
            </button>
          </div>
        </div>
      </section>


    </div>
  );
}
