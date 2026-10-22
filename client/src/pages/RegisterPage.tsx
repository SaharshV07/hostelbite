import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { UtensilsCrossed, Building2, Store, UserCheck, ShieldCheck, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'student' | 'vendor'>('student');

  // Student Fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [hostelBlock, setHostelBlock] = useState<string>('B2');
  const [floor, setFloor] = useState<string>('3rd Floor');
  const [roomNumber, setRoomNumber] = useState<string>('304');

  // Vendor Fields
  const [businessName, setBusinessName] = useState<string>('');
  const [cuisineCategory, setCuisineCategory] = useState<string>('North Indian & Chinese');
  const [fssaiLicense, setFssaiLicense] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (role === 'student') {
        await register({
          name,
          email,
          mobile,
          password,
          role: 'student',
          hostelBlock,
          floor,
          roomNumber
        });
        navigate('/');
      } else {
        // Register vendor user account first
        await register({
          name,
          email,
          mobile,
          password,
          role: 'vendor'
        });

        // Submit vendor application
        await api.post('/vendors/onboard', {
          businessName,
          cuisineCategory,
          fssaiLicense,
          serviceableBlocks: 'All Blocks (B1-B5, G1-G3)',
          deliveryTimeWindow: '25-35 mins',
          minimumOrderValue: 50.0
        });

        alert('Vendor application submitted! Your account is created and pending Administrator approval.');
        navigate('/vendor');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '520px', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Create HostelBite Account</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Join the digitized hostel dining platform at Manipal University Jaipur
        </p>
      </div>

      {/* Role Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => setRole('student')}
          style={{
            padding: '0.6rem',
            borderRadius: '6px',
            border: `2px solid ${role === 'student' ? 'var(--primary)' : 'var(--border)'}`,
            backgroundColor: role === 'student' ? 'var(--primary-light)' : '#ffffff',
            color: role === 'student' ? 'var(--primary)' : 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem'
          }}
        >
          <Building2 size={16} /> Student / Resident
        </button>

        <button
          type="button"
          onClick={() => setRole('vendor')}
          style={{
            padding: '0.6rem',
            borderRadius: '6px',
            border: `2px solid ${role === 'vendor' ? 'var(--primary)' : 'var(--border)'}`,
            backgroundColor: role === 'vendor' ? 'var(--primary-light)' : '#ffffff',
            color: role === 'vendor' ? 'var(--primary)' : 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem'
          }}
        >
          <Store size={16} /> Campus Food Vendor
        </button>
      </div>

      <div className="card">
        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{role === 'student' ? 'Full Name' : 'Operator / Manager Name'}</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Saharsh Lal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div className="form-group">
              <label className="form-label">University Email</label>
              <input
                type="email"
                className="form-control"
                required
                placeholder="name@muj.manipal.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                className="form-control"
                required
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Student Hostel Residence Information */}
          {role === 'student' && (
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--primary)' }}>
                Hostel Room Delivery Address
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                <div className="form-group">
                  <label className="form-label">Block</label>
                  <select className="form-control" value={hostelBlock} onChange={(e) => setHostelBlock(e.target.value)}>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="B3">B3</option>
                    <option value="B4">B4</option>
                    <option value="B5">B5</option>
                    <option value="G1">G1</option>
                    <option value="G2">G2</option>
                    <option value="G3">G3</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Floor</label>
                  <select className="form-control" value={floor} onChange={(e) => setFloor(e.target.value)}>
                    <option value="Ground">Ground</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="4th Floor">4th Floor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Room No.</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="304"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Vendor Specific Information */}
          {role === 'vendor' && (
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--primary)' }}>
                Food Outlet Application Details
              </h4>

              <div className="form-group">
                <label className="form-label">Outlet / Business Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Campus Roll & Shawarma Corner"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label className="form-label">Cuisine Category</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Fast Food, Rolls, Snacks"
                    value={cuisineCategory}
                    onChange={(e) => setCuisineCategory(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">FSSAI License Number</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="14-digit FSSAI number"
                    value={fssaiLicense}
                    onChange={(e) => setFssaiLicense(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={16} color="#16a34a" />
            <span>Development Mode: Phone and university email simulated OTP verified automatically.</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading ? 'Creating Account...' : role === 'student' ? 'Complete Student Registration' : 'Submit Vendor Application'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.25rem', paddingTop: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
