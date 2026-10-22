-- HostelBite Relational Database Schema
-- Implements entities from Experiment 4 (Class Diagram) and Experiment 3 (ER Diagram)

PRAGMA foreign_keys = ON;

-- 1. Users table (Students, Vendors, Delivery Agents, Administrators)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'vendor', 'delivery', 'admin')),
    hostel_block TEXT,
    floor TEXT,
    room_number TEXT,
    wallet_balance REAL NOT NULL DEFAULT 0.0 CHECK(wallet_balance >= 0 AND wallet_balance <= 5000.0),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'pending')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vendors table (Mess facilities & Campus eateries)
CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    cuisine_category TEXT NOT NULL,
    fssai_license TEXT NOT NULL,
    serviceable_blocks TEXT NOT NULL DEFAULT 'All Blocks (B1-B5, G1-G3)',
    delivery_time_window TEXT NOT NULL DEFAULT '25-35 mins',
    minimum_order_value REAL NOT NULL DEFAULT 50.0,
    accepting_orders INTEGER NOT NULL DEFAULT 1 CHECK(accepting_orders IN (0, 1)),
    is_mess INTEGER NOT NULL DEFAULT 0 CHECK(is_mess IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('approved', 'pending', 'rejected', 'suspended')),
    rating REAL NOT NULL DEFAULT 4.5,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Menu Items table
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL CHECK(price >= 0),
    dietary_tag TEXT NOT NULL CHECK(dietary_tag IN ('Veg', 'Non-Veg', 'Vegan', 'Jain')),
    availability INTEGER NOT NULL DEFAULT 1 CHECK(availability IN (0, 1)),
    category TEXT NOT NULL DEFAULT 'Main Course',
    is_new INTEGER NOT NULL DEFAULT 0 CHECK(is_new IN (0, 1)),
    is_popular INTEGER NOT NULL DEFAULT 0 CHECK(is_popular IN (0, 1)),
    photo TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id),
    vendor_id TEXT NOT NULL REFERENCES vendors(id),
    delivery_point TEXT NOT NULL,
    delivery_slot TEXT NOT NULL DEFAULT 'Immediate',
    subtotal REAL NOT NULL,
    delivery_fee REAL NOT NULL DEFAULT 15.0,
    platform_fee REAL NOT NULL DEFAULT 5.0,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN (
        'Payment Pending',
        'Placed',
        'Accepted',
        'Preparing',
        'Ready',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Disputed'
    )),
    special_instructions TEXT,
    cancellation_reason TEXT,
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Order Items table (Composition relationship with Order)
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES menu_items(id),
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price REAL NOT NULL CHECK(unit_price >= 0),
    subtotal REAL NOT NULL,
    customization_notes TEXT
);

-- 6. Payments table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('UPI', 'Card', 'Wallet', 'Net Banking')),
    transaction_id TEXT NOT NULL UNIQUE,
    payment_status TEXT NOT NULL CHECK(payment_status IN ('Pending', 'Success', 'Failed', 'Refunded')),
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Wallet Transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES orders(id),
    amount REAL NOT NULL,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('Credit', 'Debit')),
    balance_after REAL NOT NULL,
    description TEXT NOT NULL,
    transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Delivery Assignments table
CREATE TABLE IF NOT EXISTS delivery_assignments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'assigned' CHECK(status IN ('assigned', 'picked_up', 'delivered')),
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at DATETIME
);

-- 9. Complaints table (at most 1 per order)
CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id),
    vendor_id TEXT NOT NULL REFERENCES vendors(id),
    issue_category TEXT NOT NULL CHECK(issue_category IN (
        'Food Quality',
        'Missing Item',
        'Spilled or Damaged',
        'Wrong Item',
        'Excessive Delay',
        'Other'
    )),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'Vendor Responded', 'Escalated', 'Resolved', 'Dismissed')),
    refund_amount REAL NOT NULL DEFAULT 0.0,
    resolution_reason TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
);

-- 10. Reviews table (at most 1 per delivered order)
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id),
    vendor_id TEXT NOT NULL REFERENCES vendors(id),
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    vendor_response TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_at DATETIME
);

-- 11. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'order', 'payment', 'delivery', 'alert')),
    is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0, 1)),
    link TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rapid lookup under high student traffic
CREATE INDEX IF NOT EXISTS idx_orders_student ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_menu_vendor ON menu_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_transactions(user_id);
