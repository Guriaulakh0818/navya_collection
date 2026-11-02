'use client';

import {
  AlertCircle,
  Award,
  Bell,
  CheckCircle2,
  ExternalLink,
  Gift,
  Mail,
  Megaphone,
  RefreshCw,
  Send,
  Smartphone,
  Sparkles,
  Store,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AudienceStats {
  approvedSellersCount: number;
  registeredUsersCount: number;
  activeProductsCount: number;
  pushSubscribersCount: number;
  vapidPublicKey?: string;
}

export default function AdminMarketingPage() {
  const [stats, setStats] = useState<AudienceStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'FOUNDING_50' | 'REFERRAL' | 'PRODUCT_SHOWCASE' | 'WEB_PUSH'
  >('FOUNDING_50');

  // Form states
  const [testEmail, setTestEmail] = useState('gurvindersingh0218@gmail.com');
  const [productHeadline, setProductHeadline] = useState(
    'Curated Indian Boutique Styles Starting at ₹499',
  );
  const [pushTitle, setPushTitle] = useState('🔥 Weekend Boutique Fashion Sale!');
  const [pushBody, setPushBody] = useState(
    'Designer Sarees & Kurtis starting ₹499. Check out new arrivals today!',
  );
  const [pushUrl, setPushUrl] = useState('/category/under-499');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch('/api/v1/admin/marketing/stats');
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Failed to load marketing stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleBroadcast = async (campaignType: string, testOnly: boolean) => {
    if (testOnly && !testEmail) {
      setFeedback({ type: 'error', message: 'Please enter a test email address.' });
      return;
    }

    if (!testOnly) {
      const confirmText =
        campaignType === 'FOUNDING_50'
          ? `Are you sure you want to broadcast the Founding 50 Offer email to all ${stats?.approvedSellersCount || 0} approved boutiques?`
          : campaignType === 'REFERRAL'
            ? `Are you sure you want to broadcast the Refer & Earn email to all ${stats?.registeredUsersCount || 0} registered users?`
            : campaignType === 'PRODUCT_SHOWCASE'
              ? `Are you sure you want to broadcast the Product Showcase email to all ${stats?.registeredUsersCount || 0} users?`
              : `Are you sure you want to dispatch this Web Push Notification to all ${stats?.pushSubscribersCount || 0} screens?`;

      if (!window.confirm(confirmText)) return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const payload: any = {
        campaignType,
        testOnly,
        testEmail,
      };

      if (campaignType === 'PRODUCT_SHOWCASE') {
        payload.headline = productHeadline;
      }

      if (campaignType === 'WEB_PUSH') {
        payload.pushData = {
          title: pushTitle,
          body: pushBody,
          url: pushUrl,
        };
      }

      const res = await fetch('/api/v1/admin/marketing/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setFeedback({
          type: 'success',
          message:
            json.data?.message ||
            (testOnly ? `Test email sent to ${testEmail}` : 'Broadcast completed successfully!'),
        });
        fetchStats();
      } else {
        setFeedback({
          type: 'error',
          message: json.message || 'Failed to dispatch broadcast campaign.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error occurred while dispatching campaign.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestBrowserPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setFeedback({ type: 'error', message: 'Notifications are not supported in this browser.' });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(pushTitle, {
          body: pushBody,
          icon: '/icons/icon-192x192.png',
        });
        setFeedback({
          type: 'success',
          message: 'Local browser test push triggered on your screen!',
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Notification permission was denied in your browser settings.',
        });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error triggering browser push.' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange/30 text-orange text-xs font-black uppercase tracking-wider mb-2">
            <Megaphone className="w-3.5 h-3.5 text-orange" />
            Omni-Channel Marketing Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Marketing & Broadcast Hub</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Dispatch official offer emails to approved sellers, launch referral campaigns to
            registered users, send trending product digests, and broadcast real-time web push alerts
            to user screens.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loadingStats}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
            Refresh Audiences
          </button>
        </div>
      </div>

      {/* Audience Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Boutiques */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Approved Boutiques
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              <Store className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {stats?.approvedSellersCount ?? 0}
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Founding 50 Pool
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Targeted for Founding 50 welcome & promotional milestone emails.
          </p>
        </div>

        {/* Registered Customers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Registered Users
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {stats?.registeredUsersCount ?? 0}
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Email Verified
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Receives Refer & Earn invitations and trending product digests.
          </p>
        </div>

        {/* Active Products */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Catalog Styles
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 font-mono">
              {stats?.activeProductsCount ?? 0}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Ready to Showcase
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Products dynamically rendered into product digest emails.
          </p>
        </div>

        {/* Web Push Subscribers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Screen Push Subscribers
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
              <Smartphone className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600 font-mono">
              {stats?.pushSubscribersCount ?? 0}
            </span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              Live Devices
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Receives browser push notifications even when website is closed.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Campaign Management Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('FOUNDING_50')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'FOUNDING_50'
                ? 'bg-white text-navy shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>1. Founding 50 Sellers Mail</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
              {stats?.approvedSellersCount || 0} Sellers
            </span>
          </button>

          <button
            onClick={() => setActiveTab('REFERRAL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'REFERRAL'
                ? 'bg-white text-navy shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Gift className="w-4 h-4 text-emerald-600" />
            <span>2. Refer & Earn Users Mail</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">
              {stats?.registeredUsersCount || 0} Users
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PRODUCT_SHOWCASE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'PRODUCT_SHOWCASE'
                ? 'bg-white text-navy shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-orange" />
            <span>3. Product Deals Showcase</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange text-[10px]">
              Top 4 Styles
            </span>
          </button>

          <button
            onClick={() => setActiveTab('WEB_PUSH')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'WEB_PUSH'
                ? 'bg-white text-navy shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4 text-purple-600" />
            <span>4. Screen & Web Push Alerts</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px]">
              PWA Push
            </span>
          </button>
        </div>

        {/* Tab Content Areas */}
        <div className="p-6 space-y-6">
          {/* Universal Test Recipient Toolbar */}
          {activeTab !== 'WEB_PUSH' && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  Test Email Recipient:
                </span>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email to receive test mail"
                  className="w-full sm:w-72 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-navy"
                />
              </div>

              <button
                onClick={() => handleBroadcast(activeTab, true)}
                disabled={isSubmitting || !testEmail}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Sending Test...' : 'Send Test Mail to Admin'}
              </button>
            </div>
          )}

          {/* TAB 1: FOUNDING 50 */}
          {activeTab === 'FOUNDING_50' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-200">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-amber-950 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    Founding 50 Official Offer Mailer
                  </h3>
                  <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                    Broadcasts official Founding 50 acquisition confirmation to all approved
                    boutiques. Informs them about their allocated slot number, 5% Tier 1 commission
                    rate (orders 1–10), and directs them to upload their catalog in the Seller
                    Dashboard.
                  </p>
                </div>

                <button
                  onClick={() => handleBroadcast('FOUNDING_50', false)}
                  disabled={isSubmitting || (stats?.approvedSellersCount || 0) === 0}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting
                    ? 'Broadcasting...'
                    : `Broadcast to All ${stats?.approvedSellersCount || 0} Approved Sellers`}
                </button>
              </div>

              {/* Template Preview Card */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                  <span className="font-bold text-slate-700">Live Preview: Founding 50 Email</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Subject: 👑 Badhai Ho! &quot;Shop Name&quot; JiivaaKart Founding 50 Member
                    Confirm (Slot #1)
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-xl mx-auto space-y-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto font-black text-lg">
                    👑
                  </div>
                  <h4 className="text-lg font-extrabold text-navy">
                    Welcome to Founding 50, Boutique Partner!
                  </h4>
                  <div className="bg-amber-100/60 border border-amber-300 rounded-xl p-3 text-xs font-bold text-amber-900 font-mono">
                    ALLOCATED PRIVILEGE: SLOT #1 OF 50
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    First 10 delivered orders at flat <strong>5.0% commission</strong> (50% fee
                    discount). Next 10 orders at 7.5% transition tier. Doorstep Shiprocket pickups
                    and permanent Founding Seller badge included!
                  </p>
                  <div className="inline-block bg-navy text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-xs">
                    Login to Seller Dashboard & Upload Catalog →
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REFER & EARN */}
          {activeTab === 'REFERRAL' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/40 border border-emerald-200">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-emerald-600" />
                    Refer & Earn Launch Mailer
                  </h3>
                  <p className="text-xs text-emerald-800 leading-relaxed max-w-2xl">
                    Announce the Refer & Earn program to all registered customers. Every customer
                    receives an email containing their personal invite code, dynamic link, and
                    1-click WhatsApp share button to invite friends.
                  </p>
                </div>

                <button
                  onClick={() => handleBroadcast('REFERRAL', false)}
                  disabled={isSubmitting || (stats?.registeredUsersCount || 0) === 0}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting
                    ? 'Broadcasting...'
                    : `Broadcast to All ${stats?.registeredUsersCount || 0} Registered Users`}
                </button>
              </div>

              {/* Template Preview Card */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                  <span className="font-bold text-slate-700">Live Preview: Refer & Earn Email</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Subject: 🎁 Har Dost Par Kamao ₹50! JiivaaKart Refer & Earn Is Live
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-xl mx-auto space-y-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto font-black text-lg">
                    🎁
                  </div>
                  <h4 className="text-lg font-extrabold text-navy">
                    Dost Ko Bulayein, Dono Kamayein!
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        Friend Gets
                      </span>
                      <span className="text-base font-black text-emerald-600">Flat ₹50 OFF</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        You Get
                      </span>
                      <span className="text-base font-black text-orange">₹50 Cash Coins</span>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-dashed border-navy rounded-xl p-3 text-sm font-black text-navy font-mono tracking-widest">
                    YOUR CODE: GURVI3FA
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="bg-[#25D366] text-white text-xs font-bold px-4 py-2 rounded-full">
                      💬 Share on WhatsApp
                    </span>
                    <span className="bg-navy text-white text-xs font-bold px-4 py-2 rounded-full">
                      View My Wallet
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCT DEALS */}
          {activeTab === 'PRODUCT_SHOWCASE' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50/40 border border-orange/20">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-orange flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange" />
                    Trending Products & Deals Showcase
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                    Bring registered users back to the store by showcasing top 4 active boutique
                    products with real images, prices, and direct Buy Now links.
                  </p>
                </div>

                <button
                  onClick={() => handleBroadcast('PRODUCT_SHOWCASE', false)}
                  disabled={isSubmitting || (stats?.registeredUsersCount || 0) === 0}
                  className="px-6 py-3 bg-orange hover:bg-orange/90 text-white rounded-xl text-xs font-extrabold shadow-md shadow-orange/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting
                    ? 'Broadcasting...'
                    : `Broadcast Products to All ${stats?.registeredUsersCount || 0} Users`}
                </button>
              </div>

              {/* Headline Configuration */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Email Headline Banner
                </label>
                <input
                  type="text"
                  value={productHeadline}
                  onChange={(e) => setProductHeadline(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-navy"
                />
              </div>

              {/* Preview */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                  <span className="font-bold text-slate-700">
                    Live Preview: Product Showcase Email
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Subject: 🔥 Fresh Boutique Picks: Trending Handpicked Styles Just for You!
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-xl mx-auto space-y-4 text-center">
                  <span className="text-xs font-extrabold text-orange uppercase tracking-wider">
                    {productHeadline}
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="h-20 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-bold">
                        Boutique Photo
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 block">
                        Navya Collection
                      </span>
                      <strong className="text-xs text-navy block truncate">Designer Saree</strong>
                      <span className="text-xs font-black text-orange">₹599</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="h-20 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-bold">
                        Boutique Photo
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 block">
                        SK Boutique
                      </span>
                      <strong className="text-xs text-navy block truncate">Party Kurti Set</strong>
                      <span className="text-xs font-black text-orange">₹499</span>
                    </div>
                  </div>
                  <div className="inline-block bg-orange text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-xs">
                    Explore All Boutique Collections →
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WEB PUSH & SCREEN NOTIFICATIONS */}
          {activeTab === 'WEB_PUSH' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50/40 border border-purple-200">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-purple-950 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-purple-600" />
                    Screen & Web Push Notifications Engine
                  </h3>
                  <p className="text-xs text-purple-800 leading-relaxed max-w-2xl">
                    Pushes instant rich alerts straight to customers&apos; phone or PC screens via
                    the W3C Web Push API and Service Worker, even when their browser tab is closed.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestBrowserPush}
                    className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
                  >
                    Test on My Screen
                  </button>

                  <button
                    onClick={() => handleBroadcast('WEB_PUSH', false)}
                    disabled={isSubmitting || (stats?.pushSubscribersCount || 0) === 0}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting
                      ? 'Dispatching...'
                      : `Dispatch Push to All ${stats?.pushSubscribersCount || 0} Screens`}
                  </button>
                </div>
              </div>

              {/* Form Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Notification Title
                    </label>
                    <input
                      type="text"
                      value={pushTitle}
                      onChange={(e) => setPushTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Notification Body Message
                    </label>
                    <textarea
                      rows={3}
                      value={pushBody}
                      onChange={(e) => setPushBody(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Target URL (On Click)
                    </label>
                    <input
                      type="text"
                      value={pushUrl}
                      onChange={(e) => setPushUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-navy"
                    />
                  </div>
                </div>

                {/* Device Screen Mockup */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Screen Notification Mockup (Mobile / Desktop)
                  </span>

                  <div className="w-full max-w-sm bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 shadow-lg flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
                      JK
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-black text-slate-900 truncate">
                          {pushTitle || 'JiivaaKart'}
                        </strong>
                        <span className="text-[9px] text-slate-400">now</span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                        {pushBody || 'New boutique fashion offers live.'}
                      </p>
                      <span className="text-[10px] text-navy font-bold flex items-center gap-1 mt-1">
                        <span>Tap to view offer</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center max-w-xs">
                    Visitors see the prompt on your website and can opt-in with 1-click.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
