import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useCart } from '../../context/CartContext';
import { Vendor, MenuItem, Review } from '../../types';
import { StarRating } from '../../components/StarRating';
import {
  Clock,
  Star,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Search,
  MessageSquare
} from 'lucide-react';

export const VendorMenuPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { items: cartItems, addItem, updateQuantity, subtotal, itemCount, vendorId: cartVendorId } = useCart();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const [vRes, mRes, rRes] = await Promise.all([
        api.get<{ vendor: Vendor }>(`/vendors/${id}`),
        api.get<{ items: MenuItem[] }>(`/menu?vendorId=${id}`),
        api.get<{ reviews: Review[] }>(`/reviews/vendor/${id}`)
      ]);

      setVendor(vRes.vendor);
      setMenuItems(mRes.items);
      setReviews(rRes.reviews);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchVendorData();
  }, [id]);

  if (loading || !vendor) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading menu & outlet details...</p>
      </div>
    );
  }

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    if (selectedTag === 'Veg') return matchesSearch && item.dietary_tag === 'Veg';
    if (selectedTag === 'Non-Veg') return matchesSearch && item.dietary_tag === 'Non-Veg';
    if (selectedTag === 'Jain') return matchesSearch && item.dietary_tag === 'Jain';
    if (selectedTag === 'Vegan') return matchesSearch && item.dietary_tag === 'Vegan';
    return matchesSearch;
  });

  // Group items by category
  const categories = Array.from(new Set(filteredItems.map(i => i.category || 'Other')));

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      {/* 1. Vendor Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{vendor.business_name}</h2>
              {vendor.is_mess === 1 && (
                <span style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  CENTRAL HOSTEL MESS
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {vendor.cuisine_category} &bull; Serviceable Blocks: {vendor.serviceable_blocks}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontSize: '0.75rem', marginTop: '0.4rem' }}>
              <ShieldCheck size={14} color="#16a34a" />
              <span>FSSAI Lic. #{vendor.fssai_license} (Verified Campus Food Operator)</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '1.2rem', fontWeight: 800, color: '#b45309' }}>
              <Star size={20} fill="#b45309" />
              <span>{vendor.rating.toFixed(1)}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{vendor.total_reviews} verified reviews</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Delivery Time</span>
            <strong>{vendor.delivery_time_window}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Minimum Order</span>
            <strong>₹{vendor.minimum_order_value}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Operating Status</span>
            <strong style={{ color: vendor.accepting_orders ? '#16a34a' : '#dc2626' }}>
              {vendor.accepting_orders ? 'Open & Taking Orders' : 'Temporarily Closed / Busy'}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Menu Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.4rem' }}
            placeholder={`Search dishes in ${vendor.business_name}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['All', 'Veg', 'Non-Veg', 'Jain', 'Vegan'].map(tag => (
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

      {/* 3. Categorized Menu Item List */}
      {categories.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          No menu items found matching the selected filters.
        </div>
      ) : (
        categories.map(category => {
          const categoryItems = filteredItems.filter(i => (i.category || 'Other') === category);

          return (
            <div key={category} style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.8rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.4rem' }}>
                {category} ({categoryItems.length})
              </h3>

              <div className="grid-2">
                {categoryItems.map(item => {
                  const inCart = cartItems.find(ci => ci.item.id === item.id);

                  return (
                    <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span className={`badge ${item.dietary_tag === 'Veg' ? 'badge-veg' : item.dietary_tag === 'Jain' ? 'badge-jain' : 'badge-nonveg'}`}>
                            {item.dietary_tag}
                          </span>
                          {item.is_new === 1 && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', backgroundColor: '#dbeafe', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              NEW
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.4rem' }}>{item.name}</h4>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.3rem 0 0.8rem 0' }}>
                          {item.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          ₹{item.price.toFixed(2)}
                        </span>

                        {!item.availability ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>Out of Stock</span>
                        ) : inCart ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, inCart.quantity - 1)}
                              style={{ color: 'var(--primary)', fontWeight: 700, padding: '0 0.2rem' }}
                            >
                              <Minus size={14} />
                            </button>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>{inCart.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, inCart.quantity + 1)}
                              style={{ color: 'var(--primary)', fontWeight: 700, padding: '0 0.2rem' }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={!vendor.accepting_orders}
                            onClick={() => addItem(item, 1)}
                          >
                            <Plus size={14} /> Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* 4. Customer Reviews Section */}
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={20} /> Verified Student Reviews ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No customer reviews yet for this outlet. Be the first to order and leave feedback!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map(rev => (
              <div key={rev.id} className="card" style={{ backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{rev.student_name || 'Resident'}</strong>
                    <StarRating rating={rev.rating} size={14} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', margin: '0.4rem 0' }}>
                  {rev.comment || 'Rated without written comment.'}
                </p>

                {rev.vendor_response && (
                  <div style={{
                    marginTop: '0.6rem',
                    padding: '0.6rem 0.8rem',
                    backgroundColor: '#f8fafc',
                    borderLeft: '3px solid var(--primary)',
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                  }}>
                    <strong style={{ color: 'var(--primary)', display: 'block', fontSize: '0.75rem' }}>Outlet Response:</strong>
                    <span>{rev.vendor_response}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Sticky Bottom Cart Bar */}
      {cartVendorId === vendor.id && itemCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '560px',
          width: '90%',
          backgroundColor: '#1e293b',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{itemCount} item{itemCount > 1 ? 's' : ''} in cart</div>
            <strong style={{ fontSize: '1.2rem', color: '#ffffff' }}>₹{subtotal.toFixed(2)}</strong>
            <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: '0.4rem' }}>+ ₹20 delivery & fee</span>
          </div>
          <Link
            to="/cart"
            className="btn btn-primary"
            style={{ fontWeight: 700, padding: '0.6rem 1.2rem' }}
          >
            <span>Review & Pay</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
};
