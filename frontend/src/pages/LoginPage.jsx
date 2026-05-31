import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const roleParam = new URLSearchParams(location.search).get('role');
  const role = roleParam === 'teacher' ? 'teacher' : 'student';
  const roleLabel = role === 'teacher' ? 'Educator' : 'Student';
  const roleDescription =
    role === 'teacher'
      ? 'Sign in to access your teaching hub, manage assignments, and review submissions.'
      : 'Sign in to enter your learning workspace, track progress, and submit work.';

  useEffect(() => {
    // ensure clean body state on login page
    document.body.classList.remove('r4x-landing-body');
    document.documentElement.classList.remove('r4x-landing-html');
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      alert('Please enter both email and password to continue.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setUser({
        id: role === 'teacher' ? 'teach-1' : 'std-1',
        name: role === 'teacher' ? 'Prof. Kabir' : 'Aarav Sharma',
        role,
        email: email.trim(),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email.trim())}`,
      });
      navigate(role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo" />
          <h1>{roleLabel} Login</h1>
          <p className="subtitle">{roleDescription}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="login-label">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="login-label">
            <Lock size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <div className="login-actions">
            <button type="submit" className="btn-primary" disabled={isLoading}>
              <span>{isLoading ? 'Signing in…' : 'Continue'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
