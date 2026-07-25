'use client';

import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/providers';

export function LoginForm() {
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const redirectUrl = searchParams.get('redirect') || searchParams.get('from') || '/account';

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
      toast('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Attempt Sign In first for existing user
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
        toast(`OTP sent successfully to +91 ${mobile}`, 'success');
      } else {
        throw new Error('Phone OTP authentication factor unavailable');
      }
    } catch (err: any) {
      const isNotFound =
        err.errors?.[0]?.code === 'form_identifier_not_found' ||
        err.status === 404 ||
        err.errors?.[0]?.message?.toLowerCase().includes('not found');

      if (isNotFound) {
        try {
          // User not found -> fallback to Sign Up flow
          await signUp.create({
            phoneNumber: formattedPhone,
          });
          await signUp.preparePhoneNumberVerification({
            strategy: 'phone_code',
          });
          setAuthMode('signUp');
          setStep('otp');
          toast(`OTP sent successfully to +91 ${mobile}`, 'success');
        } catch (signUpErr: any) {
          toast(signUpErr.errors?.[0]?.message || 'Failed to send OTP via Clerk', 'error');
        }
      } else {
        toast(err.errors?.[0]?.message || 'Failed to send OTP', 'error');
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
      if (authMode === 'signIn') {
        const result = await signIn.attemptFirstFactor({
          strategy: 'phone_code',
          code: otp.trim(),
        });

        if (result.status === 'complete') {
          await setSignInActive({ session: result.createdSessionId });
          toast('Verification successful! Welcome back to Navya Collection.', 'success');
          router.push(redirectUrl);
          router.refresh();
        } else {
          toast('Verification incomplete. Please check your OTP code.', 'error');
        }
      } else {
        const result = await signUp.attemptPhoneNumberVerification({
          code: otp.trim(),
        });

        if (result.status === 'complete') {
          await setSignUpActive({ session: result.createdSessionId });
          toast('Account verified successfully! Welcome to Navya Collection.', 'success');
          router.push(redirectUrl);
          router.refresh();
        } else {
          toast('Verification incomplete. Please try again.', 'error');
        }
      }
    } catch (err: any) {
      toast(err.errors?.[0]?.message || 'Invalid or expired OTP code', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
      {step === 'mobile' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy">Indian Mobile Number</label>
            <div className="relative mt-1.5 flex rounded-xl border border-border bg-white shadow-sm focus-within:ring-2 focus-within:ring-gold">
              <span className="inline-flex items-center rounded-l-xl border-r border-border bg-slate-50 px-3.5 text-sm font-semibold text-slate-700">
                +91
              </span>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                required
                maxLength={10}
                className="w-full rounded-r-xl bg-transparent px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Enter your 10-digit Indian mobile number to receive a verification OTP.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-navy text-white hover:bg-navy/90"
            disabled={isSubmitting || mobile.length < 10}
          >
            {isSubmitting ? <Loader size="sm" text="Sending OTP..." /> : 'Send OTP'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-navy">Enter Verification OTP</label>
              <span className="text-xs font-semibold text-gold">+91 {mobile}</span>
            </div>
            <Input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.trim().slice(0, 6))}
              placeholder="123456"
              required
              maxLength={6}
              className="mt-1.5 text-center text-lg tracking-widest"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-gold text-white hover:bg-gold/90"
            disabled={isSubmitting || otp.length < 4}
          >
            {isSubmitting ? <Loader size="sm" text="Verifying..." /> : 'Verify OTP'}
          </Button>

          <button
            type="button"
            onClick={() => setStep('mobile')}
            className="w-full text-center text-xs font-medium text-slate-600 hover:text-navy hover:underline"
          >
            Change mobile number
          </button>
        </form>
      )}
    </div>
  );
}
