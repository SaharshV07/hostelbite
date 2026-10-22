import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Vendor, MenuItem, Order } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Search,
  Clock,
  Star,
  Plus,
  Check,
  Building2,
  ChefHat,
  Filter,
  ArrowRight,
  ShieldCheck,
  Flame
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addItem, items: cartItems } = useCart();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vendorRes, menuRes, ordersRes] = await Promise.all([
        api.get<{ vendors: Vendor[] }>('/vendors'),
        api.get<{ items: MenuItem[] }>('/menu'),
        api.get<{ orders: Order[] }>('/orders?limit=5')
      ]);

      setVendors(vendorRes.vendors);
      setPopularItems(menuRes.items.filter(item => item.is_popular || item.is_new));
      setActiveOrders(
        ordersRes.orders.filter(o =>
          ['Placed', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.status)
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.business_name.toLowerCase().includes(search.toLowerCase()) ||
                          v.cuisine_category.toLowerCase().includes(search.toLowerCase());
    if (selectedTag === 'Mess') return matchesSearch && v.is_mess === 1;
    if (selectedTag === 'South Indian') return matchesSearch && v.cuisine_category.includes('South Indian');
    if (selectedTag === 'Fast Food') return matchesSearch && v.cuisine_category.includes('Fast Food');
    return matchesSearch;
  });

  const filteredPopularItems = popularItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    if (selectedTag === 'Veg') return matchesSearch && item.dietary_tag === 'Veg';
    if (selectedTag === 'Non-Veg') return matchesSearch && item.dietary_tag === 'Non-Veg';
    if (selectedTag === 'Jain') return matchesSearch && item.dietary_tag === 'Jain';
    return matchesSearch;
  });

  return (
    <div className="container">
      {/* 1. Header & Delivery Point Display */}
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Welcome, {user?.name || 'Resident'}!
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            <Building2 size={16} color="var(--primary)" />
            <span>Delivering to: <strong>Hostel {user?.hostel_block || 'Campus'} - Room {user?.room_number || '304'}</strong></span>
            <Link to="/profile" style={{ color: 'var(--primary)', textDecoration: 'underline', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
              Change Room
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <div style={{
            backgroundColor: 'var(--primary-light)',
            border: '1px solid #fed7aa',
            borderRadius: '6px',
            padding: '0.4rem 0.8rem',
            textAlign: 'right'
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Hostel Wallet</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>₹{user?.wallet_balance?.toFixed(2) ?? '0.00'}</strong>
          </div>
          <Link to="/wallet" className="btn btn-primary btn-sm">
            Top Up
          </Link>
        </div>
      </div>

      {/* 2. Active Orders Banner (Real-time tracking shortcut) */}
      {activeOrders.length > 0 && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={24} color="#2563eb" />
            <div>
              <strong style={{ fontSize: '0.95rem', color: '#1e40af' }}>
                You have {activeOrders.length} active order{activeOrders.length > 1 ? 's' : ''} in progress!
              </strong>
              <div style={{ fontSize: '0.8rem', color: '#1e3a8a', display: 'flex', gap: '0.6rem', marginTop: '0.2rem' }}>
                <span>Order #{activeOrders[0].id}</span>
                <span>&bull;</span>
                <StatusBadge status={activeOrders[0].status} />
              </div>
            </div>
          </div>
          <Link to={`/orders/${activeOrders[0].id}`} className="btn btn-sm btn-primary">
            Track Live Status <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* 3. Search and Dietary Filter Bar */}
      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search mess thalis, rolls, dosas, beverages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {['All', 'Mess', 'Fast Food', 'South Indian', 'Veg', 'Jain', 'Non-Veg'].map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              style={{
                padding: '0.45rem 0.8rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: `1px solid ${selectedTag === tag ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: selectedTag === tag ? 'var(--primary)' : '#ffffff',
                color: selectedTag === tag ? '#ffffff' : 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Campus Mess & Food Outlets Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Campus Dining & Eateries</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filteredVendors.length} Outlets Available</span>
        </div>

        <div className="grid-3">
          {filteredVendors.map(vendor => (
            <div key={vendor.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{vendor.business_name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{vendor.cuisine_category}</span>
                  </div>
                  {vendor.is_mess === 1 ? (
                    <span style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      CENTRAL MESS
                    </span>
                  ) : (
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      CANTEEN
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.75rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#b45309', fontWeight: 700 }}>
                    <Star size={14} fill="#b45309" />
                    <span>{vendor.rating.toFixed(1)}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({vendor.total_reviews})</span>
                  </div>
                  <span>&bull;</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={14} />
                    <span>{vendor.delivery_time_window}</span>
                  </div>
                  <span>&bull;</span>
                  <span>Min ₹{vendor.minimum_order_value}</span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  <strong>Delivers to:</strong> {vendor.serviceable_blocks}
                </div>
              </div>

              <div>
                {!vendor.accepting_orders ? (
                  <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, borderRadius: '4px' }}>
                    Currently Busy (Not Accepting Orders)
                  </div>
                ) : (
                  <Link
                    to={`/vendor/${vendor.id}`}
                    className="btn btn-outline"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    View Menu & Order <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Popular & Recommended Food Items */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Flame size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Popular Student Favorites</h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily Fresh Offerings</span>
        </div>

        <div className="grid-3">
          {filteredPopularItems.map(item => {
            const inCart = cartItems.find(ci => ci.item.id === item.id);

            return (
              <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className={`badge ${item.dietary_tag === 'Veg' ? 'badge-veg' : item.dietary_tag === 'Jain' ? 'badge-jain' : 'badge-nonveg'}`}>
                      {item.dietary_tag}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.vendor_name}</span>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.4rem' }}>{item.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.4rem 0 0.8rem 0' }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    ₹{item.price.toFixed(2)}
                  </span>

                  {!item.availability ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>Out of Stock</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => addItem(item, 1)}
                    >
                      {inCart ? (
                        <>
                          <Check size={14} /> Added ({inCart.quantity})
                        </>
                      ) : (
                        <>
                          <Plus size={14} /> Add
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
