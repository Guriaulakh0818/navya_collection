'use client';

import { useSignIn, useSignUp } from '@clerk/nextjs';
import { Lock, Shield } from 'lucide-react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/providers';
import { useAuth } from '@/providers/auth-provider';

export default function AdminLoginPage() {
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const { user, isAuthenticated } = useAuth();

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const redirectUrl = searchParams.get('redirect') || '/admin/dashboard';

  // Format Indian mobile number to E.164 (+91XXXXXXXXXX)
  const formatIndianPhone = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return `+91${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91') && /^[6-9]/.test(cleaned.substring(2))) {
      return `+${cleaned}`;
    }
    return null;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !isSignUpLoaded) return;

    const formattedPhone = formatIndianPhone(mobile);
    if (!formattedPhone) {
      toast('Please enter a valid 10-digit Indian mobile number', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: formattedPhone,
      });

      const phoneFactor = signInAttempt.supportedFirstFactors?.find(
        (factor: any) => factor.strategy === 'phone_code',
      ) as any;

      if (phoneFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'phone_code',
          phoneNumberId: phoneFactor.phoneNumberId,
        });
        setAuthMode('signIn');
        setStep('otp');
        toast(`Admin OTP sent to +91 ${mobile}`, 'success');
      } else {
        throw new Error('Phone OTP factor unavailable');
      }
    } catch (err: any) {
      const isNotFound =
        err.errors?.[0]?.code === 'form_identifier_not_found' ||
        err.status === 404 ||
        err.errors?.[0]?.message?.toLowerCase().includes('not found');

      if (isNotFound) {
        try {
          await signUp.create({
            phoneNumber: formattedPhone,
          });
          await signUp.preparePhoneNumberVerification({
            strategy: 'phone_code',
          });
          setAuthMode('signUp');
          setStep('otp');
          toast(`Admin verification OTP sent to +91 ${mobile}`, 'success');
        } catch (signUpErr: any) {
          toast(signUpErr.errors?.[0]?.message || 'Failed to send Admin OTP via Clerk', 'error');
        }
      } else {
        toast(err.errors?.[0]?.message || 'Failed to send Admin OTP', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !isSignUpLoaded) return;

    if (!otp || otp.trim().length < 4) {
      toast('Please enter a valid OTP code', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let createdSessionId = '';

      if (authMode === 'signIn') {
        const result = await signIn.attemptFirstFactor({
          strategy: 'phone_code',
          code: otp.trim(),
        });
        if (result.status === 'complete' && result.createdSessionId) {
          createdSessionId = result.createdSessionId;
        }
      } else {
        const result = await signUp.attemptPhoneNumberVerification({
          code: otp.trim(),
        });
        if (result.status === 'complete' && result.createdSessionId) {
          createdSessionId = result.createdSessionId;
        }
      }

      if (createdSessionId) {
        if (authMode === 'signIn') {
          await setSignInActive({ session: createdSessionId });
        } else {
          await setSignUpActive({ session: createdSessionId });
        }
        toast('Admin authentication successful! Redirecting...', 'success');
        router.push(redirectUrl);
        router.refresh();
      } else {
        toast('Verification incomplete. Please check your OTP code.', 'error');
      }
    } catch (err: any) {
      toast(err.errors?.[0]?.message || 'Invalid or expired OTP code', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-gold mb-4 border border-gold/20 shadow-glow">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
            Admin Portal
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">Navya Collection Management Console</p>
        </div>

        <div className="mt-8">
          {step === 'mobile' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Admin Mobile Number
                </label>
                <div className="relative mt-2 flex rounded-xl border border-slate-800 bg-slate-900/80 focus-within:ring-2 focus-within:ring-gold">
                  <span className="inline-flex items-center rounded-l-xl border-r border-slate-800 bg-slate-800 px-3.5 text-sm font-bold text-gold">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    required
                    maxLength={10}
                    className="w-full rounded-r-xl bg-transparent px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl bg-gold text-slate-950 hover:bg-gold/90 font-bold shadow-md"
                disabled={isSubmitting || mobile.length < 10}
              >
                {isSubmitting ? <Loader size="sm" text="Authenticating..." /> : 'Send Admin OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Enter Admin Security Code
                  </label>
                  <span className="text-xs font-semibold text-gold">+91 {mobile}</span>
                </div>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim().slice(0, 6))}
                  placeholder="123456"
                  required
                  maxLength={6}
                  className="mt-2 text-center text-xl tracking-widest bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl bg-gold text-slate-950 hover:bg-gold/90 font-bold shadow-md"
                disabled={isSubmitting || otp.length < 4}
              >
                {isSubmitting ? (
                  <Loader size="sm" text="Verifying Admin..." />
                ) : (
                  'Verify & Access Console'
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep('mobile')}
                className="w-full text-center text-xs font-medium text-slate-400 hover:text-white hover:underline"
              >
                Change mobile number
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 border-t border-slate-800/80 pt-6 text-center text-xs text-slate-500">
          <p className="flex items-center justify-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-slate-400" /> Protected by Clerk Auth & Role
            Governance
          </p>
        </div>
      </div>
    </div>
  );
}
