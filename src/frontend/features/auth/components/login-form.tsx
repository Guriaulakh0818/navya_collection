'use client';

import { AlertCircle, ArrowLeft, CheckCircle2, Mail, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { useAuth, useToast } from '@/providers';
import { maskEmail } from '@/shared/utils/validators';
import { useAuthStore } from '@/stores';

type LoginFormProps = {
  initialUser?: { name?: string; email?: string } | null;
};

function parseOtpError(msg: string): { title: string; detail?: string } {
  if (msg.includes('.')) {
    const parts = msg
      .split('.')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return {
        title: parts[0],
        detail: parts.slice(1).join('. ') + '.',
      };
    }
  }
  return {
    title: 'Invalid verification code',
    detail: msg.endsWith('.') ? msg : `${msg}.`,
  };
}

export function LoginForm({ initialUser }: LoginFormProps) {
  const { user: authUser, logout } = useAuth();
  const storeUser = useAuthStore((s) => s.user);

  const userRole = (
    authUser?.role ||
    storeUser?.role ||
    (initialUser as any)?.role ||
    ''
  ).toUpperCase();
  const isAdminRole = ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(userRole);
  const activeUser = isAdminRole ? null : authUser || storeUser || initialUser;

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('/');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [otpError, setOtpError] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  // Handle 60-second resend countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendCooldown]);

  // Restore step and email from sessionStorage to handle mobile page refreshes smoothly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const target = params.get('redirect') || params.get('from') || '/';
      setRedirectUrl(target);

      if (activeUser) {
        sessionStorage.removeItem('navya_login_step');
        sessionStorage.removeItem('navya_login_email');
        setStep('email');
        return;
      }

      const savedStep = sessionStorage.getItem('navya_login_step') as 'email' | 'otp';
      const savedEmail = sessionStorage.getItem('navya_login_email');

      if (savedStep === 'otp' && savedEmail) {
        setStep('otp');
        setEmail(savedEmail);
      }
    }
  }, [activeUser]);

  const handleSendOtp = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedEmail) {
      try {
        toast('Please enter your email address.', 'error');
      } catch {}
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanedEmail)) {
      try {
        toast('Please enter a valid email address.', 'error');
      } catch {}
      return;
    }

    setIsSubmitting(true);
    setOtpError(false);
    setOtpErrorMessage(null);

    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanedEmail }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        setStep('otp');
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('navya_login_step', 'otp');
          sessionStorage.setItem('navya_login_email', cleanedEmail);
        }

        if (cleanedEmail === 'test@navyacollection.store' || cleanedEmail === 'test@example.com') {
          try {
            toast('Development Test Mode: Use OTP 123456', 'success');
          } catch {}
        } else {
          try {
            toast(
              json.message || `Verification code sent to ${maskEmail(cleanedEmail)}`,
              'success',
            );
          } catch {}
        }
      } else if (res.status === 429 || json.status === 'COOLDOWN' || json.statusCode === 429) {
        setStep('otp');
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('navya_login_step', 'otp');
          sessionStorage.setItem('navya_login_email', cleanedEmail);
        }
        try {
          toast(
            json.message || 'Verification code already requested. Please enter your code.',
            'info',
          );
        } catch {}
      } else {
        try {
          toast(
            json.message || 'Failed to send verification code. Please check your email.',
            'error',
          );
        } catch {}
      }
    } catch (err: any) {
      console.error('[SEND_OTP_CLIENT_ERROR]', err);
      try {
        toast(
          err?.message || 'Network error sending verification code. Please try again.',
          'error',
        );
      } catch {}
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e?: React.SyntheticEvent, overrideOtp?: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const cleanedOtp = (overrideOtp || otp).trim();

    if (!cleanedOtp || cleanedOtp.length !== 6) {
      setOtpError(true);
      setOtpErrorMessage('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    setOtpError(false);
    setOtpErrorMessage(null);

    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: cleanedOtp }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('navya_login_step');
          sessionStorage.removeItem('navya_login_email');
        }
        try {
          toast('Verification successful! Welcome to Navya Collection.', 'success');
        } catch {}
        if (json.user) {
          useAuthStore.getState().setUser(json.user);
        }

        const destination = redirectUrl && redirectUrl !== '/login' ? redirectUrl : '/';
        if (typeof window !== 'undefined') {
          window.location.href = destination;
        } else {
          router.push(destination);
        }
      } else {
        setOtpError(true);
        const errMsg =
          json.message ||
          'Invalid or expired verification code. Please check your code and try again.';
        setOtpErrorMessage(errMsg);
      }
    } catch (err: any) {
      console.error('[VERIFY_OTP_CLIENT_ERROR]', err);
      setOtpError(true);
      const errMsg = err?.message || 'Verification error. Please try again.';
      setOtpErrorMessage(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpInputChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setOtp(cleaned);
    setOtpError(false);
    setOtpErrorMessage(null);

    // Auto-verify as soon as user types/pastes 6 digits
    if (cleaned.length === 6 && !isSubmitting) {
      handleVerifyOtp(undefined, cleaned);
    }
  };

  const handleResetStep = () => {
    setStep('email');
    setOtp('');
    setOtpError(false);
    setOtpErrorMessage(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('navya_login_step');
      sessionStorage.removeItem('navya_login_email');
    }
  };

  return (
    <div>
      {activeUser && step === 'email' && (
        <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-center">
          <p className="text-xs font-medium text-amber-900">
            You are currently signed in as{' '}
            <strong className="font-extrabold text-[#183A73]">
              {activeUser.name || activeUser.email || 'User'}
            </strong>
            {activeUser.email && (
              <span className="block text-[11px] font-mono text-amber-700 font-normal mt-0.5">
                {maskEmail(activeUser.email)}
              </span>
            )}
          </p>
          <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button
              type="button"
              onClick={() => router.push('/account')}
              className="w-full sm:w-auto rounded-full bg-[#183A73] text-white font-bold text-xs px-4 py-2"
            >
              Go to My Account
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await logout();
              }}
              className="w-full sm:w-auto rounded-full border-rose-300 text-rose-700 hover:bg-rose-100 font-bold text-xs px-4 py-2"
            >
              Sign in as another user (Logout)
            </Button>
          </div>
        </div>
      )}

      {/* Dynamic Header based on Step */}
      <div className="text-center mb-6">
        <span className="inline-block bg-[#183A73]/10 text-[#183A73] px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2">
          {step === 'email' ? 'Step 1 of 2' : 'Step 2 of 2'}
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#183A73]">
          {step === 'email' ? 'Welcome Back' : 'Enter Verification Code'}
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-600">
          {step === 'email'
            ? 'Sign in to your Navya Collection account'
            : 'We sent a 6-digit code to your email'}
        </p>

        {step === 'otp' && (
          <div className="mt-3 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-1.5 text-xs font-semibold text-[#183A73] max-w-full overflow-hidden shadow-xs">
              <Mail className="h-4 w-4 text-[#183A73] shrink-0" />
              <span className="truncate max-w-full font-semibold">{maskEmail(email)}</span>
            </div>
          </div>
        )}
      </div>

      {step === 'email' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSendOtp(e);
          }}
          className="space-y-5"
        >
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#183A73] mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white shadow-xs focus-within:ring-2 focus-within:ring-[#183A73] focus-within:border-[#183A73] transition-all">
              <span className="inline-flex items-center pl-4 text-slate-400">
                <Mail className="h-5 w-5 text-slate-400" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                autoFocus
                required
                className="w-full rounded-r-2xl bg-transparent px-3.5 py-3.5 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
            <p className="mt-2 text-[11px] font-medium text-slate-500">
              Enter your registered email to receive a 6-digit verification code.
            </p>
          </div>

          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSendOtp(e);
            }}
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[#183A73] hover:bg-[#183A73]/90 text-white font-extrabold text-xs tracking-wider uppercase py-3.5 h-12 shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            {isSubmitting ? (
              <Loader size="sm" light text="Sending Code..." />
            ) : (
              'Send Verification Code'
            )}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleVerifyOtp(e);
          }}
          className="space-y-5"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#183A73]">
                6-Digit Verification Code
              </label>
            </div>

            <Input
              type="text"
              value={otp}
              onChange={(e) => handleOtpInputChange(e.target.value)}
              placeholder="123456"
              maxLength={6}
              autoFocus
              required
              className={`mt-1.5 text-center text-2xl font-black tracking-[0.4em] h-13 rounded-2xl transition-all text-[#183A73] ${
                otpError
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                  : 'border-slate-200 focus:ring-2 focus:ring-[#183A73]'
              }`}
            />

            {/* Prominent Inline Error Alert directly below the OTP input field */}
            {otpErrorMessage && (
              <div
                role="alert"
                aria-live="polite"
                className="mt-3 rounded-2xl bg-rose-50/90 border border-rose-200/90 p-3.5 text-xs flex items-start gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 transition-all"
              >
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-left">
                  <p className="font-extrabold text-rose-900 leading-snug">
                    {parseOtpError(otpErrorMessage).title}
                  </p>
                  {parseOtpError(otpErrorMessage).detail && (
                    <p className="text-[11.5px] font-medium text-rose-700 leading-snug">
                      {parseOtpError(otpErrorMessage).detail}
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="mt-2.5 text-center text-[11px] font-medium text-slate-500">
              Please check your inbox or spam folder for your code.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[#F15A25] hover:bg-[#F15A25]/90 text-white font-extrabold text-xs tracking-wider uppercase py-3.5 h-12 shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            {isSubmitting ? (
              <Loader size="sm" light text="Verifying Code..." />
            ) : (
              'Verify & Sign In'
            )}
          </Button>

          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={handleResetStep}
              className="inline-flex items-center gap-1.5 font-bold text-slate-600 hover:text-[#183A73] hover:underline cursor-pointer py-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Change email</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || resendCooldown > 0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setResendCooldown(60);
                handleSendOtp(e);
              }}
              className="inline-flex items-center gap-1.5 font-extrabold text-[#F15A25] hover:text-[#F15A25]/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer py-1 transition-colors"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
