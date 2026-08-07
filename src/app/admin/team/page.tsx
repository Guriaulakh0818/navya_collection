'use client';

import { CheckCircle2, ShieldAlert, Trash2, UserPlus, Users, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

  const isOwner =
    user &&
    (String(user.role).toUpperCase() === 'OWNER' ||
      String(user.role).toUpperCase() === 'SUPER_ADMIN' ||
      user.email === 'gurvindersingh0218@gmail.com' ||
      user.email === 'guriaulakh497@gmail.com');

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
      }
    } catch (err: any) {
      console.error('Failed to load team members:', err);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array prevents re-trigger loops!

  useEffect(() => {
    if (isOwner) {
      fetchTeam();
    } else {
      setIsLoading(false);
    }
  }, [fetchTeam, isOwner]);

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
      toast(err.message || 'Error granting access.', 'error');
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
      if (res.ok && data.success) {
        toast(data.message || 'Permissions updated!', 'success');
        fetchTeam();
      } else {
        toast(data.message || 'Failed to update permissions.', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Error updating status.', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete admin account "${email}"?`)) return;
    try {
      const res = await fetch(`/api/v1/admin/team?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast(data.message || 'User account deleted.', 'success');
        fetchTeam();
      } else {
        toast(data.message || 'Failed to delete user account.', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Error deleting account.', 'error');
    }
  };

  // If not owner, display elegant restricted access notice card instead of crashing!
  if (!isOwner && !isLoading) {
    return (
      <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-6">
        <Card className="p-8 text-center space-y-4 border-amber-200 bg-amber-50/50 rounded-3xl shadow-sm">
          <ShieldAlert className="w-14 h-14 text-amber-600 mx-auto" />
          <h2 className="text-2xl font-bold text-navy">Owner Governance Restricted</h2>
          <p className="text-xs md:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Managing admin team members, assigning access roles, and delegating permissions are
            restricted exclusively to the primary Store Owner (`OWNER` / `SUPER_ADMIN`).
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy text-white text-xs font-bold shadow-xs">
              Logged in as: {user?.role || 'ADMIN'} ({user?.email})
            </span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-navy text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-gold text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="h-4 w-4" />
            <span>Store Access Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Admin &amp; Supervisor Team Governance
          </h1>
          <p className="text-xs text-white/80 mt-1">
            Grant direct login credentials to internal team members (Admin / Supervisor) with
            automated email welcome notifications.
          </p>
        </div>
      </div>

      {/* Grant Access Card */}
      <Card className="p-6 sm:p-8 border-slate-200 shadow-md rounded-3xl space-y-6 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-navy/10 text-navy rounded-2xl">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">Grant Direct Admin Access</h2>
            <p className="text-xs text-slate-500">
              User will receive an email with login instructions &amp; credentials immediately.
            </p>
          </div>
        </div>

        <form onSubmit={handleGrantAccess} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Full Name (Optional)
              </label>
              <Input
                placeholder="e.g. Navya Store Supervisor"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Gmail / Email Address *
              </label>
              <Input
                type="email"
                required
                placeholder="member@gmail.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Assign Role Permission *
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="ADMIN">ADMIN (Products, Orders &amp; Catalog Management)</option>
                <option value="SUPERVISOR">
                  SUPERVISOR (Read-Only Insights &amp; Growth Analytics)
                </option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Set Initial Login Password *
              </label>
              <Input
                type="text"
                required
                minLength={6}
                placeholder="e.g. NavyaPass@2026"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                className="rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isInviting}
              className="bg-navy hover:bg-navy-hover text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md cursor-pointer gap-2"
            >
              {isInviting ? (
                <>
                  <Loader size="sm" className="text-white" /> Sending Access Email...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Grant Access &amp; Send Credentials Email
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Team Members List Table */}
      <Card className="p-6 border-slate-200 shadow-sm rounded-3xl space-y-4 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <Users className="w-5 h-5 text-navy" />
            Active Team Members &amp; Roles ({members.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader size="md" className="mx-auto text-navy" />
            <p className="text-xs font-semibold mt-2">Loading team members database...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-xs font-semibold">No team members registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead>
                <tr className="border-b border-slate-100 uppercase text-slate-400 font-extrabold tracking-wider">
                  <th className="pb-3 pl-2">User Info</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Approval Status</th>
                  <th className="pb-3">Granted Date</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {members.map((m) => {
                  const roleNormalized = String(m.role || '').toUpperCase();
                  const isPrimaryOwner =
                    m.email === 'gurvindersingh0218@gmail.com' ||
                    m.email === 'guriaulakh497@gmail.com' ||
                    roleNormalized === 'OWNER';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-4 pl-2">
                        <div className="font-extrabold text-navy text-sm">
                          {m.name || 'Admin User'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{m.email}</div>
                      </td>

                      <td className="py-4">
                        {isPrimaryOwner ? (
                          <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[11px] font-extrabold">
                            👑 OWNER
                          </span>
                        ) : (
                          <select
                            value={m.role}
                            onChange={(e) =>
                              handleUpdateStatus(
                                m.id,
                                m.approvalStatus || 'APPROVED',
                                e.target.value,
                              )
                            }
                            className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPERVISOR">SUPERVISOR</option>
                          </select>
                        )}
                      </td>

                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold border uppercase ${
                            m.approvalStatus === 'APPROVED' || !m.approvalStatus
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {m.approvalStatus || 'APPROVED'}
                        </span>
                      </td>

                      <td className="py-4 text-slate-500 font-mono text-[11px]">
                        {new Date(m.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-4 text-right pr-2">
                        {!isPrimaryOwner && (
                          <div className="flex items-center justify-end gap-2">
                            {m.approvalStatus === 'APPROVED' || !m.approvalStatus ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-[11px] h-7 text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 cursor-pointer font-bold"
                                onClick={() => handleUpdateStatus(m.id, 'REJECTED')}
                              >
                                Revoke Access
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-[11px] h-7 text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 cursor-pointer font-bold"
                                onClick={() => handleUpdateStatus(m.id, 'APPROVED')}
                              >
                                Grant Access
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 w-7 p-0 cursor-pointer"
                              onClick={() => handleDeleteUser(m.id, m.email || 'User')}
                              title="Delete Account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
