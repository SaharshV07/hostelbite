import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, User, Phone, Mail, CheckCircle2 } from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState<string>(user?.name || '');
  const [mobile, setMobile] = useState<string>(user?.mobile || '');
  const [hostelBlock, setHostelBlock] = useState<string>(user?.hostel_block || 'B2');
  const [floor, setFloor] = useState<string>(user?.floor || '3rd Floor');
  const [roomNumber, setRoomNumber] = useState<string>(user?.room_number || '304');
  const [loading, setLoading] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      await updateProfile({
        name,
        mobile,
        hostel_block: hostelBlock,
        floor,
        room_number: roomNumber
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem' }}>
        Student Profile & Delivery Address
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Your default hostel block and room information used for room-level food deliveries
      </p>

      {saved && (
        <div style={{
          padding: '0.85rem',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          color: '#166534',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={18} />
          <span>Profile and delivery address updated successfully!</span>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">University Email</label>
            <input
              type="email"
              className="form-control"
              value={user?.email || ''}
              disabled
              style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered student university ID.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Contact Mobile Number</label>
            <input
              type="tel"
              className="form-control"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={16} color="var(--primary)" /> Hostel Residence Details
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
              <div className="form-group">
                <label className="form-label">Hostel Block</label>
                <select
                  className="form-control"
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                >
                  <option value="B1">Block B1</option>
                  <option value="B2">Block B2</option>
                  <option value="B3">Block B3</option>
                  <option value="B4">Block B4</option>
                  <option value="B5">Block B5</option>
                  <option value="G1">Block G1</option>
                  <option value="G2">Block G2</option>
                  <option value="G3">Block G3</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Floor</label>
                <select
                  className="form-control"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="1st Floor">1st Floor</option>
                  <option value="2nd Floor">2nd Floor</option>
                  <option value="3rd Floor">3rd Floor</option>
                  <option value="4th Floor">4th Floor</option>
                  <option value="5th Floor">5th Floor</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 304"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Saving Changes...' : 'Save Profile Details'}
          </button>
        </form>
      </div>
    </div>
  );
};
