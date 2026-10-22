import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export const VendorApprovalsPage: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ vendors: any[] }>('/admin/vendors');
      setVendors(res.vendors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleAction = async (vendorId: string, action: 'approve' | 'reject' | 'suspend' | 'activate') => {
    const comments = window.prompt(`Enter administration comment/justification for ${action}:`, 'Administrative verification');
    if (comments === null) return;

    setActionLoading(vendorId);
    try {
      await api.post(`/admin/vendors/${vendorId}/action`, { action, comments });
      await fetchVendors();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Vendor & Mess Outlets Governance</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Approve onboarding applications, verify FSSAI credentials, and manage outlet status
          </span>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={fetchVendors}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading vendor dossiers...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {vendors.map(v => (
            <div key={v.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{v.business_name}</h3>
                    <StatusBadge status={v.status} />
                    {v.is_mess === 1 && (
                      <span style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        CENTRAL MESS
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Operator: <strong>{v.owner_name}</strong> ({v.owner_email}) &bull; Category: {v.cuisine_category}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <ShieldCheck size={14} />
                    <span>FSSAI License: <strong>{v.fssai_license}</strong></span>
                  </div>
                </div>

                {/* Administrative Controls */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {v.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ backgroundColor: '#16a34a', color: '#fff' }}
                        disabled={actionLoading === v.id}
                        onClick={() => handleAction(v.id, 'approve')}
                      >
                        <CheckCircle2 size={14} /> Approve Outlet
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={actionLoading === v.id}
                        onClick={() => handleAction(v.id, 'reject')}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}

                  {v.status === 'approved' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#dc2626', border: '1px solid #fca5a5' }}
                      disabled={actionLoading === v.id}
                      onClick={() => handleAction(v.id, 'suspend')}
                    >
                      <AlertTriangle size={14} /> Suspend Listing
                    </button>
                  )}

                  {v.status === 'suspended' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={actionLoading === v.id}
                      onClick={() => handleAction(v.id, 'activate')}
                    >
                      <CheckCircle2 size={14} /> Reactivate Outlet
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
