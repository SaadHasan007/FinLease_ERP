import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { api } from '../services/api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const login = useAppStore((state) => state.login);
  const navigate = useNavigate();
  const visualRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      login(response.data.data.access_token);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVisualPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    visualRef.current?.style.setProperty('--pointer-x', `${x * 12}px`);
    visualRef.current?.style.setProperty('--pointer-y', `${y * 12}px`);
  };

  return (
    <main className="login-shell">
      <div
        ref={visualRef}
        className="login-visual"
        onPointerMove={handleVisualPointerMove}
        aria-hidden="true"
      >
        <div className="login-visual__grid" />
        <div className="login-visual__orb login-visual__orb--one" />
        <div className="login-visual__orb login-visual__orb--two" />
        <div className="login-visual__content">
          <div className="login-brand-mark"><ShieldCheck size={22} strokeWidth={2.5} /></div>
          <p className="login-kicker">FinLease / Capital operations</p>
          <h1>Move capital with a clearer view.</h1>
          <p className="login-visual__copy">One connected workspace for the people, assets, and agreements behind every lease.</p>
          <div className="login-signal">
            <div className="login-signal__icon"><WalletCards size={19} /></div>
            <div><span>Portfolio signal</span><strong>94.8% collection rate</strong></div>
            <ArrowUpRight size={18} className="text-emerald-300" />
          </div>
        </div>
        <div className="login-visual__footer"><span><Sparkles size={14} /> Built for focused decisions</span><span>Secure workspace</span></div>
      </div>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel__inner">
          <div className="login-panel__heading">
            <div className="login-mobile-mark"><ShieldCheck size={19} /></div>
            <p className="login-kicker login-kicker--dark">Welcome back</p>
            <h2 id="login-title">Sign in to FinLease</h2>
            <p>Continue to your capital management workspace.</p>
          </div>
          {error && <div className="login-alert" role="alert"><LockKeyhole size={17} /><span>{error}</span></div>}
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Email or username</label>
            <input
              id="email"
              type="text"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@finlease.com"
              required
            />
            </div>
            <div className="login-field">
              <div className="login-field__label"><label htmlFor="password">Password</label><span>Protected access</span></div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="login-input login-input--action"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
              <button type="button" className="login-input__action" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button type="submit" className="login-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Authenticating...' : 'Enter workspace'}
              {!isSubmitting && <ArrowUpRight size={18} />}
            </button>
          </form>

          <div className="login-demo">
          <div className="login-demo__heading"><span>Demo workspace</span><span>Local environment</span></div>
          <p>Use the seeded super admin profile to explore the product.</p>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@finlease.com');
              setPassword('Admin@123!');
            }}
            className="login-demo__button"
          >
            Load demo credentials <ArrowUpRight size={15} />
          </button>
          </div>
          <div className="login-trust"><LockKeyhole size={15} /> Your session is protected with secure token-based access.</div>
        </div>
      </section>
    </main>
  );
};
