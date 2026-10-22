import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { WalletTransaction } from '../../types';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, ShieldCheck, AlertCircle } from 'lucide-react';

export const WalletPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [topupAmount, setTopupAmount] = useState<number>(250);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      const res = await api.get<{ transactions: WalletTransaction[]; currentBalance: number }>('/wallet/transactions');
      setTransactions(res.transactions);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleTopup = async (amount: number) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post<{ newBalance: number; transactionId: string }>('/wallet/topup', {
        amount
      });
      setMessage(`Successfully credited ₹${amount.toFixed(2)} to your HostelBite wallet!`);
      await refreshProfile();
      await fetchTransactions();
    } catch (err: any) {
      setError(err.message || 'Top-up failed.');
    } finally {
      setLoading(false);
    }
  };

  const balance = user?.wallet_balance ?? 0;

  return (
    <div className="container" style={{ maxWidth: '850px' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem' }}>
        Prepaid Hostel Wallet
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Instant cashless food ordering and seamless one-click dispute refunds
      </p>

      {message && (
        <div style={{ padding: '0.85rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ padding: '0.85rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      {/* Balance Card & Quick Top-Up */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Balance Card */}
        <div className="card" style={{ backgroundColor: '#1e293b', color: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Hostel Prepaid Balance</span>
              <Wallet size={20} color="#f97316" />
            </div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0.75rem 0' }}>
              ₹{balance.toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, borderTop: '1px solid #334155', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>RBI PPI Max Cap</span>
              <span>₹5,000.00</span>
            </div>
          </div>
        </div>

        {/* Quick Top-Up Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.8rem' }}>
            Quick Simulated Top-Up
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Select an amount to test wallet crediting:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginBottom: '1rem' }}>
            {[100, 250, 500, 1000].map(amt => (
              <button
                key={amt}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setTopupAmount(amt)}
                style={{
                  border: `2px solid ${topupAmount === amt ? 'var(--primary)' : 'var(--border)'}`,
                  color: topupAmount === amt ? 'var(--primary)' : 'inherit',
                  fontWeight: 700
                }}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={() => handleTopup(topupAmount)}
            style={{ width: '100%', padding: '0.65rem' }}
          >
            <Plus size={16} /> Add ₹{topupAmount} to Wallet
          </button>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Wallet Transaction Ledger
        </h3>

        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No wallet transactions recorded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {transactions.map(tx => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    padding: '0.4rem',
                    borderRadius: '50%',
                    backgroundColor: tx.transaction_type === 'Credit' ? '#dcfce7' : '#fee2e2',
                    color: tx.transaction_type === 'Credit' ? '#166534' : '#b91c1c'
                  }}>
                    {tx.transaction_type === 'Credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{tx.description}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(tx.transaction_date).toLocaleString()} &bull; Balance after: ₹{tx.balance_after.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: tx.transaction_type === 'Credit' ? '#166534' : '#b91c1c'
                }}>
                  {tx.transaction_type === 'Credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
