'use client';

import { CheckCircle2, ShieldAlert, Trash2, UserPlus, Users, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/providers';
import { useAuthStore } from '@/stores';

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  role: string;
  approvalStatus: string | null;
  createdAt: string;
}

export default function AdminTeamPage() {
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form to grant direct access
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'SUPERVISOR'>('ADMIN');
  const [isInviting, setIsInviting] = useState(false);

  const fetchTeam = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/team');
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers(data.teamMembers || []);
      } else {
        toast(data.message || 'Only the Owner can access Team Governance.', 'error');
      }
    } catch {
      toast('Failed to load team members.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast('Please enter a valid Gmail address.', 'error');
      return;
    }

    if (!invitePassword || invitePassword.length < 6) {
      toast('Please enter a password of at least 6 characters.', 'error');
      return;
    }

    setIsInviting(true);
    try {
      const res = await fetch('/api/v1/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          password: invitePassword.trim(),
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to grant access');
      }

      toast(data.message || 'Admin access granted & email sent successfully!', 'success');
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
      fetchTeam();
    } catch (err: any) {
      toast(err.message || 'Failed to grant access', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateStatus = async (userId: string, approvalStatus: string, role?: string) => {
    try {
      const res = await fetch('/api/v1/admin/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approvalStatus, role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Update failed');
      }

      toast(data.message || 'User status updated', 'success');
      fetchTeam();
    } catch (err: any) {
      toast(err.message || 'Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to permanently delete admin account "${userEmail}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/team?userId=${userId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete user');
      }

      toast(data.message || 'Admin user deleted successfully.', 'success');
      fetchTeam();
    } catch (err: any) {
      toast(err.message || 'Failed to delete user', 'error');
    }
  };

  const isOwner =
    String(user?.role) === 'OWNER' ||
    String(user?.role) === 'SUPER_ADMIN' ||
    user?.email === 'gurvindersingh0218@gmail.com';

  if (!isOwner) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto mt-12">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-navy">Restricted Owner Access</h2>
        <p className="text-xs text-slate-600 mt-2">
          Only the Owner (<span className="font-bold text-navy">gurvindersingh0218@gmail.com</span>)
          has authority to grant admin access and assign roles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-navy text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-gold text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="h-4 w-4" />
            <span>Owner Role Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Admin Access &amp; Role Management
          </h1>
          <p className="text-xs text-white/80 mt-1">
            Grant direct Gmail + Password access to staff members, auto-send email notifications,
            and manage active accounts.
          </p>
        </div>
      </div>

      {/* Grant Access Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
        <h2 className="text-lg font-bold text-navy flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-orange" />
          <span>Grant Admin Access to Gmail User</span>
        </h2>
        <form
          onSubmit={handleGrantAccess}
          className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Gmail Address</label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="staff@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <Input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Staff Name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-navy outline-none focus:ring-2 focus:ring-navy shadow-sm"
            >
              <option value="ADMIN" className="bg-white text-orange font-bold py-1">
                ADMIN
              </option>
              <option value="SUPERVISOR" className="bg-white text-sky-900 font-bold py-1">
                SUPERVISOR
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Set User Password</label>
            <Input
              type="password"
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              placeholder="Minimum 6 chars"
              required
              minLength={6}
            />
          </div>

          <div className="sm:col-span-4 flex justify-end mt-2">
            <Button
              type="submit"
              className="bg-orange hover:bg-orange-600 text-white font-extrabold px-6 py-2 h-10 rounded-xl shadow-md cursor-pointer"
              disabled={isInviting}
            >
              {isInviting ? (
                <Loader size="sm" text="Granting &amp; Sending Email..." light />
              ) : (
                'Grant Direct Access & Send Email'
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Authorized Admin Accounts</h2>
          <span className="text-xs font-bold text-slate-500">{members.length} Users</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader size="lg" text="Loading admin access list..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="p-4">User Details</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Access Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <p className="font-bold text-navy text-sm">{m.name || 'Unnamed User'}</p>
                      <p className="text-slate-500 text-xs">{m.email || m.mobile}</p>
                    </td>
                    <td className="p-4">
                      <select
                        value={m.role}
                        disabled={m.email === 'gurvindersingh0218@gmail.com'}
                        onChange={(e) =>
                          handleUpdateStatus(m.id, m.approvalStatus || 'APPROVED', e.target.value)
                        }
                        className={`rounded-xl border px-3 py-1.5 text-xs font-extrabold shadow-sm transition-all outline-none ${
                          m.role === 'OWNER'
                            ? 'border-navy bg-navy text-white'
                            : m.role === 'ADMIN'
                              ? 'border-orange/30 bg-orange/10 text-orange'
                              : 'border-sky-300 bg-sky-50 text-sky-900'
                        } disabled:opacity-90 disabled:cursor-not-allowed`}
                      >
                        <option value="OWNER" className="bg-white text-navy font-bold py-1">
                          OWNER
                        </option>
                        <option value="ADMIN" className="bg-white text-orange font-bold py-1">
                          ADMIN
                        </option>
                        <option value="SUPERVISOR" className="bg-white text-sky-900 font-bold py-1">
                          SUPERVISOR
                        </option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          m.approvalStatus === 'APPROVED' || !m.approvalStatus
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}
                      >
                        {m.approvalStatus || 'APPROVED'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {m.email !== 'gurvindersingh0218@gmail.com' && (
                        <div className="flex items-center justify-end gap-2 shrink-0 whitespace-nowrap">
                          {m.approvalStatus === 'REJECTED' ? (
                            <button
                              onClick={() => handleUpdateStatus(m.id, 'APPROVED')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all cursor-pointer shrink-0 whitespace-nowrap shadow-xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Enable Access
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(m.id, 'REJECTED')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all cursor-pointer shrink-0 whitespace-nowrap shadow-xs"
                            >
                              <XCircle className="h-3.5 w-3.5 shrink-0" /> Revoke Access
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteUser(m.id, m.email || m.name || 'User')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all cursor-pointer shrink-0 whitespace-nowrap shadow-xs"
                            title="Delete Admin Account"
                          >
                            <Trash2 className="h-3.5 w-3.5 shrink-0" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
