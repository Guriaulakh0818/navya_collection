'use client';

import { Building2, Calendar, Clock, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card } from '@/components/ui/card';

interface AnalyticsData {
  period: string;
  totals: {
    totalUsers: number;
    totalShops: number;
    newUsersInPeriod: number;
    newShopsInPeriod: number;
  };
  userAnalytics: {
    chart: { label: string; count: number }[];
    total: number;
  };
  shopAnalytics: {
    chart: { label: string; count: number }[];
    total: number;
  };
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [activeTab, setActiveTab] = useState<'users' | 'shops'>('users');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/admin/analytics?period=${period}`);
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [period]);

  const activeChart =
    activeTab === 'users' ? data?.userAnalytics?.chart || [] : data?.shopAnalytics?.chart || [];
  const maxCount = Math.max(...activeChart.map((c) => c.count), 1);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-navy text-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block mb-1">
            Real-Time Growth Intelligence
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-amber-400" /> User &amp; Shop Growth Analytics
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Track user registrations and boutique merchant onboarding trends across Hourly, Daily,
            and Weekly windows.
          </p>
        </div>

        {/* Period Selector Toggle */}
        <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/20 shrink-0">
          <button
            onClick={() => setPeriod('hourly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'hourly'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 inline mr-1" /> Hourly (24h)
          </button>
          <button
            onClick={() => setPeriod('daily')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'daily'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 inline mr-1" /> Daily (7d)
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'weekly'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 inline mr-1" /> Weekly (8w)
          </button>
        </div>
      </div>

      {/* Metric Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
            Total Platform Users
          </span>
          <p className="text-2xl font-black text-navy font-mono">{data?.totals?.totalUsers || 0}</p>
          <span className="text-[11px] text-emerald-700 font-bold">
            +{data?.totals?.newUsersInPeriod || 0} registered in selected period
          </span>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
            Total Boutique Shops
          </span>
          <p className="text-2xl font-black text-navy font-mono">{data?.totals?.totalShops || 0}</p>
          <span className="text-[11px] text-emerald-700 font-bold">
            +{data?.totals?.newShopsInPeriod || 0} onboarded in selected period
          </span>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
            User Growth Mode
          </span>
          <p className="text-lg font-black text-amber-700 uppercase tracking-wider font-mono">
            {period}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Active timeframe filter</span>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
            Analytics View Mode
          </span>
          <p className="text-lg font-black text-navy uppercase tracking-wider font-mono">
            {activeTab}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            Currently analyzing {activeTab}
          </span>
        </Card>
      </div>

      {/* Main Interactive Chart Section */}
      <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-6">
        {/* Section Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-navy text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" /> Registered Users Growth (
              {data?.userAnalytics?.total || 0})
            </button>
            <button
              onClick={() => setActiveTab('shops')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'shops'
                  ? 'bg-navy text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" /> Registered Shops Growth (
              {data?.shopAnalytics?.total || 0})
            </button>
          </div>

          <span className="text-xs font-bold text-slate-500 hidden sm:inline">
            Window: <strong className="text-amber-700 uppercase">{period}</strong>
          </span>
        </div>

        {/* Visual Bar Chart */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-slate-500 font-medium">
            Computing growth trends data...
          </div>
        ) : activeChart.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500 font-medium">
            No data points recorded for this timeframe window.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-2 px-2 bg-slate-50/70 border border-slate-200 rounded-2xl overflow-x-auto">
              {activeChart.map((c, i) => {
                const heightPercent = Math.max(12, Math.round((c.count / maxCount) * 100));

                return (
                  <div
                    key={i}
                    className="flex-1 min-w-[36px] flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <span className="text-[10px] font-black text-navy font-mono opacity-80 group-hover:opacity-100 transition-opacity">
                      {c.count}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[28px] rounded-t-xl transition-all duration-300 ${
                        activeTab === 'users'
                          ? 'bg-gradient-to-t from-navy to-blue-600 group-hover:from-amber-500 group-hover:to-orange'
                          : 'bg-gradient-to-t from-amber-600 to-amber-400 group-hover:from-emerald-600 group-hover:to-emerald-400'
                      }`}
                    />
                    <span className="text-[9px] sm:text-[10px] text-slate-600 font-bold whitespace-nowrap truncate w-full text-center">
                      {c.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
