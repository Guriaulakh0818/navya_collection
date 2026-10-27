'use client';

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useToast } from '@/providers';
import { maskEmail } from '@/shared/utils/validators';
import { useAuthStore } from '@/stores';

interface SellerLoginCardProps {
  onSwitchToRegister?: () => void;
}

export function SellerLoginCard({ onSwitchToRegister }: SellerLoginCardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');

  // Password Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // OTP Login State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(60);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Cooldown countdown for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpStep === 'code' && otpCooldown > 0) {
      timer = setInterval(() => {
        setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpStep, otpCooldown]);

  // Handle Password Login Submit
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setPasswordError('Please enter your registered email address or mobile number.');
      return;
    }
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await fetch('/api/v1/seller/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        toast('Merchant login successful! Redirecting...', 'success');
        if (data.user) {
          useAuthStore.getState().setUser(data.user);
        }
        const target = data.redirectUrl || '/seller/dashboard';
        window.location.href = target;
      } else {
        setPasswordError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('[SELLER_PASSWORD_LOGIN_CLIENT_ERR]', err);
      setPasswordError('Network error. Please check your internet connection and try again.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Handle OTP Send Code
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOtpError(null);

    const cleanEmail = otpEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setOtpError('Please enter a valid registered merchant email address.');
      return;
    }

    setIsSubmittingOtp(true);
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setOtpStep('code');
        setOtpCooldown(60);
        toast(`Verification code sent to ${maskEmail(cleanEmail)}`, 'success');
      } else if (res.status === 429 || data.status === 'COOLDOWN') {
        setOtpStep('code');
        toast(data.message || 'Code already sent. Please check your inbox.', 'info');
      } else {
        setOtpError(data.message || 'Failed to send verification code. Please try again.');
      }
    } catch {
      setOtpError('Network error while requesting verification code.');
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  // Handle OTP Verify Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    const cleanOtp = otpCode.replace(/\D/g, '').slice(0, 6);
    if (!cleanOtp || cleanOtp.length !== 6) {
      setOtpError('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsSubmittingOtp(true);
    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim().toLowerCase(), otp: cleanOtp }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast('Verification successful! Opening Seller Dashboard...', 'success');
        if (data.user) {
          useAuthStore.getState().setUser(data.user);
        }
        window.location.href = '/seller/dashboard';
      } else {
        setOtpError(data.message || 'Invalid or expired verification code.');
      }
    } catch {
      setOtpError('Network error while verifying code. Please try again.');
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-slate-200/90 rounded-3xl shadow-xl p-6 sm:p-10 font-sans transition-all">
      {/* Header Banner */}
      <div className="text-center space-y-2 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-orange/10 border border-orange/20 flex items-center justify-center text-orange mx-auto shadow-xs">
          <Store className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
          Merchant Portal Login
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
          Sign in to manage your inventory, orders, customer shipments &amp; bank payouts.
        </p>
      </div>

      {/* Dual Auth Switcher Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => {
            setAuthMethod('password');
            setPasswordError(null);
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            authMethod === 'password'
              ? 'bg-white text-navy shadow-xs'
              : 'text-slate-500 hover:text-navy hover:bg-white/50'
          }`}
        >
          <KeyRound className="w-4 h-4 text-orange" />
          <span>Password Login</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMethod('otp');
            setOtpError(null);
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            authMethod === 'otp'
              ? 'bg-white text-navy shadow-xs'
              : 'text-slate-500 hover:text-navy hover:bg-white/50'
          }`}
        >
          <Mail className="w-4 h-4 text-orange" />
          <span>OTP / Google</span>
        </button>
      </div>

      {/* METHOD 1: PASSWORD LOGIN FORM */}
      {authMethod === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-5" autoComplete="on">
          {passwordError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Registered Email or Mobile Number *
            </label>
            <div className="relative">
              <input
                type="text"
                name="identifier"
                placeholder="seller@example.com or 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3.5 text-navy font-semibold text-sm focus:border-orange focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Account Password *
              </label>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('otp');
                  if (identifier.includes('@')) {
                    setOtpEmail(identifier);
                  }
                  toast(
                    'Switched to OTP Login. You can sign in using an email verification code.',
                    'info',
                  );
                }}
                className="text-xs text-orange font-bold hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3.5 pr-11 text-navy font-semibold text-sm focus:border-orange focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmittingPassword}
            className="w-full py-3.5 bg-navy hover:bg-navy/90 text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmittingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-orange" />
                <span>Authenticating Store...</span>
              </>
            ) : (
              <>
                <span>Sign In to Merchant Portal</span>
                <ArrowRight className="w-4 h-4 text-orange" />
              </>
            )}
          </button>
        </form>
      )}

      {/* METHOD 2: OTP / GOOGLE LOGIN FORM */}
      {authMethod === 'otp' && (
        <div className="space-y-5">
          {otpError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{otpError}</span>
            </div>
          )}

          {otpStep === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Registered Merchant Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    placeholder="seller@example.com"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3.5 text-navy font-semibold text-sm focus:border-orange focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOtp}
                className="w-full py-3.5 bg-navy hover:bg-navy/90 text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4 text-orange" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Enter 6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtpStep('email')}
                    className="text-xs text-orange font-bold hover:underline cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="w-full text-center tracking-[0.5em] font-mono text-xl font-extrabold bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-navy focus:border-orange focus:bg-white focus:outline-none transition-all"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                  Verification code sent to{' '}
                  <strong className="text-slate-700">{maskEmail(otpEmail)}</strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOtp || otpCode.length !== 6}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code &amp; Access Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                {otpCooldown > 0 ? (
                  <span className="text-xs text-slate-400 font-medium">
                    Resend code in <strong className="text-slate-600">{otpCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-xs text-orange font-extrabold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" /> Resend Verification Code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Social Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-extrabold tracking-wider">
                Or Continue With
              </span>
            </div>
          </div>

          {/* One-Click Google Merchant Sign-In */}
          <Link
            href="/api/v1/auth/google?redirect=/seller/dashboard"
            className="w-full py-3 px-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google (Merchant Account)</span>
          </Link>
        </div>
      )}

      {/* Footer Switcher to Registration */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500 font-medium">
          New to JiivaaKart Marketplace?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-orange font-extrabold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Register Your Boutique Store</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </p>
      </div>
    </div>
  );
}
