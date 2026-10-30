'use client';

import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Gift,
  Heart,
  HelpCircle,
  MessageCircle,
  QrCode,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { generateUniqueReferralCode, REWARDS_CONFIG } from '@/shared/config/rewards.config';
import { useAuthStore, useRewardsStore } from '@/stores';

export default function ReferralPage() {
  const user = useAuthStore((s) => s.user);
  const referralCode = useRewardsStore((s) => s.referralCode);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [originUrl, setOriginUrl] = useState('http://localhost:3000');
  const [mounted, setMounted] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileData, setProfileData] = useState<{
    stats: {
      totalClicks: number;
      friendsJoined: number;
      successfulOrders: number;
      totalCoinsEarned: number;
      totalEarnedInr: number;
    };
    friends: Array<{
      id: string;
      friendName: string;
      status: 'PENDING' | 'ORDER_PLACED' | 'DELIVERED_REWARDED';
      coinsAwarded: number;
      date: string;
    }>;
  }>({
    stats: {
      totalClicks: 0,
      friendsJoined: 0,
      successfulOrders: 0,
      totalCoinsEarned: 0,
      totalEarnedInr: 0,
    },
    friends: [],
  });

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const shareCode = user
    ? generateUniqueReferralCode(user.id, user.name || user.mobile)
    : referralCode;
  const shareUrl = `${originUrl}/r/${shareCode}`;
  const whatsAppText = REWARDS_CONFIG.getWhatsAppShareText(shareCode, shareUrl);
  const whatsAppLink = `https://api.whatsapp.com/send?text=${whatsAppText}`;

  useEffect(() => {
    async function loadLiveReferralProfile() {
      setIsLoadingProfile(true);
      try {
        const uId = user?.id || 'guest';
        const uName = encodeURIComponent(user?.name || '');
        const res = await fetch(
          `/api/v1/referral?userId=${uId}&name=${uName}&code=${encodeURIComponent(shareCode)}`,
          {
            cache: 'no-store',
          },
        );
        const json = await res.json();
        if (json?.success && json?.data) {
          setProfileData(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch live referral profile:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    loadLiveReferralProfile();
  }, [user, shareCode]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(shareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Refer & Earn' }]}
        className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3.5"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-orange/5 to-white border border-slate-200/90 p-6 sm:p-10 shadow-xs">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left Content */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange/10 border border-orange/20 text-orange text-[11px] font-extrabold uppercase tracking-wider">
                <Gift className="w-3.5 h-3.5 text-orange animate-pulse" />
                <span>Jiivaa Viral Style Circle</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-tight">
                Jiivaa Ke Saath Style Share Karein, <br className="hidden sm:inline" />
                <span className="text-orange">Dono ₹150 Kamayein!</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-medium leading-relaxed">
                Apne dosto ko India ke verified local boutiques ka authentic fashion gift karein.
                Unhe pehle order par <strong>Flat ₹150 OFF</strong> milega, aur aapko milenge{' '}
                <strong>150 Jiivaa Coins (₹150 Shopping Credit)</strong>!
              </p>

              {/* Dual Value Prop Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-orange-200/80 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center font-bold text-lg">
                    🎁
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-navy">Friend Gets: ₹150 OFF</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      On first boutique order &ge; ₹999
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                    🪙
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-navy">You Get: 150 Coins</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      ₹150 shopping credit per friend
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Buttons Bar */}
              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* 1-Click WhatsApp Button */}
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Share via WhatsApp &rarr;</span>
                </a>

                {/* 1-Click Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white hover:bg-slate-100 text-navy font-bold text-xs sm:text-sm border border-slate-300 shadow-2xs transition-all cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copy Invite Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Referral Code Box */}
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                <span>Or share referral code:</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 font-mono font-black text-navy bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300 hover:bg-slate-200 cursor-pointer"
                  title="Click to copy code"
                >
                  <span>{shareCode}</span>
                  {copiedCode ? (
                    <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Right Mascot Column */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center">
                {/* Subtle Backlight Ambient Glow */}
                <div className="absolute inset-0 bg-radial from-orange/20 via-orange/5 to-transparent rounded-full blur-2xl pointer-events-none scale-90" />
                <Image
                  src={REWARDS_CONFIG.assets.referralShareMascot}
                  alt="Jiivaa Style Share"
                  width={240}
                  height={250}
                  priority
                  className="relative z-10 w-auto h-full max-h-[175px] sm:max-h-[220px] md:max-h-[240px] object-contain drop-shadow-md select-none transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3-Step How It Works Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
              Kaise Kaam Karta Hai? (3 Easy Steps)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Simple 3 steps me apne boutique fashion circle ko invite karein aur har friend par
              ₹150 paayein.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="relative p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-orange/10 text-orange flex items-center justify-center font-extrabold text-lg">
                1
              </div>
              <h3 className="font-extrabold text-base text-navy">Invite on WhatsApp</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Apna exclusive link ya code WhatsApp, Instagram ya SMS par dosto ke sath share
                karein.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-orange/10 text-orange flex items-center justify-center font-extrabold text-lg">
                2
              </div>
              <h3 className="font-extrabold text-base text-navy">Friend Places First Order</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Aapka friend sign up karke verified local boutiques se pehla order karega aur
                paayega <strong>Flat ₹150 Instant Discount</strong>.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-lg">
                3
              </div>
              <h3 className="font-extrabold text-base text-navy">You Get 150 Coins</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Order deliver hote hi aapke wallet me 150 Jiivaa Coins (₹150 shopping credit)
                automatically add ho jayenge!
              </p>
            </div>
          </div>
        </div>

        {/* Live Referral Stats & Friends Activity */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Stats Bar */}
          <div className="md:col-span-5 bg-gradient-to-br from-navy to-[#133963] text-white p-6 sm:p-8 rounded-3xl shadow-md space-y-6 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-orange text-[10px] font-black uppercase">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Your Referral Dashboard</span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight">Your Rewards Summary</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                <div className="text-xs text-slate-300 font-semibold">Total Clicks</div>
                <div className="text-2xl font-black text-white mt-1">
                  {mounted ? profileData.stats.totalClicks : 0}
                </div>
              </div>

              <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                <div className="text-xs text-slate-300 font-semibold">Successful Orders</div>
                <div className="text-2xl font-black text-amber-300 mt-1">
                  {mounted ? profileData.stats.successfulOrders : 0}
                </div>
              </div>

              <div className="col-span-2 p-4 bg-white/10 rounded-2xl border border-white/10">
                <div className="text-xs text-slate-300 font-semibold">
                  Total Earned Shopping Credit
                </div>
                <div className="text-3xl font-black text-orange mt-1">
                  ₹{mounted ? profileData.stats.totalEarnedInr : 0}{' '}
                  <span className="text-xs text-white/80 font-normal">
                    ({mounted ? profileData.stats.totalCoinsEarned : 0} Coins)
                  </span>
                </div>
              </div>
            </div>

            <Button
              asChild
              className="w-full rounded-full bg-orange hover:bg-orange-600 text-white font-extrabold text-xs py-3"
            >
              <Link href="/account/rewards">View Coins Passbook &rarr;</Link>
            </Button>
          </div>

          {/* Friends List Card */}
          <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-navy tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-orange" />
                <span>Invited Friends Status</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track your friends&apos; orders and coin release timeline.
              </p>
            </div>

            {isLoadingProfile ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2 font-medium">
                <div className="w-5 h-5 border-2 border-orange border-t-transparent rounded-full animate-spin" />
                <span>Loading your referral activity...</span>
              </div>
            ) : profileData.friends.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange/10 text-orange flex items-center justify-center mx-auto text-xl font-bold">
                  🎁
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-navy">
                    Abhi tak koi dost invite nahi hua
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
                    Apna exclusive style link dosto ke sath WhatsApp par share karein. Jaise hi unka
                    pehla order deliver hoga, unka status aur ₹150 rewards yahan live update honge!
                  </p>
                </div>
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Invite on WhatsApp &rarr;</span>
                </a>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {profileData.friends.map((friend) => (
                  <div key={friend.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold text-navy">
                        {friend.friendName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">{friend.date}</div>
                    </div>
                    <div className="text-right">
                      {friend.status === 'DELIVERED_REWARDED' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                          +{friend.coinsAwarded} Coins Rewarded
                        </span>
                      ) : friend.status === 'ORDER_PLACED' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase">
                          Order In Transit
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          Joined via Link • Order Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 rounded-xl bg-orange/10 text-orange text-[11px] font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                Coins are automatically credited once the friend&apos;s parcel is successfully
                delivered!
              </span>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-navy tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange" />
            <span>Frequently Asked Questions</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 font-medium leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
              <div className="font-extrabold text-navy text-xs sm:text-sm">
                Kya friend ka ₹150 discount sabhi products par valid hai?
              </div>
              <p>
                Ji haan! JiivaaKart ke kisi bhi verified local boutique ke order par minimum ₹999
                cart value hone par flat ₹150 OFF automatic apply ho jata hai.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
              <div className="font-extrabold text-navy text-xs sm:text-sm">
                Mujhe 150 Coins kab milenge?
              </div>
              <p>
                Jaise hi aapke friend ka courier order successfully deliver ho jayega, 150 Jiivaa
                Coins aapke account passbook me instantly credit ho jayenge.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
              <div className="font-extrabold text-navy text-xs sm:text-sm">
                Kya coins ki koi expiry date hai?
              </div>
              <p>
                Aapke Jiivaa Coins earn hone ke 12 months tak completely safe aur active rehte hain.
                Aap kabhi bhi kisi bhi order par unhe redeem kar sakte hain.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
              <div className="font-extrabold text-navy text-xs sm:text-sm">
                Main kitne friends ko refer kar sakta hoon?
              </div>
              <p>
                Koi limit nahi hai! Aap unlimited dosto aur family members ko WhatsApp par link
                share karke har successful friend par ₹150 earn kar sakte hain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
