import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Order } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Bike,
  CheckCircle2,
  Package,
  MapPin,
  Building2,
  RefreshCw,
  Phone,
  Clock,
  ArrowRight
} from 'lucide-react';

export const DeliveryDashboard: React.FC = () => {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [availRes, myRes] = await Promise.all([
        api.get<{ orders: Order[] }>('/delivery/available'),
        api.get<{ tasks: any[] }>('/delivery/my-tasks')
      ]);

      setAvailableOrders(availRes.orders);
      setMyTasks(myRes.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000); // Polling for dispatch tasks
    return () => clearInterval(interval);
  }, []);

  const handleClaimOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await api.post(`/delivery/${orderId}/claim`);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to claim delivery.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: 'Out for Delivery' | 'Delivered') => {
    setActionLoading(orderId);
    try {
      await api.post(`/delivery/${orderId}/status`, { status });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update delivery status.');
    } finally {
      setActionLoading(null);
    }
  };

  const activeTasks = myTasks.filter(t => ['Ready', 'Out for Delivery'].includes(t.status));
  const completedTasks = myTasks.filter(t => t.status === 'Delivered');

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      {/* 1. Header with Courier Status */}
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
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Hostel Delivery Runner Console</h2>
            <span className="badge" style={{ backgroundColor: isAvailable ? '#dcfce7' : '#fee2e2', color: isAvailable ? '#166534' : '#b91c1c' }}>
              {isAvailable ? 'ON DUTY (ACTIVE)' : 'OFFLINE (ON BREAK)'}
            </span>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            In-hostel block-level dispatch & room drop-off coordination
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className={`btn btn-sm ${isAvailable ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setIsAvailable(!isAvailable)}
          >
            {isAvailable ? 'Go Offline' : 'Set Active'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchData}
            title="Refresh assignments"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 2. My Active Deliveries Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Bike size={18} color="var(--primary)" /> My Active Deliveries ({activeTasks.length}/2 permitted)
        </h3>

        {activeTasks.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            You have no active deliveries in transit. Claim an order below from the available queue!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {activeTasks.map(task => (
              <div key={task.id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <strong style={{ fontSize: '1rem' }}>Order #{task.id}</strong>
                  <StatusBadge status={task.status} />
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                  Pickup Counter: <strong>{task.vendor_name}</strong>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '0.65rem', borderRadius: '6px', fontSize: '0.825rem', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <MapPin size={16} color="var(--primary)" />
                    <span>{task.delivery_point}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Student: {task.student_name} &bull; Call: {task.student_mobile}
                  </div>
                  {task.special_instructions && (
                    <div style={{ marginTop: '0.3rem', color: '#9a3412', fontStyle: 'italic' }}>
                      Note: "{task.special_instructions}"
                    </div>
                  )}
                </div>

                {task.status === 'Ready' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    disabled={actionLoading === task.id}
                    onClick={() => handleUpdateStatus(task.id, 'Out for Delivery')}
                  >
                    <Bike size={16} /> Picked Up & Out for Delivery
                  </button>
                )}

                {task.status === 'Out for Delivery' && (
                  <button
                    type="button"
                    className="btn"
                    style={{ width: '100%', backgroundColor: '#16a34a', color: '#fff', fontSize: '0.85rem' }}
                    disabled={actionLoading === task.id}
                    onClick={() => handleUpdateStatus(task.id, 'Delivered')}
                  >
                    <CheckCircle2 size={16} /> Confirm Room Hand-off (Delivered)
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Available Ready Orders Board */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Package size={18} color="#86198f" /> Available Packed Orders Ready for Pickup ({availableOrders.length})
        </h3>

        {availableOrders.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No unassigned ready orders in the queue right now. Check back in a few moments!
          </div>
        ) : (
          <div className="grid-2">
            {availableOrders.map(order => (
              <div key={order.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>Order #{order.id}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Counter: <strong>{order.vendor_name}</strong>
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div style={{ margin: '0.75rem 0', padding: '0.6rem', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '0.8rem' }}>
                  <div><strong>Destination:</strong> {order.delivery_point}</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Student: {order.student_name} ({order.student_mobile})
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  disabled={actionLoading === order.id || activeTasks.length >= 2}
                  onClick={() => handleClaimOrder(order.id)}
                >
                  <Package size={14} /> Claim This Delivery
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Completed Deliveries History */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
          Completed Drop-offs Today ({completedTasks.length})
        </h3>

        {completedTasks.length === 0 ? (
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No deliveries completed on this shift yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {completedTasks.slice(0, 10).map(t => (
              <div key={t.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>Order #{t.id}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {t.vendor_name} &rarr; {t.delivery_point}
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
