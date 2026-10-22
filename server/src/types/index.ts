export type UserRole = 'student' | 'vendor' | 'delivery' | 'admin';

export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  password_hash?: string;
  role: UserRole;
  hostel_block?: string | null;
  floor?: string | null;
  room_number?: string | null;
  wallet_balance: number;
  status: UserStatus;
  created_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  cuisine_category: string;
  fssai_license: string;
  serviceable_blocks: string;
  delivery_time_window: string;
  minimum_order_value: number;
  accepting_orders: number; // 0 or 1
  is_mess: number; // 0 or 1
  status: 'approved' | 'pending' | 'rejected' | 'suspended';
  rating: number;
  total_reviews: number;
  created_at: string;
  owner_name?: string;
  owner_email?: string;
}

export type DietaryTag = 'Veg' | 'Non-Veg' | 'Vegan' | 'Jain';

export interface MenuItem {
  id: string;
  vendor_id: string;
  name: string;
  description?: string | null;
  price: number;
  dietary_tag: DietaryTag;
  availability: number; // 0 or 1
  category: string;
  is_new: number;
  is_popular: number;
  photo?: string | null;
  created_at: string;
  vendor_name?: string;
}

export type OrderStatus =
  | 'Payment Pending'
  | 'Placed'
  | 'Accepted'
  | 'Preparing'
  | 'Ready'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Disputed';

export interface Order {
  id: string;
  student_id: string;
  vendor_id: string;
  delivery_point: string;
  delivery_slot: string;
  subtotal: number;
  delivery_fee: number;
  platform_fee: number;
  total_amount: number;
  status: OrderStatus;
  special_instructions?: string | null;
  cancellation_reason?: string | null;
  order_date: string;
  updated_at: string;
  // Joins
  student_name?: string;
  student_email?: string;
  student_mobile?: string;
  student_block?: string;
  student_room?: string;
  vendor_name?: string;
  items?: OrderItem[];
  payment?: Payment;
  delivery_agent_id?: string;
  delivery_agent_name?: string;
  delivery_status?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  customization_notes?: string | null;
}

export type PaymentMethod = 'UPI' | 'Card' | 'Wallet' | 'Net Banking';
export type PaymentStatus = 'Pending' | 'Success' | 'Failed' | 'Refunded';

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id: string;
  payment_status: PaymentStatus;
  payment_date: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  order_id?: string | null;
  amount: number;
  transaction_type: 'Credit' | 'Debit';
  balance_after: number;
  description: string;
  transaction_date: string;
}

export interface DeliveryAssignment {
  id: string;
  order_id: string;
  agent_id: string;
  status: 'assigned' | 'picked_up' | 'delivered';
  assigned_at: string;
  delivered_at?: string | null;
  agent_name?: string;
}

export interface Complaint {
  id: string;
  order_id: string;
  student_id: string;
  vendor_id: string;
  issue_category: 'Food Quality' | 'Missing Item' | 'Spilled or Damaged' | 'Wrong Item' | 'Excessive Delay' | 'Other';
  description: string;
  status: 'Open' | 'Vendor Responded' | 'Escalated' | 'Resolved' | 'Dismissed';
  refund_amount: number;
  resolution_reason?: string | null;
  created_at: string;
  resolved_at?: string | null;
  student_name?: string;
  vendor_name?: string;
  order_total?: number;
}

export interface Review {
  id: string;
  order_id: string;
  student_id: string;
  vendor_id: string;
  rating: number;
  comment?: string | null;
  vendor_response?: string | null;
  created_at: string;
  response_at?: string | null;
  student_name?: string;
  vendor_name?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'order' | 'payment' | 'delivery' | 'alert';
  is_read: number;
  link?: string | null;
  created_at: string;
}

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  email: string;
  name: string;
}
