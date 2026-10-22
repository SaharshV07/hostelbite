import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Order } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  BarChart3,
  TrendingUp,
  Users,
  Store,
  AlertCircle,
  ShieldCheck,
  Package,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [ovRes, ordRes] = await Promise.all([
        api.get<any>('/analytics/overview'),
        api.get<{ orders: Order[] }>('/admin/orders?limit=10')
      ]);

      setOverview(ovRes);
      setRecentOrders(ordRes.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading || !overview) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading university administration analytics...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1100px' }}>
      {/* 1. Header */}
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Chief Warden / Hostel Admin Portal</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manipal University Jaipur &bull; Campus Food Delivery Governance
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link to="/admin/vendors" className="btn btn-secondary btn-sm">
            <Store size={14} /> Vendor Approvals
          </Link>
          <Link to="/admin/complaints" className="btn btn-primary btn-sm">
            <AlertCircle size={14} /> Disputes ({overview.openComplaints})
          </Link>
        </div>
      </div>

      {/* 2. Primary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Confirmed Orders</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
            {overview.totalOrders}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Gross Platform Revenue</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>
            ₹{overview.totalRevenue.toFixed(2)}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Active Campus Outlets</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb', marginTop: '0.2rem' }}>
            {overview.activeVendors}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Open Student Disputes</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: overview.openComplaints > 0 ? '#dc2626' : '#16a34a', marginTop: '0.2rem' }}>
            {overview.openComplaints}
          </div>
        </div>
      </div>

      {/* 3. Mess Wastage Projections (FR-RPT-02) */}
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc', borderLeft: '4px solid #3b82f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={18} color="#2563eb" /> Central Mess Meal Count & Wastage Reduction Indicator (FR-RPT-02)
          </h3>
          <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 700 }}>
            {overview.messWastage?.statusNote}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Subscribed Residents</span>
            <strong style={{ fontSize: '1.1rem' }}>{overview.messWastage?.totalRegisteredStudents} Students</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Mess Orders Placed Today</span>
            <strong style={{ fontSize: '1.1rem' }}>{overview.messWastage?.messOrdersCount} Meals</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Estimated Over-Prep Wastage Risk</span>
            <strong style={{ fontSize: '1.1rem', color: '#2563eb' }}>{overview.messWastage?.estimatedWastageRisk}</strong>
          </div>
        </div>
      </div>

      {/* 4. Recent Campus Orders Audit Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recent Campus Food Orders</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest 10 transactions</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '0.75rem 1rem' }}>Order ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>Student & Room</th>
              <th style={{ padding: '0.75rem 1rem' }}>Kitchen</th>
              <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Payment</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>#{o.id}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  {o.student_name}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.delivery_point}</div>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>{o.vendor_name}</td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>₹{o.total_amount.toFixed(2)}</td>
                <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={o.status} /></td>
                <td style={{ padding: '0.75rem 1rem' }}>{o.payment?.payment_method || 'Online'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
