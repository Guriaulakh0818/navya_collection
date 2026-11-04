'use client';

import {
  Check,
  Copy,
  Gift,
  HelpCircle,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useRewardsSettings } from '@/frontend/features/rewards/hooks/useRewardsSettings';
import { generateUniqueReferralCode, REWARDS_CONFIG } from '@/shared/config/rewards.config';
import { useAuthStore, useRewardsStore } from '@/stores';

export default function ReferralPage() {
  const { settings } = useRewardsSettings();
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
      friendUserId?: string;
      status: 'JOINED' | 'ORDER_PLACED' | 'DELIVERED_REWARDED' | 'ACTIVE';
      ordersCount: number;
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

  // Guarantee deterministic, non-empty referral code even for guests
  const fallbackGuestCode = generateUniqueReferralCode('guest-shopper', 'JIIVAA');
  const shareCode = (
    user
      ? generateUniqueReferralCode(user.id, user.name || user.mobile)
      : referralCode || fallbackGuestCode
  ).replace(/^JIIVAA-/, '');
  const shareUrl = `${originUrl}/r/${shareCode}`;
  const whatsAppText = REWARDS_CONFIG.getWhatsAppShareText(
    shareCode,
    shareUrl,
    settings.referralRefereeDiscountInr,
  );
  const whatsAppLink = `https://api.whatsapp.com/send?text=${whatsAppText}`;

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    async function loadLiveReferralProfile() {
      setIsLoadingProfile(true);
      try {
        const uId = user?.id || 'guest';
        const uName = encodeURIComponent(user?.name || '');
        const uContact = encodeURIComponent(user?.mobile || user?.email || '');
        const res = await fetch(
          `/api/v1/referral?userId=${uId}&name=${uName}&contact=${uContact}&code=${encodeURIComponent(shareCode)}&_t=${Date.now()}`,
          {
            cache: 'no-store',
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store',
            },
            signal: controller.signal,
          },
        );
        const json = await res.json().catch(() => null);
        if (!isCancelled && json?.success && json?.data) {
          setProfileData(json.data);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Failed to fetch live referral profile:', err);
        }
      } finally {
        clearTimeout(timeoutId);
        if (!isCancelled) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadLiveReferralProfile();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [user?.id, user?.mobile, user?.email, shareCode]);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Refer & Earn' }]}
        className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-2"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
        {/* Compact Hero Card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-orange/5 to-white border border-slate-200/90 p-4 sm:p-6 lg:p-7 shadow-xs">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left Content */}
            <div className="flex-1 space-y-3 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange/10 border border-orange/20 text-orange text-[10px] font-black uppercase tracking-wider">
                <Gift className="w-3 h-3 text-orange animate-pulse" />
                <span>Jiivaa Viral Style Circle</span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-navy tracking-tight leading-tight">
                Jiivaa Ke Saath Style Share Karein, <br className="hidden sm:inline" />
                <span className="text-orange">Dono Faayda Paayein!</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 max-w-lg font-medium leading-relaxed">
                Apne dosto ko local boutique fashion gift karein. Friend ko pehle order par{' '}
                <strong>Flat ₹{settings.referralRefereeDiscountInr} OFF</strong> milega, aur aapko
                milenge{' '}
                <strong>
                  {settings.referralReferrerBonusCoins} Coins (₹{settings.referralReferrerBonusInr})
                </strong>
                !
              </p>

              {/* Compact Dual Value Prop Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-orange-200/80 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-bold text-base shrink-0">
                    🎁
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-black text-navy truncate">
                      Friend Gets: ₹{settings.referralRefereeDiscountInr} OFF
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium truncate">
                      On first order &ge; ₹{settings.referralRefereeMinOrderInr}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-emerald-200/80 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base shrink-0">
                    🪙
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-black text-navy truncate">
                      You Get: 500 Coins + 10/Order
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium truncate">
                      ₹50 on 1st order + 100 on signup
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Highlighted VIP Referral Ticket with Jiivaa on one side & Big Code on the other */}
            <div className="w-full lg:w-auto lg:min-w-[420px] xl:min-w-[460px] rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange/10 to-amber-50 border-2 border-dashed border-orange/40 p-4 sm:p-5 shadow-xs overflow-hidden relative">
              {/* Backlight Ambient Glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Code & Actions (Side 1) */}
                <div className="flex-1 space-y-2.5 text-center sm:text-left min-w-0 w-full sm:w-auto">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-orange">
                    <Sparkles className="w-3.5 h-3.5 text-orange animate-pulse" />
                    <span>Your Referral Code</span>
                  </div>

                  {/* Big Highlighted Monospace Code Box */}
                  <div className="flex items-center justify-between gap-2 bg-white/95 backdrop-blur-xs px-3 py-2 sm:py-2.5 rounded-xl border border-orange/30 shadow-xs">
                    <span className="font-mono text-xl sm:text-2xl font-black text-navy tracking-widest select-all truncate">
                      {shareCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 rounded-lg bg-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Share Action Buttons */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <a
                      href={whatsAppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs shadow-xs transition-transform hover:scale-[1.02] cursor-pointer whitespace-nowrap"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      <span>WhatsApp &rarr;</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-navy font-bold text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Jiivaa Mascot (Side 2: pointing directly at the code) */}
                <div className="shrink-0 flex items-center justify-center">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 flex items-center justify-center">
                    <Image
                      src={REWARDS_CONFIG.assets.referralShareMascot}
                      alt="Jiivaa Style Share"
                      width={180}
                      height={180}
                      unoptimized
                      priority
                      loading="eager"
                      className="relative z-10 w-auto h-full max-h-[125px] sm:max-h-[145px] md:max-h-[160px] object-contain drop-shadow-md select-none transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact 3-Step "How It Works" Strip */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-navy tracking-tight">
                Kaise Kaam Karta Hai? (3 Easy Steps)
              </h2>
              <p className="text-[11px] text-slate-500">
                Simple 3 steps me dosto ko invite karein aur har friend par rewards paayein.
              </p>
            </div>
            <span className="text-[11px] font-bold text-orange self-start sm:self-auto bg-orange/10 px-2.5 py-0.5 rounded-full">
              Instant Rewards
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-0.5">
            {/* Step 1 */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <h4 className="font-extrabold text-xs sm:text-sm text-navy">Invite Friends</h4>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Code share karein. Friend ko <strong>500 Coins (₹50)</strong> aur aapko{' '}
                  <strong>100 Coins</strong> turant milenge.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange/10 text-orange flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <h4 className="font-extrabold text-xs sm:text-sm text-navy">Friend Shops ₹499+</h4>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Friend kisi bhi verified boutique order par apna <strong>₹50 discount</strong>{' '}
                  apply kar sakta hai (Cart &ge; ₹499).
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <h4 className="font-extrabold text-xs sm:text-sm text-navy">Get ₹50 + 10 Coins</h4>
                <p className="text-[11px] text-slate-500 leading-snug">
                  1st order deliver hote hi aapko <strong>₹50 (500 Coins)</strong>, plus har repeat
                  order par <strong>+10 Coins</strong>!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Referral Stats & Friends Activity (Compact Card) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Stats Bar */}
          <div className="md:col-span-5 bg-gradient-to-br from-navy to-[#133963] text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-orange text-[10px] font-black uppercase">
                <TrendingUp className="w-3 h-3" />
                <span>Referral Dashboard</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Your Rewards Summary
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <div className="text-[11px] text-slate-300 font-medium">Total Clicks</div>
                <div className="text-xl font-black text-white mt-0.5">
                  {mounted ? profileData.stats.totalClicks : 0}
                </div>
              </div>

              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <div className="text-[11px] text-slate-300 font-medium">Orders Delivered</div>
                <div className="text-xl font-black text-amber-300 mt-0.5">
                  {mounted ? profileData.stats.successfulOrders : 0}
                </div>
              </div>

              <div className="col-span-2 p-3 bg-white/10 rounded-xl border border-white/10">
                <div className="text-[11px] text-slate-300 font-medium">
                  Total Earned Shopping Credit
                </div>
                <div className="text-2xl font-black text-orange mt-0.5">
                  ₹{mounted ? profileData.stats.totalEarnedInr : 0}{' '}
                  <span className="text-xs text-white/80 font-normal">
                    ({mounted ? profileData.stats.totalCoinsEarned : 0} Coins)
                  </span>
                </div>
              </div>
            </div>

            <Button
              asChild
              className="w-full rounded-full bg-orange hover:bg-orange-600 text-white font-extrabold text-xs py-2.5"
            >
              <Link href="/account/rewards">View Coins Passbook &rarr;</Link>
            </Button>
          </div>

          {/* Friends List Card */}
          <div className="md:col-span-7 bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-base font-extrabold text-navy tracking-tight flex items-center gap-1.5">
                <Users className="w-4 h-4 text-orange" />
                <span>Invited Friends Status</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Track your friends&apos; orders and coin release timeline.
              </p>
            </div>

            {isLoadingProfile ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2 font-medium">
                <div className="w-4 h-4 border-2 border-orange border-t-transparent rounded-full animate-spin" />
                <span>Loading your referral activity...</span>
              </div>
            ) : profileData.friends.length === 0 ? (
              <div className="py-5 px-3 text-center rounded-xl bg-slate-50/80 border border-dashed border-slate-200 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-orange/10 text-orange flex items-center justify-center mx-auto text-base font-bold">
                  🎁
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-navy">
                    Abhi tak koi dost invite nahi hua
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto font-medium leading-normal">
                    Apna exclusive style link dosto ke sath share karein. Pehla order deliver hote
                    hi rewards live update honge!
                  </p>
                </div>
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>Invite on WhatsApp &rarr;</span>
                </a>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                {profileData.friends.map((friend) => (
                  <div key={friend.id} className="py-2.5 flex items-center justify-between gap-2.5">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-extrabold text-navy truncate">
                          {friend.friendName}
                        </span>
                        {friend.ordersCount > 1 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-bold">
                            Active ({friend.ordersCount} Orders)
                          </span>
                        ) : friend.ordersCount === 1 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                            1st Order Delivered
                          </span>
                        ) : friend.status === 'ORDER_PLACED' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                            In Transit
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold">
                            Joined • Pending
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">{friend.date}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-black">
                        🪙 +{friend.coinsAwarded}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-orange/10 text-orange text-[10px] sm:text-[11px] font-semibold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Order deliver hote hi coins automatically wallet me credit ho jaate hain!</span>
            </div>
          </div>
        </div>

        {/* Compact FAQs */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          <h2 className="text-base font-extrabold text-navy tracking-tight flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-orange" />
            <span>Frequently Asked Questions</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-600 font-medium leading-normal">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-0.5">
              <div className="font-extrabold text-navy text-xs">
                Kya friend ka ₹{settings.referralRefereeDiscountInr} discount sabhi products par
                valid hai?
              </div>
              <p className="text-[11px] text-slate-500">
                Ji haan! Minimum ₹{settings.referralRefereeMinOrderInr} order value hone par flat ₹
                {settings.referralRefereeDiscountInr} OFF auto-apply ho jata hai.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-0.5">
              <div className="font-extrabold text-navy text-xs">
                Mujhe {settings.referralReferrerBonusCoins} Coins kab milenge?
              </div>
              <p className="text-[11px] text-slate-500">
                Jaise hi friend ka 1st parcel successfully deliver hoga, 500 Coins aapke wallet me
                add ho jayenge.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-0.5">
              <div className="font-extrabold text-navy text-xs">
                Kya coins ki koi expiry date hai?
              </div>
              <p className="text-[11px] text-slate-500">
                Jiivaa Coins earn hone ke 12 months tak completely safe aur active rehte hain.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-0.5">
              <div className="font-extrabold text-navy text-xs">
                Main kitne friends ko refer kar sakta hoon?
              </div>
              <p className="text-[11px] text-slate-500">
                Koi limit nahi hai! Aap unlimited dosto ko share karke har dost par ₹
                {settings.referralReferrerBonusInr} earn kar sakte hain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
