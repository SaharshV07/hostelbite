import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Order, Review, Complaint } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { OrderStepper } from '../../components/OrderStepper';
import { StarRating } from '../../components/StarRating';
import { SimulatedPaymentModal } from '../../components/SimulatedPaymentModal';
import {
  Clock,
  MapPin,
  Building2,
  Bike,
  Star,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  MessageSquare,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Review state
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);

  // Complaint state
  const [showComplaintForm, setShowComplaintForm] = useState<boolean>(false);
  const [complaintCategory, setComplaintCategory] = useState<string>('Food Quality');
  const [complaintDesc, setComplaintDesc] = useState<string>('');
  const [complaintSubmitting, setComplaintSubmitting] = useState<boolean>(false);
  const [existingComplaint, setExistingComplaint] = useState<Complaint | null>(null);

  // Pending payment retry modal
  const [showPayModal, setShowPayModal] = useState<boolean>(false);

  const fetchOrder = async () => {
    try {
      if (!id) return;
      const res = await api.get<{ order: Order }>(`/orders/${id}`);
      setOrder(res.order);

      // Check for review
      try {
        const revRes = await api.get<{ reviews: Review[] }>(`/reviews/vendor/${res.order.vendor_id}`);
        const found = revRes.reviews.find(r => r.order_id === res.order.id);
        if (found) setExistingReview(found);
      } catch {}

      // Check for complaint
      try {
        const compRes = await api.get<{ complaints: Complaint[] }>('/complaints');
        const foundC = compRes.complaints.find(c => c.order_id === res.order.id);
        if (foundC) setExistingComplaint(foundC);
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 6000); // Polling for live status updates
    return () => clearInterval(interval);
  }, [id]);

  const handleCancelOrder = async () => {
    if (!order) return;
    const confirmCancel = window.confirm('Are you sure you want to cancel this order? Any payment will be automatically refunded to your in-app hostel wallet.');
    if (!confirmCancel) return;

    try {
      await api.post(`/orders/${order.id}/cancel`, { reason: 'Student cancelled order' });
      fetchOrder();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setReviewSubmitting(true);
    try {
      const res = await api.post<{ review: Review }>('/reviews', {
        orderId: order.id,
        rating,
        comment: reviewComment
      });
      setExistingReview(res.review);
      alert('Thank you for your rating and feedback!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setComplaintSubmitting(true);
    try {
      const res = await api.post<{ complaint: Complaint }>('/complaints', {
        orderId: order.id,
        issueCategory: complaintCategory,
        description: complaintDesc
      });
      setExistingComplaint(res.complaint);
      setShowComplaintForm(false);
      alert('Complaint lodged. The kitchen and administration have been alerted.');
      fetchOrder();
    } catch (err: any) {
      alert(err.message || 'Failed to lodge complaint.');
    } finally {
      setComplaintSubmitting(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading live order status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Order Not Found</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'Could not retrieve this order.'}</p>
        <Link to="/orders" className="btn btn-secondary">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '850px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Link to="/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> All Orders
        </Link>
        <button
          type="button"
          onClick={fetchOrder}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.75rem', gap: '0.3rem' }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Header Card */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Order #{order.id}</h2>
              <StatusBadge status={order.status} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Kitchen: <strong>{order.vendor_name}</strong> &bull; Placed at: {new Date(order.order_date).toLocaleString()}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Paid Amount</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>₹{order.total_amount.toFixed(2)}</strong>
            <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block' }}>
              {order.payment?.payment_status === 'Success' ? `Paid via ${order.payment.payment_method}` : order.status}
            </span>
          </div>
        </div>

        {/* Horizontal Order Progress Stepper */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <OrderStepper status={order.status} />
        </div>

        {/* Cancellation CTA if Eligible */}
        {order.status === 'Placed' && (
          <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleCancelOrder}
            >
              <XCircle size={14} /> Cancel Order & Refund
            </button>
          </div>
        )}

        {/* Retry Payment if Pending */}
        {order.status === 'Payment Pending' && (
          <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowPayModal(true)}
            >
              Complete Payment Now
            </button>
          </div>
        )}
      </div>

      {/* Delivery Courier Details */}
      {order.delivery_agent_name && (
        <div className="card" style={{ marginBottom: '1.25rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ backgroundColor: '#16a34a', color: '#fff', padding: '0.6rem', borderRadius: '50%' }}>
              <Bike size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', color: '#166534' }}>Assigned Delivery Courier: {order.delivery_agent_name}</strong>
              <p style={{ fontSize: '0.8rem', color: '#15803d' }}>
                Hand-off destination: {order.delivery_point}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Itemized Receipt */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.8rem' }}>Order Receipt</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {order.items?.map(it => (
            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <div>
                <span>{it.quantity}x &nbsp;</span>
                <strong>{it.item_name}</strong>
              </div>
              <span>₹{it.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.8rem', paddingTop: '0.8rem', fontSize: '0.825rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Items Subtotal</span>
            <span>₹{order.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Hostel Room Delivery Fee</span>
            <span>₹{order.delivery_fee.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Platform Fee</span>
            <span>₹{order.platform_fee.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed var(--border)' }}>
            <span>Total Paid</span>
            <span style={{ color: 'var(--primary)' }}>₹{order.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {order.special_instructions && (
          <div style={{ marginTop: '0.8rem', padding: '0.6rem', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '0.8rem' }}>
            <strong>Special Note:</strong> {order.special_instructions}
          </div>
        )}
      </div>

      {/* Post-Delivery Feedback / Review Section */}
      {order.status === 'Delivered' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Star size={18} color="#f59e0b" /> Rate Your Food & Delivery
          </h3>

          {existingReview ? (
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <StarRating rating={existingReview.rating} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>({existingReview.rating}/5 Stars)</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
                {existingReview.comment || 'No written comment left.'}
              </p>
              {existingReview.vendor_response && (
                <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.8rem', backgroundColor: '#ffffff', borderLeft: '3px solid var(--primary)', borderRadius: '4px', fontSize: '0.8rem' }}>
                  <strong>Kitchen Response:</strong> {existingReview.vendor_response}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitReview}>
              <div style={{ marginBottom: '0.8rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Select Star Rating</label>
                <StarRating rating={rating} interactive onRatingChange={setRating} size={24} />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Write a Review (Optional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="How was the food temperature, taste, and delivery speed?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" disabled={reviewSubmitting}>
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Post-Delivery Complaint / Dispute Section */}
      {order.status === 'Delivered' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={16} color="#d97706" /> Order Issue or Dispute?
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Eligible for complaints within 12 hours of delivery hand-off.
              </p>
            </div>

            {!existingComplaint && !showComplaintForm && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowComplaintForm(true)}
              >
                Raise Complaint
              </button>
            )}
          </div>

          {existingComplaint && (
            <div style={{ marginTop: '1rem', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '0.85rem', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.85rem', color: '#9a3412' }}>
                  Complaint #{existingComplaint.id}: {existingComplaint.issue_category}
                </strong>
                <StatusBadge status={existingComplaint.status} />
              </div>
              <p style={{ fontSize: '0.825rem', marginTop: '0.4rem', color: '#7c2d12' }}>
                "{existingComplaint.description}"
              </p>
              {existingComplaint.resolution_reason && (
                <div style={{ marginTop: '0.6rem', padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '4px', fontSize: '0.8rem' }}>
                  <strong>Admin Resolution Note:</strong> {existingComplaint.resolution_reason}
                  {existingComplaint.refund_amount > 0 && (
                    <span style={{ color: '#166534', fontWeight: 700, display: 'block', marginTop: '0.2rem' }}>
                      &bull; Wallet Refund: ₹{existingComplaint.refund_amount.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {showComplaintForm && !existingComplaint && (
            <form onSubmit={handleSubmitComplaint} style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Issue Category</label>
                <select
                  className="form-control"
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                >
                  <option value="Food Quality">Food Quality / Spoiled</option>
                  <option value="Missing Item">Missing Item in Package</option>
                  <option value="Spilled or Damaged">Spilled or Damaged Container</option>
                  <option value="Wrong Item">Wrong Item Delivered</option>
                  <option value="Excessive Delay">Excessive Delay</option>
                  <option value="Other">Other Operational Issue</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Describe the Issue</label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  placeholder="Provide details for kitchen and administrator audit..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={complaintSubmitting}>
                  {complaintSubmitting ? 'Submitting...' : 'Submit Complaint to Chief Warden'}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowComplaintForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Payment Retry Modal */}
      {showPayModal && (
        <SimulatedPaymentModal
          orderId={order.id}
          totalAmount={order.total_amount}
          onPaymentSuccess={() => {
            setShowPayModal(false);
            fetchOrder();
          }}
          onPaymentFailure={(err) => alert(err)}
          onClose={() => setShowPayModal(false)}
        />
      )}
    </div>
  );
};
