import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Order } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Clock, ArrowRight, ShoppingBag } from 'lucide-react';

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('All');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ orders: Order[] }>('/orders');
      setOrders(res.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    if (filter === 'Active') return ['Placed', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.status);
    if (filter === 'Delivered') return o.status === 'Delivered';
    if (filter === 'Cancelled') return o.status === 'Cancelled';
    return true;
  });

  return (
    <div className="container" style={{ maxWidth: '850px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>My Orders</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Order history and real-time delivery tracking</span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['All', 'Active', 'Delivered', 'Cancelled'].map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: `1px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: filter === f ? 'var(--primary)' : '#ffffff',
                color: filter === f ? '#ffffff' : 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          Loading order history...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <ShoppingBag size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.8rem auto' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Orders Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.4rem 0 1.25rem 0' }}>
            You have no orders matching the selected filter.
          </p>
          <Link to="/" className="btn btn-primary btn-sm">Explore Menus</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredOrders.map(order => (
            <div key={order.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                  <strong style={{ fontSize: '1rem' }}>#{order.id}</strong>
                  <StatusBadge status={order.status} />
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>{order.vendor_name}</strong> &bull; {new Date(order.order_date).toLocaleDateString()} at {new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Drop: {order.delivery_point}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--primary)', display: 'block' }}>
                    ₹{order.total_amount.toFixed(2)}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {order.payment?.payment_method || 'Online'}
                  </span>
                </div>

                <Link to={`/orders/${order.id}`} className="btn btn-outline btn-sm">
                  <span>Track / View</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
