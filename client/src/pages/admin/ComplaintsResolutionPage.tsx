import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { AlertCircle, CheckCircle2, XCircle, RefreshCw, DollarSign } from 'lucide-react';

export const ComplaintsResolutionPage: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ complaints: any[] }>('/complaints');
      setComplaints(res.complaints);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async (complaintId: string, action: 'ResolveWithRefund' | 'Dismiss', defaultRefund = 0) => {
    let refundAmount = defaultRefund;

    if (action === 'ResolveWithRefund' && defaultRefund === 0) {
      const inputAmt = window.prompt('Enter refund amount (₹) to credit to student wallet:', '50');
      if (inputAmt === null) return;
      refundAmount = Number(inputAmt);
      if (isNaN(refundAmount) || refundAmount <= 0) {
        alert('Invalid refund amount.');
        return;
      }
    }

    const reason = window.prompt(
      `Enter mandatory administrative justification for ${action}:`,
      action === 'ResolveWithRefund' ? 'Approved wallet compensation for food quality issue' : 'Dispute audited and dismissed'
    );
    if (!reason) return;

    setActionLoading(complaintId);
    try {
      await api.post(`/complaints/${complaintId}/resolve`, {
        action,
        refundAmount,
        resolutionReason: reason
      });
      await fetchComplaints();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve complaint.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Student Dispute & Refund Resolution Center</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Investigate order quality disputes and authorize wallet refund adjustments (FR-CMP-04)
          </span>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={fetchComplaints}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading dispute cases...
        </div>
      ) : complaints.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No student complaints filed.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {complaints.map(c => (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <strong style={{ fontSize: '1rem' }}>Complaint #{c.id}</strong>
                    <StatusBadge status={c.status} />
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                      {c.issue_category}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    Order <strong>#{c.order_id}</strong> &bull; Outlet: <strong>{c.vendor_name}</strong> &bull; Total: ₹{Number(c.order_total || 0).toFixed(2)}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Complainant: <strong>{c.student_name}</strong> ({c.student_email}, {c.student_mobile}) &bull; Room: {c.student_block}-{c.student_room}
                  </div>
                </div>

                {/* Resolution Actions */}
                {['Open', 'Escalated'].includes(c.status) && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ backgroundColor: '#16a34a', color: '#fff' }}
                      disabled={actionLoading === c.id}
                      onClick={() => handleResolve(c.id, 'ResolveWithRefund', Number(c.order_total || 0))}
                    >
                      <CheckCircle2 size={14} /> Full Refund (₹{Number(c.order_total || 0).toFixed(0)})
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={actionLoading === c.id}
                      onClick={() => handleResolve(c.id, 'ResolveWithRefund', 0)}
                    >
                      <DollarSign size={14} /> Partial Refund
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={actionLoading === c.id}
                      onClick={() => handleResolve(c.id, 'Dismiss')}
                    >
                      <XCircle size={14} /> Dismiss
                    </button>
                  </div>
                )}
              </div>

              {/* Description Body */}
              <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '0.75rem', borderRadius: '6px', marginTop: '0.75rem', fontSize: '0.85rem', color: '#9a3412' }}>
                <strong>Student Grievance:</strong> "{c.description}"
              </div>

              {c.resolution_reason && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '6px', marginTop: '0.6rem', fontSize: '0.825rem', color: '#166534' }}>
                  <strong>Admin Resolution Record:</strong> {c.resolution_reason}
                  {c.refund_amount > 0 && (
                    <span style={{ display: 'block', fontWeight: 700, marginTop: '0.2rem' }}>
                      &bull; Amount Credited to Student Wallet: ₹{Number(c.refund_amount).toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
