import React from 'react';
import { OrderStatus } from '../types';
import { CheckCircle2, Clock, Utensils, Package, Bike, Home, AlertCircle, XCircle } from 'lucide-react';

interface OrderStepperProps {
  status: OrderStatus;
}

const STAGES: { key: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { key: 'Placed', label: 'Order Placed', icon: <Clock size={16} /> },
  { key: 'Accepted', label: 'Accepted', icon: <CheckCircle2 size={16} /> },
  { key: 'Preparing', label: 'Kitchen Prep', icon: <Utensils size={16} /> },
  { key: 'Ready', label: 'Ready for Pickup', icon: <Package size={16} /> },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: <Bike size={16} /> },
  { key: 'Delivered', label: 'Delivered', icon: <Home size={16} /> }
];

export const OrderStepper: React.FC<OrderStepperProps> = ({ status }) => {
  if (status === 'Cancelled') {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fee2e2',
        border: '1px solid #fca5a5',
        borderRadius: '8px',
        color: '#b91c1c',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        margin: '1rem 0'
      }}>
        <XCircle size={20} />
        <div>
          <strong>Order Cancelled</strong>
          <p style={{ fontSize: '0.825rem' }}>This order was cancelled. Any paid amount was automatically refunded to your in-app hostel wallet.</p>
        </div>
      </div>
    );
  }

  if (status === 'Disputed') {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#ffedd5',
        border: '1px solid #fdba74',
        borderRadius: '8px',
        color: '#9a3412',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        margin: '1rem 0'
      }}>
        <AlertCircle size={20} />
        <div>
          <strong>Order Under Dispute Resolution</strong>
          <p style={{ fontSize: '0.825rem' }}>A complaint has been filed and is currently being audited by the kitchen supervisor and Hostel Administrator.</p>
        </div>
      </div>
    );
  }

  if (status === 'Payment Pending') {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fff7ed',
        border: '1px solid #ffedd5',
        borderRadius: '8px',
        color: '#c2410c',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        margin: '1rem 0'
      }}>
        <Clock size={20} />
        <div>
          <strong>Payment Pending Confirmation</strong>
          <p style={{ fontSize: '0.825rem' }}>Please complete checkout payment to send this ticket to the kitchen queue.</p>
        </div>
      </div>
    );
  }

  const stageOrder = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];
  const currentIndex = stageOrder.indexOf(status);

  return (
    <div className="stepper">
      {STAGES.map((stage, idx) => {
        const isCompleted = currentIndex > idx;
        const isActive = currentIndex === idx;

        let statusClass = 'step-item';
        if (isCompleted) statusClass += ' completed';
        if (isActive) statusClass += ' active';

        return (
          <div key={stage.key} className={statusClass}>
            <div className="step-icon">
              {stage.icon}
            </div>
            <span className="step-label">{stage.label}</span>
          </div>
        );
      })}
    </div>
  );
};
