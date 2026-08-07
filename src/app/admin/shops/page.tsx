'use client';

import {
  Building2,
  CheckCircle2,
  Clock,
  Package,
  Search,
  ShieldCheck,
  Store,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ShopData {
  id: string;
  name: string;
  slug: string;
  status: string;
  commissionRate: number;
  verificationBadge?: string;
  productCount: number;
  ordersCount: number;
  ownerName: string;
  ownerEmail: string;
  ownerMobile: string;
  createdAt: string;
}

export default function AdminShopsPage() {
  const [shops, setShops] = useState<ShopData[]>([]);
  const [stats, setStats] = useState({
    totalShops: 0,
    approvedShops: 0,
    pendingShops: 0,
    suspendedShops: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function loadShops() {
      setIsLoading(true);
      try {
        const url = new URL('/api/v1/admin/shops', window.location.origin);
        if (search) url.searchParams.set('search', search);
        if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);

        const res = await fetch(url.toString());
        const json = await res.json();
        if (json.success && json.data) {
          setShops(json.data.shops || []);
          setStats(
            json.data.stats || {
              totalShops: 0,
              approvedShops: 0,
              pendingShops: 0,
              suspendedShops: 0,
            },
          );
        }
      } catch (err) {
        console.error('Failed to load admin shops:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadShops();
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-navy text-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block mb-1">
            Boutique Marketplace Management
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-amber-400" /> Registered Shops Directory
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Manage all verified boutique stores, review seller statuses, inventory counts, and
            commission payouts.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Total Registered Shops
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy font-mono">{stats.totalShops}</p>
          <span className="text-[11px] text-slate-500 font-medium">All onboarded stores</span>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Approved &amp; Active
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy font-mono">{stats.approvedShops}</p>
          <span className="text-[11px] text-slate-500 font-medium">Live selling storefronts</span>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Pending Verification
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy font-mono">{stats.pendingShops}</p>
          <span className="text-[11px] text-slate-500 font-medium">Applications under review</span>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Suspended Stores
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy font-mono">{stats.suspendedShops}</p>
          <span className="text-[11px] text-slate-500 font-medium">Paused or compliance hold</span>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by shop name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl text-xs bg-slate-50 border-slate-200 focus:bg-white focus:border-amber-500 font-semibold"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-navy focus:outline-none"
            >
              <option value="ALL">All Statuses ({stats.totalShops})</option>
              <option value="APPROVED">Approved ({stats.approvedShops})</option>
              <option value="PENDING_VERIFICATION">Pending ({stats.pendingShops})</option>
              <option value="SUSPENDED">Suspended ({stats.suspendedShops})</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-navy font-extrabold uppercase border-b-2 border-slate-200 tracking-wider">
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Shop / Dukan
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Owner Identity
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Catalog Products
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Commission
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-medium">
                    Loading registered shops...
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-medium">
                    No registered shops match your search filters.
                  </td>
                </tr>
              ) : (
                shops.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-bold text-navy">
                      <Link
                        href={`/shop/${s.slug}`}
                        target="_blank"
                        className="hover:text-amber-700 transition-colors flex items-center gap-1"
                      >
                        {s.name} <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                      </Link>
                      <span className="block text-[11px] text-slate-500 font-mono font-normal">
                        /shop/{s.slug}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-bold text-slate-900">
                      {s.ownerName}
                      <span className="block text-[11px] text-slate-500 font-mono font-normal">
                        {s.ownerEmail} | 📱 {s.ownerMobile}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-bold text-slate-700">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-mono text-navy">
                        📦 {s.productCount} Products
                      </span>
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-mono font-extrabold text-amber-700">
                      {s.commissionRate}% Commission
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          s.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : s.status === 'SUSPENDED'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <Link
                        href={`/shop/${s.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs"
                      >
                        Visit Storefront ↗
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
