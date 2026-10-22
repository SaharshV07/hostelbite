import React from 'react';
import { OrderStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bg = '#f1f5f9';
  let color = '#475569';
  let border = '#cbd5e1';

  switch (status) {
    case 'Payment Pending':
      bg = '#fff7ed';
      color = '#c2410c';
      border = '#ffedd5';
      break;
    case 'Placed':
      bg = '#eff6ff';
      color = '#1d4ed8';
      border = '#dbeafe';
      break;
    case 'Accepted':
      bg = '#f0fdf4';
      color = '#15803d';
      border = '#bbf7d0';
      break;
    case 'Preparing':
      bg = '#fefce8';
      color = '#a16207';
      border = '#fef08a';
      break;
    case 'Ready':
      bg = '#fae8ff';
      color = '#86198f';
      border = '#f5d0fe';
      break;
    case 'Out for Delivery':
      bg = '#e0f2fe';
      color = '#0369a1';
      border = '#bae6fd';
      break;
    case 'Delivered':
      bg = '#dcfce7';
      color = '#166534';
      border = '#86efac';
      break;
    case 'Cancelled':
      bg = '#fee2e2';
      color = '#b91c1c';
      border = '#fca5a5';
      break;
    case 'Disputed':
      bg = '#ffedd5';
      color = '#9a3412';
      border = '#fdba74';
      break;
    case 'approved':
    case 'active':
    case 'Success':
      bg = '#dcfce7';
      color = '#166534';
      border = '#86efac';
      break;
    case 'pending':
    case 'Open':
      bg = '#fef3c7';
      color = '#92400e';
      border = '#fde68a';
      break;
    case 'rejected':
    case 'suspended':
    case 'Failed':
      bg = '#fee2e2';
      color = '#b91c1c';
      border = '#fca5a5';
      break;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.55rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap'
      }}
    >
      {status}
    </span>
  );
};
