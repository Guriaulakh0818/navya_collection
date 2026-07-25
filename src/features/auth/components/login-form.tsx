'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/providers';

import { sendOtpAction, verifyOtpAction } from '../actions/auth.actions';

export function LoginForm() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await sendOtpAction(mobile);
      if (result.success) {
        setStep('otp');
        toast('OTP sent successfully', 'success');
      } else {
        toast(result.message || 'Failed to send OTP', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await verifyOtpAction(mobile, otp);
      if (result.success) {
        toast('Login successful', 'success');
        router.push('/');
        router.refresh();
      } else {
        toast(result.message || 'Invalid OTP', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="rounded-2xl border border-border bg-white p-8 shadow-premium">
        <div className="text-center">
          <h1 className="font-heading text-3xl text-navy">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-600">Login to your Navya Collection account</p>
        </div>

        {step === 'mobile' ? (
          <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy">Mobile Number</label>
              <Input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="9876543210"
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader size="sm" text="Sending..." /> : 'Send OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy">Enter OTP</label>
              <Input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader size="sm" text="Verifying..." /> : 'Verify OTP'}
            </Button>
            <button
              type="button"
              onClick={() => setStep('mobile')}
              className="w-full text-sm text-slate-600 hover:text-navy"
            >
              Change mobile number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
