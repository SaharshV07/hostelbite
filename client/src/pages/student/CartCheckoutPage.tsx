import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { SimulatedPaymentModal } from '../../components/SimulatedPaymentModal';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const CartCheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const { items, vendorName, vendorId, updateQuantity, removeItem, clearCart, subtotal, deliveryFee, platformFee, totalAmount } = useCart();
  const navigate = useNavigate();

  const [deliveryPoint, setDeliveryPoint] = useState<string>(
    user?.hostel_block && user?.room_number
      ? `Hostel ${user.hostel_block} - Room ${user.room_number}`
      : 'Hostel B2 - Room 304'
  );
  const [deliverySlot, setDeliverySlot] = useState<string>('Immediate');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Payment Modal State
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingOrderTotal, setPendingOrderTotal] = useState<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  if (items.length === 0 && !pendingOrderId) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <ShoppingBag size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.5rem 0 1.5rem 0' }}>
          Explore campus mess specials and eatery menus to start your order.
        </p>
        <Link to="/" className="btn btn-primary">Browse Menus</Link>
      </div>
    );
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!vendorId) throw new Error('Missing vendor information.');

      // Server-side validation first
      const valRes = await api.post<any>('/orders/validate-cart', {
        vendorId,
        items: items.map(ci => ({
          itemId: ci.item.id,
          quantity: ci.quantity,
          customizationNotes: ci.customizationNotes
        }))
      });

      // Create pending order
      const createRes = await api.post<{ order: any }>('/orders', {
        vendorId,
        deliveryPoint,
        deliverySlot,
        specialInstructions,
        items: items.map(ci => ({
          itemId: ci.item.id,
          quantity: ci.quantity,
          customizationNotes: ci.customizationNotes
        }))
      });

      setPendingOrderId(createRes.order.id);
      setPendingOrderTotal(createRes.order.total_amount);
      setShowPaymentModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (confirmedOrder: any) => {
    setShowPaymentModal(false);
    clearCart();
    navigate(`/orders/${confirmedOrder.id}`);
  };

  const handlePaymentFailure = (errMsg: string) => {
    setError(`Payment Declined: ${errMsg}. Order #${pendingOrderId} is preserved in pending status. You can retry payment.`);
  };

  return (
    <div className="container" style={{ maxWidth: '960px' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem' }}>
        Review Order & Checkout
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Ordering from: <strong style={{ color: 'var(--text-main)' }}>{vendorName}</strong>
      </p>

      {error && (
        <div style={{
          padding: '0.85rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#b91c1c',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Items & Delivery Info */}
        <div>
          {/* Items Card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Order Items ({items.length})</h3>
              <button
                type="button"
                onClick={clearCart}
                style={{ fontSize: '0.8rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Trash2 size={14} /> Clear Cart
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {items.map(ci => (
                <div key={ci.item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className={`badge ${ci.item.dietary_tag === 'Veg' ? 'badge-veg' : ci.item.dietary_tag === 'Jain' ? 'badge-jain' : 'badge-nonveg'}`}>
                        {ci.item.dietary_tag}
                      </span>
                      <strong style={{ fontSize: '0.95rem' }}>{ci.item.name}</strong>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ₹{ci.item.price.toFixed(2)} each
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      <button type="button" onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)} style={{ padding: '0 0.2rem' }}>
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{ci.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)} style={{ padding: '0 0.2rem' }}>
                        <Plus size={14} />
                      </button>
                    </div>

                    <strong style={{ minWidth: '70px', textAlign: 'right', fontSize: '0.95rem' }}>
                      ₹{(ci.item.price * ci.quantity).toFixed(2)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Details Form */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={18} color="var(--primary)" /> Delivery Location & Slot
            </h3>

            <div className="form-group">
              <label className="form-label">Hostel Delivery Point</label>
              <input
                type="text"
                className="form-control"
                value={deliveryPoint}
                onChange={(e) => setDeliveryPoint(e.target.value)}
                placeholder="e.g. Hostel B2 - Room 304 or Ground Common Area"
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Couriers deliver directly to student hostel rooms or ground security drop points.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Slot</label>
              <select
                className="form-control"
                value={deliverySlot}
                onChange={(e) => setDeliverySlot(e.target.value)}
              >
                <option value="Immediate">Immediate (Deliver as soon as prepared)</option>
                <option value="Dinner Window (8:00 - 9:30 PM)">Dinner Window (8:00 - 9:30 PM)</option>
                <option value="Evening Snacks (5:00 - 6:30 PM)">Evening Snacks (5:00 - 6:30 PM)</option>
                <option value="Lunch Window (12:30 - 2:00 PM)">Lunch Window (12:30 - 2:00 PM)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Special Cooking or Hand-off Instructions</label>
              <textarea
                className="form-control"
                rows={2}
                maxLength={200}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Extra napkins please, or call once at B2 gate."
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textAlign: 'right' }}>
                {specialInstructions.length}/200 characters
              </span>
            </div>
          </div>
        </div>

        {/* Right: Price Breakdown & Pay CTA */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '90px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>
              Bill Breakdown
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Items Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>In-Hostel Delivery Fee</span>
                <span>₹{deliveryFee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Campus Platform Fee</span>
                <span>₹{platformFee.toFixed(2)}</span>
              </div>

              <div style={{
                borderTop: '2px solid var(--border)',
                marginTop: '0.4rem',
                paddingTop: '0.8rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.15rem',
                fontWeight: 800
              }}>
                <span>To Pay</span>
                <span style={{ color: 'var(--primary)' }}>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={loading}
              onClick={handleCreateOrder}
              style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem' }}
            >
              <span>Proceed to Payment</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#15803d', fontSize: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
              <ShieldCheck size={16} />
              <span>Cashless payment simulation & instant refunds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPaymentModal && pendingOrderId && (
        <SimulatedPaymentModal
          orderId={pendingOrderId}
          totalAmount={pendingOrderTotal}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};
