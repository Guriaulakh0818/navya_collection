'use client';

import {
  Building2,
  CheckCircle2,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface UserData {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  status: string;
  shopName?: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    customerCount: 0,
    sellerCount: 0,
    adminCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);
      try {
        const url = new URL('/api/v1/admin/users', window.location.origin);
        if (search) url.searchParams.set('search', search);
        if (roleFilter !== 'ALL') url.searchParams.set('role', roleFilter);

        const res = await fetch(url.toString());
        const json = await res.json();
        if (json.success && json.data) {
          setUsers(json.data.users || []);
          setStats(
            json.data.stats || { totalUsers: 0, customerCount: 0, sellerCount: 0, adminCount: 0 },
          );
        }
      } catch (err) {
        console.error('Failed to load admin users:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUsers();
  }, [search, roleFilter]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-navy text-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block mb-1">
            Platform User Management
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-amber-400" /> Registered Users Directory
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Complete database ledger of all registered buyers, boutique merchants, and system
            administrators.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Total Registered Users
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy font-mono">{stats.totalUsers}</p>
          <span className="text-[11px] text-slate-500 font-medium">
            All accounts across platform
          </span>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Buyers &amp; Customers
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy font-mono">{stats.customerCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Verified shoppers</span>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Boutique Merchants
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy font-mono">{stats.sellerCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Active clothing sellers</span>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Admins &amp; Owners
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy font-mono">{stats.adminCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">System governance team</span>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by name, email, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl text-xs bg-slate-50 border-slate-200 focus:bg-white focus:border-amber-500 font-semibold"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600">Filter Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-navy focus:outline-none"
            >
              <option value="ALL">All Roles ({stats.totalUsers})</option>
              <option value="USER">Customers ({stats.customerCount})</option>
              <option value="SELLER">Sellers ({stats.sellerCount})</option>
              <option value="ADMIN">Admins ({stats.adminCount})</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-navy font-extrabold uppercase border-b-2 border-slate-200 tracking-wider">
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  User Identity
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Role &amp; Status
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Associated Shop
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Mobile Contact
                </th>
                <th className="px-4 py-3.5 whitespace-nowrap">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-medium">
                    Loading users directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-medium">
                    No registered users match your search filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-bold text-navy">
                      {u.name}
                      <span className="block text-[11px] text-slate-500 font-mono font-normal">
                        {u.email}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          u.role === 'SELLER'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : ['ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(u.role)
                              ? 'bg-purple-50 text-purple-900 border-purple-300'
                              : 'bg-blue-50 text-blue-900 border-blue-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-semibold text-slate-700">
                      {u.shopName ? (
                        <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {u.shopName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None (Customer)</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-mono text-slate-700 font-medium">
                      📱 +91 {u.mobile}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
