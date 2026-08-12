import React, { useState, useEffect } from 'react';
import { authenticateUser, getRoleTitle } from '../utils/userStorage';
import type { AuthUser } from '../types';
import { User, Lock, ArrowRight, Eye, EyeOff, Users, BookOpen, Trophy } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

const BG_IMAGES = [
  '/login_bg/bg1.png',
  '/login_bg/bg2.png',
  '/login_bg/bg3.png'
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [activeBgIndex, setActiveBgIndex] = useState(0);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto rotate background every 10 seconds if user doesn't manually click
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBgIndex(prev => (prev + 1) % BG_IMAGES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both email/username and password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const userAccount = authenticateUser(username, password);

      if (!userAccount) {
        setIsSubmitting(false);
        setError('Invalid credentials. Please enter a valid username and password.');
        return;
      }

      const authUser: AuthUser = {
        username: userAccount.username,
        name: userAccount.name,
        role: userAccount.role,
        roleTitle: getRoleTitle(userAccount.role)
      };

      setIsSubmitting(false);
      onLogin(authUser);
    }, 450);
  };

  return (
    <div className="chess-login-page">
      {/* Background Images Layer with smooth crossfade */}
      {BG_IMAGES.map((bgUrl, idx) => (
        <div
          key={bgUrl}
          className={`chess-login-bg ${activeBgIndex === idx ? 'active' : ''}`}
          style={{ backgroundImage: `url(${bgUrl})` }}
        />
      ))}

      {/* Dark Vignette Overlay */}
      <div className="chess-login-overlay" />

      {/* Main Container */}
      <div className="chess-login-container">
        
        {/* Left Section: Branding & Highlights */}
        <div className="chess-left-brand">
          
          {/* Logo Matching Reference Screenshot */}
          <div className="chess-brand-logo-card">
            <div className="chess-knight-svg-wrapper">
              <svg width="68" height="78" viewBox="0 0 100 115" fill="none">
                <defs>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f7e096" />
                    <stop offset="45%" stopColor="#d4a63b" />
                    <stop offset="100%" stopColor="#8c681c" />
                  </linearGradient>
                </defs>
                {/* Pedestal */}
                <rect x="12" y="100" width="76" height="8" rx="4" fill="url(#goldGrad)" />
                <rect x="22" y="93" width="56" height="6" rx="2" fill="url(#goldGrad)" />
                {/* Knight Body */}
                <path 
                  d="M 30 92 
                     C 30 78, 22 68, 25 54 
                     C 27 44, 34 36, 42 22 
                     C 45 16, 48 10, 52 6 
                     C 55 10, 60 16, 68 18 
                     C 76 20, 82 28, 80 38 
                     C 78 48, 70 56, 75 68 
                     C 78 74, 82 82, 70 92 
                     Z" 
                  fill="url(#goldGrad)" 
                />
                {/* Snout & Jaw Detail */}
                <path d="M 32 40 C 22 45, 18 58, 28 66 C 36 72, 42 78, 48 88 Z" fill="url(#goldGrad)" />
                {/* Eye cutout */}
                <circle cx="48" cy="32" r="3.5" fill="#12131a" />
              </svg>
            </div>

            <div className="chess-logo-text-wrap">
              <span className="chess-logo-main">CHESS</span>
              <span className="chess-logo-sub">— ACADEMY —</span>
            </div>
          </div>

          {/* Headline & Tagline */}
          <div className="chess-brand-body">
            <h1 className="chess-headline">
              Think. Learn. <span className="gold-text">Master.</span>
            </h1>
            <p className="chess-tagline">
              Join a community of chess enthusiasts and take your game to the next level.
            </p>
          </div>

          {/* Bottom Feature Badges */}
          <div className="chess-features-row">
            <div className="chess-feature-item">
              <div className="chess-feature-icon">
                <Users size={18} />
              </div>
              <div className="chess-feature-text">
                <strong>Expert Coaches</strong>
                <span>Learn from the best</span>
              </div>
            </div>

            <div className="chess-feature-item">
              <div className="chess-feature-icon">
                <BookOpen size={18} />
              </div>
              <div className="chess-feature-text">
                <strong>Structured Courses</strong>
                <span>From beginner to advanced</span>
              </div>
            </div>

            <div className="chess-feature-item">
              <div className="chess-feature-icon">
                <Trophy size={18} />
              </div>
              <div className="chess-feature-text">
                <strong>Tournaments</strong>
                <span>Compete and grow</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Dark Luxury Login Card */}
        <div className="chess-right-card-wrapper">
          <div className="chess-login-card">
            
            {/* Card Header */}
            <div className="chess-card-header">
              <h2>Welcome Back</h2>
              <p>Login to continue your journey</p>
            </div>

            {error && (
              <div className="chess-error-banner">
                ⚠️ {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="chess-card-form">
              {/* Username Input */}
              <div className="chess-form-group">
                <div className="chess-input-wrapper">
                  <User className="chess-input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="Email or Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="chess-input"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="chess-form-group">
                <div className="chess-input-wrapper">
                  <Lock className="chess-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="chess-input"
                  />
                  <button
                    type="button"
                    className="chess-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="chess-options-row">
                <label className="chess-remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <a 
                  href="#forgot" 
                  onClick={(e) => { e.preventDefault(); alert("Default admin password is 'admin123'"); }}
                  className="chess-forgot-link"
                >
                  Forgot Password?
                </a>
              </div>

              {/* Golden Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="chess-gold-btn"
              >
                {isSubmitting ? (
                  <span>Logging in...</span>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Or Continue With */}
              <div className="chess-divider">
                <span>or continue with</span>
              </div>

              {/* Social Login Buttons */}
              <div className="chess-social-row">
                <button
                  type="button"
                  onClick={() => alert("SSO login is available for enterprise domain users.")}
                  className="chess-social-btn"
                >
                  <svg className="social-icon" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert("Microsoft Azure SSO login is enabled.")}
                  className="chess-social-btn"
                >
                  <svg className="social-icon" viewBox="0 0 23 23" width="15" height="15">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  <span>Microsoft</span>
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>

      {/* Background Switcher Dots in Bottom-Left */}
      <div className="chess-bg-switcher">
        {BG_IMAGES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`chess-bg-dot ${activeBgIndex === idx ? 'active' : ''}`}
            onClick={() => setActiveBgIndex(idx)}
            title={`Switch Background Image ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
