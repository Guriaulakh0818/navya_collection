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
            <MessageSquare className="w-7 h-7 text-orange" />
            Marketplace Review Moderation Center
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Review, approve, or reject customer ratings and merchant replies across product and shop
            reviews.
          </p>
        </div>
      </div>

      {/* Moderation List Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-orange border-t-transparent rounded-full animate-spin" />
            Loading reviews for moderation...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No customer reviews recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left text-slate-800 border-collapse">
              <thead className="bg-slate-50 text-navy font-extrabold uppercase border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 border-r border-slate-200">Customer</th>
                  <th className="px-4 py-3.5 border-r border-slate-200">Rating</th>
                  <th className="px-4 py-3.5 border-r border-slate-200">Review Comment</th>
                  <th className="px-4 py-3.5 border-r border-slate-200">Verified Buyer</th>
                  <th className="px-4 py-3.5 border-r border-slate-200 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reviews.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-bold text-navy whitespace-nowrap border-r border-slate-100">
                      {r.user?.name || 'Customer'}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap border-r border-slate-100">
                      <div className="flex items-center gap-1 text-amber-500 font-bold font-mono text-sm">
                        {r.rating} <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </div>
                    </td>

                    <td className="px-4 py-4 max-w-sm border-r border-slate-100">
                      <p className="text-slate-700 font-medium line-clamp-2">{r.comment}</p>
                      {r.sellerReply && (
                        <p className="text-xs text-orange font-semibold italic mt-1 bg-orange/5 p-2 rounded-lg border border-orange/10">
                          Seller Reply: {r.sellerReply}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap border-r border-slate-100">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          r.isVerifiedPurchase
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {r.isVerifiedPurchase ? 'VERIFIED' : 'UNVERIFIED'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap border-r border-slate-100">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {r.status || 'APPROVED'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleModerate(r.id, 'APPROVED')}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl border border-emerald-200 transition-all cursor-pointer"
                      >
                        Approve ✓
                      </button>
                      <button
                        onClick={() => handleModerate(r.id, 'REJECTED')}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 transition-all cursor-pointer"
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
