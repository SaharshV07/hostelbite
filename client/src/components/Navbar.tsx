import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../api/client';
import { Notification } from '../types';
import {
  UtensilsCrossed,
  ShoppingBag,
  Wallet,
  Clock,
  User as UserIcon,
  Bell,
  LogOut,
  Layers,
  CheckSquare,
  BarChart3,
  ShieldCheck,
  Bike,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, demoLogin, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get<{ notifications: Notification[]; unreadCount: number }>('/notifications');
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000); // Poll notifications periodically
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch {
      // ignore
    }
  };

  const handleDemoSwitch = async (role: any, outlet?: string) => {
    await demoLogin(role, outlet);
    if (role === 'student') navigate('/');
    else if (role === 'vendor') navigate('/vendor');
    else if (role === 'delivery') navigate('/delivery');
    else if (role === 'admin') navigate('/admin');
  };

  return (
    <>
      {/* 1. Academic Demo Fast Role Switcher */}
      <div className="demo-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="demo-bar-badge">SE LAB DEMO</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>1-Click Role Switcher:</span>
        </div>
        <div className="demo-buttons">
          <button
            type="button"
            className={`demo-btn ${user?.role === 'student' ? 'active' : ''}`}
            onClick={() => handleDemoSwitch('student')}
          >
            Student (Saharsh)
          </button>
          <button
            type="button"
            className={`demo-btn ${user?.role === 'vendor' && user.email.includes('mess') ? 'active' : ''}`}
            onClick={() => handleDemoSwitch('vendor', 'mess')}
          >
            Mess Manager
          </button>
          <button
            type="button"
            className={`demo-btn ${user?.role === 'vendor' && user.email.includes('munchbox') ? 'active' : ''}`}
            onClick={() => handleDemoSwitch('vendor', 'munchbox')}
          >
            Vendor (Munch Box)
          </button>
          <button
            type="button"
            className={`demo-btn ${user?.role === 'delivery' ? 'active' : ''}`}
            onClick={() => handleDemoSwitch('delivery')}
          >
            Delivery Courier
          </button>
          <button
            type="button"
            className={`demo-btn ${user?.role === 'admin' ? 'active' : ''}`}
            onClick={() => handleDemoSwitch('admin')}
          >
            Hostel Administrator
          </button>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <UtensilsCrossed size={24} />
            <span>HostelBite</span>
            <span className="nav-tagline">MUJ Food Delivery</span>
          </Link>

          {/* Center Links Based on Role */}
          <div className="nav-links">
            {user?.role === 'student' && (
              <>
                <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                  <span>Browse Outlets</span>
                </Link>
                <Link to="/orders" className={`nav-link ${location.pathname.startsWith('/orders') ? 'active' : ''}`}>
                  <Clock size={16} />
                  <span>My Orders</span>
                </Link>
                <Link to="/wallet" className={`nav-link ${location.pathname === '/wallet' ? 'active' : ''}`}>
                  <Wallet size={16} />
                  <span>Wallet (₹{user.wallet_balance?.toFixed(0)})</span>
                </Link>
              </>
            )}

            {user?.role === 'vendor' && (
              <>
                <Link to="/vendor" className={`nav-link ${location.pathname === '/vendor' ? 'active' : ''}`}>
                  <Layers size={16} />
                  <span>Order Board</span>
                </Link>
                <Link to="/vendor/menu" className={`nav-link ${location.pathname === '/vendor/menu' ? 'active' : ''}`}>
                  <UtensilsCrossed size={16} />
                  <span>Menu Items</span>
                </Link>
                <Link to="/vendor/reviews" className={`nav-link ${location.pathname === '/vendor/reviews' ? 'active' : ''}`}>
                  <CheckSquare size={16} />
                  <span>Reviews & Feedback</span>
                </Link>
              </>
            )}

            {user?.role === 'delivery' && (
              <>
                <Link to="/delivery" className={`nav-link ${location.pathname === '/delivery' ? 'active' : ''}`}>
                  <Bike size={16} />
                  <span>Delivery Task Board</span>
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                  <BarChart3 size={16} />
                  <span>Campus Analytics</span>
                </Link>
                <Link to="/admin/vendors" className={`nav-link ${location.pathname === '/admin/vendors' ? 'active' : ''}`}>
                  <ShieldCheck size={16} />
                  <span>Vendor Approvals</span>
                </Link>
                <Link to="/admin/complaints" className={`nav-link ${location.pathname === '/admin/complaints' ? 'active' : ''}`}>
                  <span>Disputes & Refunds</span>
                </Link>
                <Link to="/admin/users" className={`nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}>
                  <span>User Directory</span>
                </Link>
              </>
            )}
          </div>

          {/* Right Action Icons & Profile */}
          <div className="nav-user">
            {user ? (
              <>
                {/* Cart Icon for Student */}
                {user.role === 'student' && (
                  <Link
                    to="/cart"
                    className="btn btn-primary btn-sm"
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <ShoppingBag size={16} />
                    <span>Cart</span>
                    {itemCount > 0 && (
                      <span style={{
                        backgroundColor: '#ffffff',
                        color: 'var(--primary)',
                        borderRadius: '9999px',
                        padding: '0.1rem 0.4rem',
                        fontSize: '0.725rem',
                        fontWeight: 800
                      }}>
                        {itemCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Notifications Bell */}
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    position: 'relative',
                    padding: '0.4rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* User Role Pill */}
                <span className={`role-pill ${user.role}`}>
                  {user.role}
                </span>

                {/* Profile Link or Name */}
                <Link
                  to={user.role === 'student' ? '/profile' : '#'}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  <UserIcon size={16} />
                  <span>{user.name.split(' ')[0]}</span>
                </Link>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={logout}
                  title="Logout"
                  style={{ color: 'var(--text-muted)', padding: '0.4rem', display: 'flex', alignItems: 'center' }}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Notifications Drawer Modal */}
      {showNotifications && (
        <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', position: 'fixed', top: '70px', right: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Bell size={18} /> Notifications
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}
                  >
                    Mark all read
                  </button>
                )}
                <button type="button" onClick={() => setShowNotifications(false)} style={{ color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No notifications yet.
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '6px',
                      backgroundColor: n.is_read ? '#f8fafc' : '#eff6ff',
                      border: `1px solid ${n.is_read ? '#e2e8f0' : '#bfdbfe'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '0.85rem', color: n.is_read ? 'var(--text-main)' : '#1e40af' }}>
                        {n.title}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginTop: '0.2rem' }}>
                      {n.message}
                    </p>
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={() => setShowNotifications(false)}
                        style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-block', marginTop: '0.3rem' }}
                      >
                        View details &rarr;
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
