import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { MenuItem, Vendor } from '../../types';
import { Plus, Edit2, Trash2, Power, Search, Check, X } from 'lucide-react';

export const MenuManagementPage: React.FC = () => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState<string>('');
  const [itemPrice, setItemPrice] = useState<string>('');
  const [itemCategory, setItemCategory] = useState<string>('Main Course');
  const [itemDietary, setItemDietary] = useState<string>('Veg');
  const [itemDescription, setItemDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const vRes = await api.get<{ vendor: Vendor }>('/vendors/my/profile');
      setVendor(vRes.vendor);

      const mRes = await api.get<{ items: MenuItem[] }>(`/menu?vendorId=${vRes.vendor.id}`);
      setItems(mRes.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemPrice('');
    setItemCategory('Main Course');
    setItemDietary('Veg');
    setItemDescription('');
    setShowModal(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(String(item.price));
    setItemCategory(item.category || 'Main Course');
    setItemDietary(item.dietary_tag);
    setItemDescription(item.description || '');
    setShowModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: itemName.trim(),
        price: Number(itemPrice),
        category: itemCategory,
        dietaryTag: itemDietary,
        description: itemDescription.trim()
      };

      if (editingItem) {
        await api.put(`/menu/${editingItem.id}`, payload);
      } else {
        await api.post('/menu', payload);
      }

      setShowModal(false);
      await fetchMenu();
    } catch (err: any) {
      alert(err.message || 'Failed to save item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStock = async (itemId: string, currentAvail: number) => {
    try {
      const newAvail = currentAvail === 1 ? 0 : 1;
      await api.put(`/menu/${itemId}/availability`, { availability: newAvail });
      setItems(prev => prev.map(i => (i.id === itemId ? { ...i, availability: newAvail } : i)));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const confirmDel = window.confirm('Are you sure you want to delete this menu item?');
    if (!confirmDel) return;

    try {
      await api.delete(`/menu/${itemId}`);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete item.');
    }
  };

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.category && i.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Menu & Catalog Management</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {vendor?.business_name} &bull; {items.length} Total Culinary Offerings
          </span>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} /> Add New Dish
        </button>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Filter catalog by food title or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading catalog...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No dishes found. Click "Add New Dish" to introduce food items.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '0.75rem 1rem' }}>Diet</th>
                <th style={{ padding: '0.75rem 1rem' }}>Item Name & Category</th>
                <th style={{ padding: '0.75rem 1rem' }}>Price (₹)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Kitchen Stock</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${item.dietary_tag === 'Veg' ? 'badge-veg' : item.dietary_tag === 'Jain' ? 'badge-jain' : 'badge-nonveg'}`}>
                      {item.dietary_tag}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.category} {item.description ? `• ${item.description}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                    ₹{item.price.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStock(item.id, item.availability)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: item.availability ? '#dcfce7' : '#fee2e2',
                        color: item.availability ? '#166534' : '#b91c1c',
                        border: `1px solid ${item.availability ? '#86efac' : '#fca5a5'}`
                      }}
                    >
                      {item.availability ? 'In Stock (Active)' : 'Out of Stock (Hidden)'}
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEditModal(item)}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              {editingItem ? 'Edit Culinary Offering' : 'Add New Dish to Catalog'}
            </h3>

            <form onSubmit={handleSaveItem}>
              <div className="form-group">
                <label className="form-label">Dish Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Butter Paneer Kulcha"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    className="form-control"
                    required
                    placeholder="e.g. 110"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dietary Tag</label>
                  <select
                    className="form-control"
                    value={itemDietary}
                    onChange={(e) => setItemDietary(e.target.value)}
                  >
                    <option value="Veg">Vegetarian</option>
                    <option value="Non-Veg">Non-Vegetarian</option>
                    <option value="Jain">Jain Friendly</option>
                    <option value="Vegan">Vegan</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Menu Category</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Thali & Meals, Rolls, Fast Food, Beverages"
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description & Ingredients</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Describe preparation, portion size, and sides..."
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Dish'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
