'use client';

import {
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Globe,
  Image as ImageIcon,
  Link as LinkIcon,
  MapPin,
  Palmtree,
  Phone,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function ShopManagementForm() {
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get('tab') : null;

  const [activeTab, setActiveTab] = useState<
    'branding' | 'identity' | 'address' | 'policies' | 'seo' | 'vacation'
  >('branding');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    banner: '',
    description: '',
    phone: '',
    email: '',
    fullAddress: '',
    city: '',
    state: '',
    pincode: '',
    shippingPolicy: '',
    returnPolicy: '',
    metaTitle: '',
    metaDescription: '',
    isClosed: false,
    closedReason: 'Vacation',
    closedUntil: '',
    vacationMessage: '',
  });

  const fetchShopData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/seller/dashboard');
      const data = await res.json();
      if (data.success && data.data?.shop) {
        const s = data.data.shop;
        const p = data.data.sellerProfile || {};
        const owner = data.data.owner || {};

        setFormData({
          name: s.name || '',
          slug: s.slug || '',
          logo: s.logo || '',
          banner: s.banner || '',
          description: s.description || '',
          phone: s.phone || owner.mobile || '',
          email: s.email || owner.email || '',
          fullAddress: s.fullAddress || p.businessAddress || '',
          city: s.city || p.city || 'Hisar',
          state: s.state || p.state || 'Haryana',
          pincode: s.pincode || p.pincode || '125001',
          shippingPolicy:
            s.shippingPolicy ||
            'Standard Pan-India delivery within 3-5 business days via Shiprocket Express.',
          returnPolicy:
            s.returnPolicy ||
            '7-day easy return policy for unworn items with original tags intact.',
          metaTitle: s.metaTitle || `${s.name} | Luxury Ethnic Couture on Navya Collection`,
          metaDescription: s.metaDescription || s.description || '',
          isClosed: s.isClosed || false,
          closedReason: s.closedReason || 'Vacation',
          closedUntil: s.closedUntil ? new Date(s.closedUntil).toISOString().split('T')[0] : '',
          vacationMessage:
            s.vacationMessage ||
            'Our boutique is temporarily closed for vacation. Orders will resume shortly!',
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch shop details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  useEffect(() => {
    if (tabParam === 'vacation') {
      setActiveTab('vacation');
    }
  }, [tabParam]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Cloudinary Image Upload Handler
  const handleImageUpload = async (file: File, type: 'logo' | 'banner') => {
    if (type === 'logo') setIsUploadingLogo(true);
    else setIsUploadingBanner(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'seller_shops');

      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await res.json();
      const uploadedItem = Array.isArray(data.data) ? data.data[0] : data.data;
      const imageUrl = uploadedItem?.secureUrl || uploadedItem?.url || data.secureUrl || data.url;

      if (data.success && imageUrl) {
        setFormData((prev) => ({
          ...prev,
          [type]: imageUrl,
        }));
        showToast(
          `${type === 'logo' ? 'Shop Logo' : 'Shop Banner'} uploaded to Cloudinary!`,
          'success',
        );
      } else {
        showToast(data.message || 'Failed to upload image.', 'error');
      }
    } catch (err: any) {
      showToast('Image upload failed. Please try again.', 'error');
    } finally {
      if (type === 'logo') setIsUploadingLogo(false);
      else setIsUploadingBanner(false);
    }
  };

  // Instant Vacation Mode Switcher
  const handleToggleVacationMode = async (newIsClosed: boolean) => {
    const updatedPayload = { ...formData, isClosed: newIsClosed };
    setFormData(updatedPayload);
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/seller/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          newIsClosed
            ? '🌴 Vacation Mode Activated! Public customer orders are now paused.'
            : '🟢 Store Re-opened! Your shop is live and accepting customer orders.',
          'success',
        );
      } else {
        showToast(data.message || 'Failed to update store status.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred while saving status.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/seller/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Shop branding, policies & SEO updated successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to update shop customization.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred while saving.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span>Loading Boutique Customization Studio...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between transition-all ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/30 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="pb-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Store className="w-6 h-6 text-navy" />
            Shop Customization & Store Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customize shop branding, Cloudinary banner cover, unique URL slug (`/shop/$
            {formData.slug}`), shipping policies, and SEO.
          </p>
        </div>

        <a
          href={`/shop/${formData.slug}`}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy font-bold border border-slate-200 rounded-xl text-xs flex items-center gap-1.5 transition-all"
        >
          Preview Live Storefront ↗
        </a>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-100/80 rounded-xl p-1 gap-1">
        {[
          { id: 'branding', label: 'Branding & Images', icon: ImageIcon },
          { id: 'identity', label: 'Identity & Unique URL', icon: LinkIcon },
          { id: 'address', label: 'Address & Contact', icon: MapPin },
          { id: 'policies', label: 'Shop Policies', icon: Truck },
          { id: 'seo', label: 'SEO Metadata', icon: Globe },
          { id: 'vacation', label: 'Vacation Mode 🌴', icon: Palmtree },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Container */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6"
      >
        {/* TAB 1: BRANDING & IMAGES */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-600" /> Shop Logo Avatar
            </h2>

            {/* Permanent Banner Display Badge */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
              <div>
                <p className="text-xs font-extrabold text-navy">
                  ✨ Permanent Luxury Storefront Banner
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Every shop automatically displays the official luxury &quot;STYLE THAT
                  SPEAKS.&quot; brand background banner.
                </p>
              </div>
              <div className="relative w-full h-28 rounded-xl overflow-hidden border border-amber-200/80 shadow-xs">
                <img
                  src="/images/default-shop-banner.png"
                  alt="Official Banner"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Logo Upload & Tagline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Boutique Logo Badge
                </label>
                <div className="w-28 h-28 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden relative group flex items-center justify-center shadow-xs">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-amber-600" />
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                    <Upload className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'logo');
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Boutique Description & Story *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your heritage, bridal lehengas, silk sarees, and handcrafted collection."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:border-navy focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: IDENTITY & UNIQUE URL */}
        {activeTab === 'identity' && (
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-amber-600" /> Boutique Name & Unique Storefront URL
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Boutique Display Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoSlug = val
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    setFormData({ ...formData, name: val, slug: autoSlug });
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none font-bold shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Unique Shop URL Slug *
                </label>
                <div className="flex items-center">
                  <span className="bg-slate-100 border border-r-0 border-slate-200 px-3 py-3 text-slate-500 font-mono text-[11px] rounded-l-xl">
                    navyacollection.store/shop/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-r-xl px-3 py-3 text-amber-700 font-mono font-extrabold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none shadow-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADDRESS & CONTACT */}
        {activeTab === 'address' && (
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" /> Contact Information & Warehouse Address
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Support Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-amber-500 focus:outline-none font-semibold shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Contact Phone *
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-amber-500 focus:outline-none font-semibold shadow-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Full Physical Warehouse Address *
                </label>
                <input
                  type="text"
                  value={formData.fullAddress}
                  onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-amber-500 focus:outline-none font-semibold shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-amber-500 focus:outline-none font-semibold shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  State & Pincode *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-amber-500 focus:outline-none font-semibold shadow-xs"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-28 bg-white border border-slate-200 rounded-xl px-3 py-3 text-amber-700 font-mono text-center font-bold shadow-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BOUTIQUE POLICIES */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600" /> Shipping & Return Policies
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Shipping & Delivery Policy
                </label>
                <textarea
                  rows={3}
                  value={formData.shippingPolicy}
                  onChange={(e) => setFormData({ ...formData, shippingPolicy: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-amber-500 focus:outline-none font-medium shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Return & Exchange Policy
                </label>
                <textarea
                  rows={3}
                  value={formData.returnPolicy}
                  onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-amber-500 focus:outline-none font-medium shadow-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SEO METADATA */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-600" /> SEO Search Engine Optimization
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  SEO Meta Title
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-amber-500 focus:outline-none font-semibold shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  SEO Meta Description
                </label>
                <textarea
                  rows={3}
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-amber-500 focus:outline-none font-medium shadow-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: VACATION & TEMPORARY CLOSURE MODE */}
        {activeTab === 'vacation' && (
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-2">
              <Palmtree className="w-5 h-5 text-amber-600" /> Temporary Store Closure & Vacation
              Mode Settings
            </h2>

            {/* Status Switcher Card */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                formData.isClosed
                  ? 'bg-amber-50/80 border-amber-300'
                  : 'bg-emerald-50/60 border-emerald-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${formData.isClosed ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}
                    />
                    <h3 className="font-black text-navy text-base">
                      {formData.isClosed
                        ? '🔴 STORE IS TEMPORARILY CLOSED (VACATION MODE ACTIVE)'
                        : '🟢 STORE IS ONLINE & ACCEPTING ORDERS'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {formData.isClosed
                      ? 'Public customer checkout is currently paused for your boutique items. Products will display a temporary closure notice until reopening.'
                      : 'Your products are live on the marketplace and customers can place orders.'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleToggleVacationMode(!formData.isClosed)}
                  className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                    formData.isClosed
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  }`}
                >
                  {isSaving
                    ? 'Updating Status...'
                    : formData.isClosed
                      ? '🟢 Re-open Store Now'
                      : '🌴 Turn ON Vacation Mode'}
                </button>
              </div>
            </div>

            {/* Vacation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">
              <div>
                <label className="flex text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" /> Reopening Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.closedUntil}
                  onChange={(e) => setFormData({ ...formData, closedUntil: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold focus:border-amber-500 focus:outline-none shadow-xs"
                />

                {/* Date Quick Presets */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Quick Set:</span>
                  {[3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        const date = new Date();
                        date.setDate(date.getDate() + days);
                        setFormData({
                          ...formData,
                          isClosed: true,
                          closedUntil: date.toISOString().split('T')[0],
                        });
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-navy font-bold text-[10px] rounded-lg border border-slate-200 transition-all cursor-pointer"
                    >
                      +{days} Days
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Closure Reason
                </label>
                <select
                  value={formData.closedReason}
                  onChange={(e) => setFormData({ ...formData, closedReason: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold focus:border-amber-500 focus:outline-none shadow-xs cursor-pointer"
                >
                  <option value="Festival Vacation">Festival Vacation / Holidays</option>
                  <option value="Personal Leave">Personal Leave / Out of Station</option>
                  <option value="Store Renovation">Boutique Renovation & Stock Audit</option>
                  <option value="Inventory Restock">Inventory Restocking</option>
                  <option value="Emergency">Emergency / Illness</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Public Customer Announcement Notice *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Our boutique is closed for festive holidays until 15th Oct. Orders placed will be dispatched immediately upon reopening."
                  value={formData.vacationMessage}
                  onChange={(e) => setFormData({ ...formData, vacationMessage: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-900 font-medium focus:border-amber-500 focus:outline-none shadow-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Footer */}
        <div className="pt-6 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Customizations...' : 'Save Boutique Customization ✓'}
          </button>
        </div>
      </form>
    </div>
  );
}
