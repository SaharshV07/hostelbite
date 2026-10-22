import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Review, Complaint, Vendor } from '../../types';
import { StarRating } from '../../components/StarRating';
import { StatusBadge } from '../../components/StatusBadge';
import { MessageSquare, AlertCircle, Send, CheckCircle2 } from 'lucide-react';

export const VendorReviewsPage: React.FC = () => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const vRes = await api.get<{ vendor: Vendor }>('/vendors/my/profile');
      setVendor(vRes.vendor);

      const [rRes, cRes] = await Promise.all([
        api.get<{ reviews: Review[] }>(`/reviews/vendor/${vRes.vendor.id}`),
        api.get<{ complaints: Complaint[] }>('/complaints')
      ]);

      setReviews(rRes.reviews);
      setComplaints(cRes.complaints.filter(c => c.vendor_id === vRes.vendor.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handlePostResponse = async (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text || text.trim().length === 0) return;

    setSubmittingId(reviewId);
    try {
      await api.post(`/reviews/${reviewId}/respond`, { response: text.trim() });
      await fetchFeedback();
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
    } catch (err: any) {
      alert(err.message || 'Failed to post reply.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem' }}>
        Customer Feedback & Reviews
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Manage customer reviews, post official responses, and inspect escalated complaints
      </p>

      {/* Reviews List */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <MessageSquare size={18} /> Verified Student Reviews ({reviews.length})
        </h3>

        {loading ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No reviews submitted yet for this outlet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map(rev => (
              <div key={rev.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{rev.student_name || 'Resident'}</strong>
                    <StarRating rating={rev.rating} size={14} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Order #{rev.order_id}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', margin: '0.4rem 0' }}>
                  {rev.comment || 'Rated without comment.'}
                </p>

                {rev.vendor_response ? (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.6rem 0.8rem',
                    backgroundColor: '#f8fafc',
                    borderLeft: '3px solid var(--primary)',
                    borderRadius: '4px',
                    fontSize: '0.825rem'
                  }}>
                    <strong style={{ color: 'var(--primary)', display: 'block', fontSize: '0.75rem' }}>Official Kitchen Response:</strong>
                    <span>{rev.vendor_response}</span>
                  </div>
                ) : (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Write a courteous public response to this review..."
                        value={replyText[rev.id] || ''}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [rev.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={submittingId === rev.id || !replyText[rev.id]}
                        onClick={() => handlePostResponse(rev.id)}
                      >
                        <Send size={14} /> Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outlet Complaints Audit */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertCircle size={18} color="#dc2626" /> Order Disputes & Quality Issues ({complaints.length})
        </h3>

        {complaints.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <CheckCircle2 size={24} style={{ margin: '0 auto 0.5rem auto' }} />
            <strong>Clean Record!</strong>
            <p style={{ fontSize: '0.825rem', marginTop: '0.2rem' }}>No open customer disputes on your kitchen orders.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {complaints.map(c => (
              <div key={c.id} className="card" style={{ borderLeft: '4px solid #f97316' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>Order #{c.order_id} &bull; {c.issue_category}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Student: {c.student_name} &bull; Lodged on {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <p style={{ fontSize: '0.85rem', color: '#9a3412', marginTop: '0.5rem', backgroundColor: '#fff7ed', padding: '0.5rem', borderRadius: '4px' }}>
                  "{c.description}"
                </p>
                {c.resolution_reason && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    <strong>Resolution Note:</strong> {c.resolution_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
