'use client';

import {
  CheckCircle2,
  MessageSquare,
  ShieldAlert,
  Star,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminReviewModerationPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/reviews');
      const json = await res.json();
      if (json.success && json.data?.reviews) {
        setReviews(json.data.reviews);
      }
    } catch (err) {
      console.error('Failed to fetch reviews for moderation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModerate = async (reviewId: string, status: string) => {
    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, status }),
      });
      const json = await res.json();
      if (json.success) {
        fetchReviews();
      } else {
        alert(json.message || 'Failed to moderate review.');
      }
    } catch (err) {
      console.error('Moderation error:', err);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-slate-50 text-slate-900 min-h-screen font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-amber-600" />
            Marketplace Review Moderation Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review, approve, or reject customer ratings and merchant replies across product and shop
            reviews.
          </p>
        </div>
      </div>

      {/* Moderation List Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            Loading reviews for moderation...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No customer reviews recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Review Comment</th>
                  <th className="px-4 py-3">Verified Buyer</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-4 font-bold text-white whitespace-nowrap">
                      {r.user?.name || 'Customer'}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-0.5 text-amber-400 font-bold font-mono">
                        {r.rating} <Star className="w-3.5 h-3.5 fill-amber-400" />
                      </div>
                    </td>

                    <td className="px-4 py-4 max-w-sm">
                      <p className="text-slate-200 line-clamp-2">{r.comment}</p>
                      {r.sellerReply && (
                        <p className="text-[10px] text-amber-300 italic mt-1">
                          Reply: {r.sellerReply}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.isVerifiedPurchase
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.isVerifiedPurchase ? 'VERIFIED' : 'UNVERIFIED'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {r.status || 'APPROVED'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleModerate(r.id, 'APPROVED')}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/30 transition-all"
                      >
                        Approve ✓
                      </button>
                      <button
                        onClick={() => handleModerate(r.id, 'REJECTED')}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg border border-red-500/30 transition-all"
                      >
                        Reject ✕
                      </button>
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
