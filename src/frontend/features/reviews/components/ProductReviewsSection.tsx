'use client';

import { Building2, MessageSquare, ShieldCheck, Sparkles, Star, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { RatingSummaryCard } from './RatingSummaryCard';

interface ProductReviewsSectionProps {
  productId?: string;
  shopId?: string;
  currentUserId?: string;
}

export function ProductReviewsSection({
  productId,
  shopId,
  currentUserId,
}: ProductReviewsSectionProps) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/v1/reviews', window.location.origin);
      if (productId) url.searchParams.set('productId', productId);
      if (shopId) url.searchParams.set('shopId', shopId);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, [productId, shopId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Please enter your review comments.');
      return;
    }

    if (!currentUserId) {
      alert('Please log in to write a review.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          productId,
          shopId,
          rating,
          comment,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowReviewModal(false);
        setComment('');
        fetchReviews();
      } else {
        alert(json.message || 'Failed to submit review.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = data?.summary || {
    averageRating: 0,
    totalCount: 0,
    percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };
  const reviews = data?.reviews || [];

  return (
    <section className="space-y-8 my-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-amber-600" />
            Customer Ratings & Reviews
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real feedback from verified marketplace buyers.
          </p>
        </div>

        <button
          onClick={() => setShowReviewModal(true)}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all"
        >
          Write a Review ★
        </button>
      </div>

      {/* RATING SUMMARY CARD */}
      <RatingSummaryCard summary={summary} />

      {/* REVIEWS LIST */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center text-slate-500 border border-dashed border-slate-300 rounded-3xl space-y-2 bg-white">
          <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="font-semibold text-sm">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((r: any) => (
            <div
              key={r.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-amber-500/30 flex items-center justify-center text-amber-600 font-bold">
                    {r.user?.name ? (
                      r.user.name.charAt(0).toUpperCase()
                    ) : (
                      <User className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-sm">
                      {r.user?.name || 'Verified Buyer'}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(r.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>

                {r.isVerifiedPurchase && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> VERIFIED BUYER
                  </span>
                )}
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`}
                  />
                ))}
              </div>

              {/* Comment Text */}
              <p className="text-xs text-slate-700 leading-relaxed">{r.comment}</p>

              {/* Seller Reply Box */}
              {r.sellerReply && (
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-amber-200 space-y-1">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-bold">
                    <Building2 className="w-4 h-4" /> Merchant Store Response
                  </div>
                  <p className="text-xs text-slate-600 italic">{r.sellerReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* WRITE REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <Sparkles className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-extrabold text-navy text-base">Write a Review</h3>
                <p className="text-xs text-slate-500">
                  Share your rating & experience with this product.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-2">
                  Overall Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${star <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Your Comments</label>
                <textarea
                  rows={4}
                  placeholder="Share details about fit, fabric quality, craftsmanship..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Submit Review ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
