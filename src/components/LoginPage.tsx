import React, { useState } from 'react';
import { authenticateUser, getRoleTitle } from '../utils/userStorage';
import type { AuthUser } from '../types';
import { User, Lock, ArrowRight, Eye, EyeOff, Users, BookOpen, Trophy } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      {/* Background Image Container with Gradient Overlays */}
      <div 
        className="chess-login-bg"
        style={{ backgroundImage: `url(/chess_bg.png)` }}
      />
      <div className="chess-login-overlay" />

      {/* Main Container */}
      <div className="chess-login-container">
        
        {/* Left Section: Branding & Highlights */}
        <div className="chess-left-brand">
          {/* Logo */}
          <div className="chess-brand-logo">
            <svg className="chess-knight-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 22H5v-2h14v2zm-2-4H7v-1.5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2V18zm-7.5-5.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm6 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-3-4c-.83 0-1.5-.67-1.5-1.5S11.67 5 12.5 5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            </svg>
            <div className="chess-logo-text-wrap">
              <span className="chess-logo-main">UPSTEP</span>
              <span className="chess-logo-sub">CHESS ACADEMY</span>
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

              {/* Footer */}
              <div className="chess-card-footer">
                <span>New here? </span>
                <a 
                  href="#create" 
                  onClick={(e) => { e.preventDefault(); alert("Admin can create new user credentials inside Admin Portal -> User Management!"); }}
                  className="chess-create-link"
                >
                  Create an account
                </a>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
