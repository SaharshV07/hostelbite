import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CreditCard, QrCode, Wallet, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SimulatedPaymentModalProps {
  orderId: string;
  totalAmount: number;
  onPaymentSuccess: (order: any) => void;
  onPaymentFailure: (errorMsg: string) => void;
  onClose: () => void;
}

export const SimulatedPaymentModal: React.FC<SimulatedPaymentModalProps> = ({
  orderId,
  totalAmount,
  onPaymentSuccess,
  onPaymentFailure,
  onClose
}) => {
  const { user, refreshProfile } = useAuth();
  const [method, setMethod] = useState<'UPI' | 'Card' | 'Wallet'>('UPI');
  const [upiVpa, setUpiVpa] = useState<string>('student@okhdfcbank');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const walletBalance = user?.wallet_balance ?? 0;
  const hasSufficientWallet = walletBalance >= totalAmount;

  const handleSimulatePayment = async (shouldSucceed: boolean) => {
    setLoading(true);
    setError(null);

    try {
      if (method === 'Wallet') {
        if (!hasSufficientWallet) {
          setError(`Insufficient balance. Current wallet balance is ₹${walletBalance.toFixed(2)}, but order total is ₹${totalAmount.toFixed(2)}.`);
          setLoading(false);
          return;
        }

        const res = await api.post<{ order: any; walletBalance: number }>('/payments/wallet', {
          orderId
        });

        await refreshProfile();
        onPaymentSuccess(res.order);
      } else {
        const res = await api.post<{ order: any }>('/payments/process', {
          orderId,
          paymentMethod: method,
          simulateSuccess: shouldSucceed
        });

        await refreshProfile();
        onPaymentSuccess(res.order);
      }
    } catch (err: any) {
      const msg = err.message || 'Payment simulation failed.';
      setError(msg);
      if (!shouldSucceed) {
        onPaymentFailure(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        {/* Banner */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '6px',
          padding: '0.6rem 0.8rem',
          fontSize: '0.75rem',
          color: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <AlertCircle size={16} />
          <span><strong>ACADEMIC DEMO GATEWAY:</strong> Simulated sandbox testing environment. No real money or bank accounts are touched.</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Complete Order Payment</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Order #{orderId}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Grand Total</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            color: '#b91c1c',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Method Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setMethod('UPI')}
            style={{
              padding: '0.6rem 0.4rem',
              border: `2px solid ${method === 'UPI' ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: '6px',
              backgroundColor: method === 'UPI' ? 'var(--primary-light)' : '#ffffff',
              color: method === 'UPI' ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <QrCode size={18} />
            <span>UPI / QR</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('Card')}
            style={{
              padding: '0.6rem 0.4rem',
              border: `2px solid ${method === 'Card' ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: '6px',
              backgroundColor: method === 'Card' ? 'var(--primary-light)' : '#ffffff',
              color: method === 'Card' ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <CreditCard size={18} />
            <span>Debit / Card</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('Wallet')}
            style={{
              padding: '0.6rem 0.4rem',
              border: `2px solid ${method === 'Wallet' ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: '6px',
              backgroundColor: method === 'Wallet' ? 'var(--primary-light)' : '#ffffff',
              color: method === 'Wallet' ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Wallet size={18} />
            <span>Hostel Wallet</span>
          </button>
        </div>

        {/* Tab Specific Content */}
        {method === 'UPI' && (
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Simulated Virtual Payment Address (VPA)</label>
            <input
              type="text"
              className="form-control"
              value={upiVpa}
              onChange={(e) => setUpiVpa(e.target.value)}
              placeholder="e.g. rollnumber@okaxis"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
              Simulates UPI intent / collect request verification.
            </span>
          </div>
        )}

        {method === 'Card' && (
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Demo Card Details</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              Card: •••• •••• •••• 4242 &nbsp;|&nbsp; Exp: 12/28 &nbsp;|&nbsp; CVV: •••
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'block' }}>
              Tokenized simulated transaction. No PCI DSS scope required.
            </span>
          </div>
        )}

        {method === 'Wallet' && (
          <div style={{
            backgroundColor: hasSufficientWallet ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${hasSufficientWallet ? '#bbf7d0' : '#fca5a5'}`,
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Available Wallet Balance</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: hasSufficientWallet ? '#166534' : '#b91c1c' }}>
                  ₹{walletBalance.toFixed(2)}
                </div>
              </div>
              <div>
                {hasSufficientWallet ? (
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', backgroundColor: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    Sufficient Funds
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b91c1c', backgroundColor: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    Insufficient Balance
                  </span>
                )}
              </div>
            </div>
            {!hasSufficientWallet && (
              <p style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.5rem' }}>
                Please choose UPI/Card, or go to the Wallet tab to add money.
              </p>
            )}
          </div>
        )}

        {/* Action Controls for Testing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {method === 'Wallet' ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading || !hasSufficientWallet}
              onClick={() => handleSimulatePayment(true)}
              style={{ padding: '0.75rem' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
              <span>Pay ₹{totalAmount.toFixed(2)} from Wallet</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn"
                disabled={loading}
                onClick={() => handleSimulatePayment(true)}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  padding: '0.75rem',
                  fontWeight: 600
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                <span>Simulate Successful Payment (Test Pass)</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => handleSimulatePayment(false)}
                style={{
                  border: '1px solid #f87171',
                  color: '#dc2626',
                  padding: '0.6rem',
                  fontSize: '0.85rem'
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                <span>Simulate Failed Payment (Test Error Handling)</span>
              </button>
            </>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            disabled={loading}
            onClick={onClose}
            style={{ marginTop: '0.25rem' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
