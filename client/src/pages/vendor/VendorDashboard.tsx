import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Order, Vendor } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Utensils,
  Package,
  Bike,
  RefreshCw,
  Power,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const VendorDashboard: React.FC = () => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVendorAndOrders = async () => {
    try {
      const [vRes, oRes] = await Promise.all([
        api.get<{ vendor: Vendor }>('/vendors/my/profile'),
        api.get<{ orders: Order[] }>('/orders')
      ]);
      setVendor(vRes.vendor);
      setOrders(oRes.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorAndOrders();
    const interval = setInterval(fetchVendorAndOrders, 6000); // Polling for incoming orders
    return () => clearInterval(interval);
  }, []);

  const handleToggleAccepting = async () => {
    if (!vendor) return;
    try {
      const res = await api.put<{ vendor: Vendor }>(`/vendors/${vendor.id}/accepting-orders`, {
        acceptingOrders: !vendor.accepting_orders
      });
      setVendor(res.vendor);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  const handleStatusChange = async (orderId: string, status: string, reason?: string) => {
    setActionLoading(orderId);
    try {
      await api.post(`/orders/${orderId}/status`, { status, reason });
      await fetchVendorAndOrders();
    } catch (err: any) {
      alert(err.message || 'Status transition failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const reason = window.prompt('Please provide a reason for rejecting this order (student will receive automatic full refund):', 'Kitchen at maximum capacity');
    if (!reason) return;

    setActionLoading(orderId);
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason });
      await fetchVendorAndOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to reject order.');
    } finally {
      setActionLoading(null);
    }
  };

  // Kanban Columns
  const newOrders = orders.filter(o => o.status === 'Placed');
  const inPrepOrders = orders.filter(o => ['Accepted', 'Preparing'].includes(o.status));
  const readyOrders = orders.filter(o => o.status === 'Ready');
  const completedOrders = orders.filter(o => ['Out for Delivery', 'Delivered'].includes(o.status));

  // Daily Totals
  const totalSales = orders
    .filter(o => ['Delivered', 'Ready', 'Out for Delivery', 'Accepted', 'Preparing'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.subtotal), 0);

  return (
    <div className="container" style={{ maxWidth: '1240px' }}>
      {/* 1. Vendor Operations Header */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{vendor?.business_name || 'Kitchen Dashboard'}</h2>
            {vendor?.is_mess === 1 && (
              <span style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                CENTRAL HOSTEL MESS
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Kitchen Queue & Kanban Order Processing Board
          </span>
        </div>

        {/* Operating Status Switch & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={handleToggleAccepting}
            className={`btn btn-sm ${vendor?.accepting_orders ? 'btn-secondary' : 'btn-danger'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <Power size={16} />
            <span>{vendor?.accepting_orders ? 'Kitchen Open (Accepting)' : 'Kitchen Paused (Busy)'}</span>
          </button>

          <button
            type="button"
            onClick={fetchVendorAndOrders}
            className="btn btn-secondary btn-sm"
            title="Refresh order queue"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Incoming New</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1d4ed8' }}>{newOrders.length}</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Currently Cooking</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a16207' }}>{inPrepOrders.length}</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Ready for Dispatch</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#86198f' }}>{readyOrders.length}</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Active Sales Volume</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>₹{totalSales.toFixed(2)}</div>
        </div>
      </div>

      {/* 3. Kanban Order Queue Board */}
      <div className="kanban-board">
        {/* Column 1: New Incoming Orders */}
        <div className="kanban-col">
          <div className="kanban-col-header">
            <strong style={{ fontSize: '0.9rem', color: '#1d4ed8' }}>New Orders ({newOrders.length})</strong>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
              Action Required
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {newOrders.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                No pending incoming orders.
              </p>
            ) : (
              newOrders.map(order => (
                <div key={order.id} className="card" style={{ padding: '0.85rem', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ fontSize: '0.9rem' }}>#{order.id}</strong>
                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{order.total_amount.toFixed(2)}</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem 0' }}>
                    Student: <strong>{order.student_name}</strong> ({order.student_block}-{order.student_room})
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginBottom: '0.6rem', fontSize: '0.8rem' }}>
                    {order.items?.map(it => (
                      <div key={it.id}>
                        {it.quantity}x {it.item_name}
                      </div>
                    ))}
                  </div>

                  {order.special_instructions && (
                    <div style={{ fontSize: '0.75rem', color: '#b45309', backgroundColor: '#fef3c7', padding: '0.3rem', borderRadius: '4px', marginBottom: '0.6rem' }}>
                      <strong>Note:</strong> {order.special_instructions}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, backgroundColor: '#16a34a' }}
                      disabled={actionLoading === order.id}
                      onClick={() => handleStatusChange(order.id, 'Accepted')}
                    >
                      <CheckCircle2 size={14} /> Accept
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={actionLoading === order.id}
                      onClick={() => handleRejectOrder(order.id)}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Kitchen Prep */}
        <div className="kanban-col">
          <div className="kanban-col-header">
            <strong style={{ fontSize: '0.9rem', color: '#a16207' }}>Kitchen Prep ({inPrepOrders.length})</strong>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#fef08a', color: '#854d0e', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
              Cooking
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {inPrepOrders.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                No orders currently in prep.
              </p>
            ) : (
              inPrepOrders.map(order => (
                <div key={order.id} className="card" style={{ padding: '0.85rem', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ fontSize: '0.9rem' }}>#{order.id}</strong>
                    <StatusBadge status={order.status} />
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem 0' }}>
                    Destination: {order.delivery_point}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginBottom: '0.6rem', fontSize: '0.8rem' }}>
                    {order.items?.map(it => (
                      <div key={it.id}>
                        {it.quantity}x {it.item_name}
                      </div>
                    ))}
                  </div>

                  {order.status === 'Accepted' ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', backgroundColor: '#ca8a04' }}
                      disabled={actionLoading === order.id}
                      onClick={() => handleStatusChange(order.id, 'Preparing')}
                    >
                      <Utensils size={14} /> Start Cooking (Preparing)
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', backgroundColor: '#86198f' }}
                      disabled={actionLoading === order.id}
                      onClick={() => handleStatusChange(order.id, 'Ready')}
                    >
                      <Package size={14} /> Mark Packed & Ready for Pickup
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Ready for Pickup */}
        <div className="kanban-col">
          <div className="kanban-col-header">
            <strong style={{ fontSize: '0.9rem', color: '#86198f' }}>Ready for Pickup ({readyOrders.length})</strong>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#f5d0fe', color: '#701a75', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
              Dispatch Bay
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {readyOrders.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                No packed orders awaiting couriers.
              </p>
            ) : (
              readyOrders.map(order => (
                <div key={order.id} className="card" style={{ padding: '0.85rem', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem' }}>#{order.id}</strong>
                    <StatusBadge status={order.status} />
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.4rem 0' }}>
                    Drop: {order.delivery_point}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#166534', backgroundColor: '#dcfce7', padding: '0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Bike size={14} />
                    <span>Awaiting campus delivery courier claim.</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 4: Dispatched & Delivered */}
        <div className="kanban-col">
          <div className="kanban-col-header">
            <strong style={{ fontSize: '0.9rem', color: '#166534' }}>Completed & Out ({completedOrders.length})</strong>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#14532d', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
              Fulfilled
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {completedOrders.slice(0, 10).map(order => (
              <div key={order.id} className="card" style={{ padding: '0.75rem', backgroundColor: '#ffffff', opacity: 0.9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.85rem' }}>#{order.id}</strong>
                  <StatusBadge status={order.status} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Student: {order.student_name} &bull; ₹{order.total_amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
