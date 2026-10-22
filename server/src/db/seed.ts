import bcrypt from 'bcryptjs';
import { db } from '../config/database';

export function runSeed(): void {
  console.log('--- Initializing Database Schema ---');
  db.initSchema();

  console.log('--- Clearing Existing Data ---');
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM reviews;
    DELETE FROM complaints;
    DELETE FROM delivery_assignments;
    DELETE FROM wallet_transactions;
    DELETE FROM payments;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM menu_items;
    DELETE FROM vendors;
    DELETE FROM users;
  `);
  db.exec('PRAGMA foreign_keys = ON;');

  console.log('--- Seeding Demo Users ---');
  const studentPassword = bcrypt.hashSync('Student@123', 10);
  const vendorPassword = bcrypt.hashSync('Mess@123', 10);
  const canteenPassword = bcrypt.hashSync('Vendor@123', 10);
  const deliveryPassword = bcrypt.hashSync('Delivery@123', 10);
  const adminPassword = bcrypt.hashSync('Admin@123', 10);

  // Users
  const users = [
    {
      id: 'usr_student_1',
      name: 'Saharsh Lal',
      email: 'student@muj.manipal.edu',
      mobile: '9876543210',
      password_hash: studentPassword,
      role: 'student',
      hostel_block: 'B2',
      floor: '3rd Floor',
      room_number: '304',
      wallet_balance: 1250.0,
      status: 'active'
    },
    {
      id: 'usr_student_2',
      name: 'Vaibhav Kumar',
      email: 'vaibhav@muj.manipal.edu',
      mobile: '9876543211',
      password_hash: studentPassword,
      role: 'student',
      hostel_block: 'B4',
      floor: '2nd Floor',
      room_number: '215',
      wallet_balance: 850.0,
      status: 'active'
    },
    {
      id: 'usr_vendor_mess',
      name: 'Hostel Mess Supervisor',
      email: 'mess@muj.manipal.edu',
      mobile: '9876543220',
      password_hash: vendorPassword,
      role: 'vendor',
      hostel_block: 'Central Dining',
      floor: 'Ground Floor',
      room_number: 'Mess Office',
      wallet_balance: 0.0,
      status: 'active'
    },
    {
      id: 'usr_vendor_munchbox',
      name: 'Rohan Sharma',
      email: 'munchbox@muj.manipal.edu',
      mobile: '9876543221',
      password_hash: canteenPassword,
      role: 'vendor',
      hostel_block: 'Food Court 1',
      floor: 'Ground Floor',
      room_number: 'Shop 04',
      wallet_balance: 0.0,
      status: 'active'
    },
    {
      id: 'usr_vendor_southern',
      name: 'Priya Nair',
      email: 'southern@muj.manipal.edu',
      mobile: '9876543222',
      password_hash: canteenPassword,
      role: 'vendor',
      hostel_block: 'Food Court 2',
      floor: 'Ground Floor',
      room_number: 'Shop 11',
      wallet_balance: 0.0,
      status: 'active'
    },
    {
      id: 'usr_delivery_1',
      name: 'Arjun Singh',
      email: 'delivery@muj.manipal.edu',
      mobile: '9876543230',
      password_hash: deliveryPassword,
      role: 'delivery',
      hostel_block: 'Hostel Gate Security Post',
      floor: 'Ground',
      room_number: 'Dispatch Bay',
      wallet_balance: 0.0,
      status: 'active'
    },
    {
      id: 'usr_admin_1',
      name: 'Chief Warden Office',
      email: 'admin@muj.manipal.edu',
      mobile: '9876543200',
      password_hash: adminPassword,
      role: 'admin',
      hostel_block: 'Administrative Block',
      floor: '1st Floor',
      room_number: 'Room 102',
      wallet_balance: 0.0,
      status: 'active'
    }
  ];

  for (const u of users) {
    db.execute(
      `INSERT INTO users (id, name, email, mobile, password_hash, role, hostel_block, floor, room_number, wallet_balance, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, u.mobile, u.password_hash, u.role, u.hostel_block, u.floor, u.room_number, u.wallet_balance, u.status]
    );
  }

  console.log('--- Seeding Vendors ---');
  const vendors = [
    {
      id: 'ven_central_mess',
      user_id: 'usr_vendor_mess',
      business_name: 'MUJ Central Hostel Mess',
      cuisine_category: 'North & South Indian Meals',
      fssai_license: '10020011000123',
      serviceable_blocks: 'All Blocks (B1-B5, G1-G3)',
      delivery_time_window: '20-30 mins',
      minimum_order_value: 40.0,
      accepting_orders: 1,
      is_mess: 1,
      status: 'approved',
      rating: 4.6,
      total_reviews: 142
    },
    {
      id: 'ven_munchbox',
      user_id: 'usr_vendor_munchbox',
      business_name: 'Munch Box Canteen & Rolls',
      cuisine_category: 'Fast Food, Rolls & Burgers',
      fssai_license: '10020011000456',
      serviceable_blocks: 'All Boys & Girls Blocks',
      delivery_time_window: '25-35 mins',
      minimum_order_value: 60.0,
      accepting_orders: 1,
      is_mess: 0,
      status: 'approved',
      rating: 4.8,
      total_reviews: 98
    },
    {
      id: 'ven_southern',
      user_id: 'usr_vendor_southern',
      business_name: 'Southern Spices & Dosa Hub',
      cuisine_category: 'Authentic South Indian & Filter Coffee',
      fssai_license: '10020011000789',
      serviceable_blocks: 'All Blocks (B1-B5, G1-G3)',
      delivery_time_window: '20-30 mins',
      minimum_order_value: 50.0,
      accepting_orders: 1,
      is_mess: 0,
      status: 'approved',
      rating: 4.7,
      total_reviews: 76
    }
  ];

  for (const v of vendors) {
    db.execute(
      `INSERT INTO vendors (id, user_id, business_name, cuisine_category, fssai_license, serviceable_blocks, delivery_time_window, minimum_order_value, accepting_orders, is_mess, status, rating, total_reviews)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.id, v.user_id, v.business_name, v.cuisine_category, v.fssai_license, v.serviceable_blocks, v.delivery_time_window, v.minimum_order_value, v.accepting_orders, v.is_mess, v.status, v.rating, v.total_reviews]
    );
  }

  console.log('--- Seeding Menu Items ---');
  const menuItems = [
    // Central Mess Items
    {
      id: 'item_mess_1',
      vendor_id: 'ven_central_mess',
      name: 'Special Student Thali',
      description: '4 Butter Rotis, Dal Tadka, Paneer Butter Masala, Steamed Rice, Gulab Jamun, and Papad.',
      price: 110.0,
      dietary_tag: 'Veg',
      availability: 1,
      category: 'Thali & Meals',
      is_new: 0,
      is_popular: 1,
      photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'
    },
    {
      id: 'item_mess_2',
      vendor_id: 'ven_central_mess',
      name: 'Chole Bhature (2 Pcs)',
      description: 'Authentic Punjabi style spiced chole served with two fluffy bhature, pickled onion, and green chutney.',
      price: 80.0,
      dietary_tag: 'Veg',
      availability: 1,
      category: 'Breakfast & Snacks',
      is_new: 0,
      is_popular: 1,
      photo: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400'
    },
    {
      id: 'item_mess_3',
      vendor_id: 'ven_central_mess',
      name: 'Jain Dal Khichdi Bowl',
      description: 'Comforting Moong dal and rice khichdi prepared without onion and garlic, tempered with pure ghee & cumin.',
      price: 85.0,
      dietary_tag: 'Jain',
      availability: 1,
      category: 'Thali & Meals',
      is_new: 0,
      is_popular: 0,
      photo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400'
    },
    {
      id: 'item_mess_4',
      vendor_id: 'ven_central_mess',
      name: 'Egg Curry with Steamed Rice',
      description: 'Homestyle two-egg curry in rich tomato gravy served with aromatic basmati rice.',
      price: 100.0,
      dietary_tag: 'Non-Veg',
      availability: 1,
      category: 'Main Course',
      is_new: 0,
      is_popular: 1,
      photo: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400'
    },
    {
      id: 'item_mess_5',
      vendor_id: 'ven_central_mess',
      name: 'Aloo Paratha with Curd & Pickle',
      description: 'Two whole wheat stuffed parathas with spicy potato filling, fresh curd, and butter dollop.',
      price: 70.0,
      dietary_tag: 'Veg',
      availability: 1,
      category: 'Breakfast & Snacks',
      is_new: 0,
      is_popular: 1,
      photo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400'
    },
    {
      id: 'item_mess_6',
      vendor_id: 'ven_central_mess',
      name: 'Sweet Lassi (300ml)',
      description: 'Thick churned sweet yogurt drink garnished with cardamom and dry fruits.',
      price: 40.0,
      dietary_tag: 'Veg',
      availability: 1,
      category: 'Beverages',
      is_new: 0,
      is_popular: 0,
      photo: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400'
    },

    // Munch Box Items
    {
      id: 'item_munch_1',
      vendor_id: 'ven_munchbox',
      name: 'Paneer Tikka Kathi Roll',
      description: 'Flaky lachha paratha wrap packed with smoky tandoori paneer, crunchy capsicum, and mint mayo.',
      price: 90.0,
      dietary_tag: 'Veg',
      availability: 1,
      category: 'Rolls & Wraps',
      is_new: 0,
      is_popular: 1,
      photo: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400'
    },
    {
      id: 'item_munch_2',
      vendor_id: 'ven_munchbox',
      name: 'Double Egg Chicken Roll',
      description: 'Crispy layered roll with double egg coating, spicy juicy shredded chicken tikka, and zesty onions.',
      price: 130.0,
      dietary_tag: 'Non-Veg',
      availability: 1,
      category: 'Rolls & Wraps',
      is_new: 0,
      is_popular: 1,
      photo: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400'
    },
    {
      id: 'item_munch_3',
      vendor_id: 'ven_munchbox',
      name: 'Cheese Grilled Club Sandwich',
      description: 'Triple-decker toasted sandwich stuffed with shredded veggies, spiced potato slices, and melting mozzarella.',
      price: 95.0,
      dietary_tag: 'Veg',
      availability: 1,
      category: 'Fast Food',
      is_new: 1,
      is_popular: 1,
      photo: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400'
    },
    {
      id: 'item_munch_4',
      vendor_id: 'ven_munchbox',
      name: 'Crispy Peri-Peri Fries',
      description: 'Freshly fried golden potato batons tossed in fiery peri-peri spice dust. Served with dip.',
      price: 75.0,
      dietary_tag: 'Vegan',
      availability: 1,
      category: 'Fast Food',
      is_new: 0,
      is_popular: 1,
      photo: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400'
    },
    {
      id: 'item_munch_5',
      vendor_id: 'ven_munchbox',
      name: 'Spicy Veggie Burger',
      description: 'Crisp vegetable patty with iceberg lettuce, sliced tomatoes, jalapeños, and tangy burger sauce.',
      price: 80.0,
      dietary_tag: 'Veg',
      availability: 1,
      category: 'Burgers',
      is_new: 0,
      is_popular: 0,
      photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
    },
    {
      id: 'item_munch_6',
      vendor_id: 'ven_munchbox',
      name: 'Cold Coffee with Ice Cream',
      description: 'Rich blended espresso coffee served chilled with a scoop of creamy vanilla ice cream.',
      price: 65.0,
      dietary_tag: 'Veg',
      availability: 1,
      category: 'Beverages',
      is_new: 0,
      is_popular: 1,
      photo: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400'
    },
    {
      id: 'item_munch_7',
      vendor_id: 'ven_munchbox',
      name: 'Oreo Thickshake',
      description: 'Decadent chocolate thickshake blended with crunchy Oreo cookies and chocolate drizzle.',
      price: 85.0,
      dietary_tag: 'Veg',
      availability: 0, // Out of stock to test stock toggle & validation
      category: 'Beverages',
      is_new: 0,
      is_popular: 0,
      photo: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400'
    },

    // Southern Spices Items
    {
      id: 'item_south_1',
      vendor_id: 'ven_southern',
      name: 'Mysore Masala Dosa',
      description: 'Crisp golden crepe smeared with spicy red garlic chutney, filled with tempered mashed potatoes.',
      price: 90.0,
      dietary_tag: 'Veg',
      availability: 1,
      category: 'Dosas',
      is_new: 0,
      is_popular: 1,
      photo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400'
    },
    {
      id: 'item_south_2',
      vendor_id: 'ven_southern',
      name: 'Ghee Podi Idli (4 Pcs)',
      description: 'Steamed rice cakes tossed in fragrant gunpowder spice blend and pure desi ghee. Served with sambar.',
      price: 70.0,
      dietary_tag: 'Veg',
      availability: 1,
      category: 'Idli & Vada',
      is_new: 0,
      is_popular: 1,
      photo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400'
    },
    {
      id: 'item_south_3',
      vendor_id: 'ven_southern',
      name: 'Crispy Medu Vada (2 Pcs)',
      description: 'Golden fried lentil donuts with crunchy exterior and soft interior. Served with piping hot sambar.',
      price: 60.0,
      dietary_tag: 'Vegan',
      availability: 1,
      category: 'Idli & Vada',
      is_new: 0,
      is_popular: 0,
      photo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400'
    },
    {
      id: 'item_south_4',
      vendor_id: 'ven_southern',
      name: 'Paneer Cheese Dosa',
      description: 'Paper-thin dosa topped with seasoned grated paneer and melted cheese. Served with coconut chutney.',
      price: 110.0,
      dietary_tag: 'Veg',
      availability: 1,
      category: 'Dosas',
      is_new: 1,
      is_popular: 1,
      photo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400'
    },
    {
      id: 'item_south_5',
      vendor_id: 'ven_southern',
      name: 'Traditional Filter Kaapi (Coffee)',
      description: 'Freshly decocted chicory-blend South Indian coffee frothed in traditional brass dabarah.',
      price: 35.0,
      dietary_tag: 'Veg',
      availability: 1,
      category: 'Beverages',
      is_new: 0,
      is_popular: 1,
      photo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400'
    },
    {
      id: 'item_south_6',
      vendor_id: 'ven_southern',
      name: 'Jain Plain Butter Dosa',
      description: 'Crispy crepe prepared with potato-free filling, pure butter, and special Jain coconut chutney.',
      price: 75.0,
      dietary_tag: 'Jain',
      availability: 1,
      category: 'Dosas',
      is_new: 0,
      is_popular: 0,
      photo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400'
    }
  ];

  for (const item of menuItems) {
    db.execute(
      `INSERT INTO menu_items (id, vendor_id, name, description, price, dietary_tag, availability, category, is_new, is_popular, photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.vendor_id, item.name, item.description, item.price, item.dietary_tag, item.availability, item.category, item.is_new, item.is_popular, item.photo]
    );
  }

  console.log('--- Seeding Orders, Payments & Reviews ---');

  // Order 1: Delivered & Reviewed
  const o1Id = 'HB-2026-1001';
  db.execute(
    `INSERT INTO orders (id, student_id, vendor_id, delivery_point, delivery_slot, subtotal, delivery_fee, platform_fee, total_amount, status, special_instructions, order_date)
     VALUES (?, 'usr_student_1', 'ven_central_mess', 'Hostel B2 - Room 304', 'Immediate', 190.0, 15.0, 5.0, 210.0, 'Delivered', 'Please send extra green chutney.', '2026-10-21 13:15:00')`,
    [o1Id]
  );
  db.execute(
    `INSERT INTO order_items (id, order_id, item_id, item_name, quantity, unit_price, subtotal)
     VALUES ('oi_1_1', ?, 'item_mess_1', 'Special Student Thali', 1, 110.0, 110.0),
            ('oi_1_2', ?, 'item_mess_2', 'Chole Bhature (2 Pcs)', 1, 80.0, 80.0)`,
    [o1Id, o1Id]
  );
  db.execute(
    `INSERT INTO payments (id, order_id, amount, payment_method, transaction_id, payment_status, payment_date)
     VALUES ('pay_1001', ?, 210.0, 'UPI', 'HB_UPI_DEMO_99812', 'Success', '2026-10-21 13:16:00')`,
    [o1Id]
  );
  db.execute(
    `INSERT INTO delivery_assignments (id, order_id, agent_id, status, assigned_at, delivered_at)
     VALUES ('da_1001', ?, 'usr_delivery_1', 'delivered', '2026-10-21 13:30:00', '2026-10-21 13:48:00')`,
    [o1Id]
  );
  db.execute(
    `INSERT INTO reviews (id, order_id, student_id, vendor_id, rating, comment, vendor_response, created_at, response_at)
     VALUES ('rev_1001', ?, 'usr_student_1', 'ven_central_mess', 5, 'The Special Thali was piping hot and fresh! Dal was especially delicious.', 'Thank you Saharsh! Glad you enjoyed the meal. Always happy to serve you.', '2026-10-21 14:30:00', '2026-10-21 15:00:00')`,
    [o1Id]
  );

  // Order 2: Delivered & Open for Review / Complaint
  const o2Id = 'HB-2026-1002';
  db.execute(
    `INSERT INTO orders (id, student_id, vendor_id, delivery_point, delivery_slot, subtotal, delivery_fee, platform_fee, total_amount, status, special_instructions, order_date)
     VALUES (?, 'usr_student_1', 'ven_munchbox', 'Hostel B2 - Room 304', 'Immediate', 165.0, 15.0, 5.0, 185.0, 'Delivered', 'Call when downstairs at B2 gate.', datetime('now', '-2 hours'))`,
    [o2Id]
  );
  db.execute(
    `INSERT INTO order_items (id, order_id, item_id, item_name, quantity, unit_price, subtotal)
     VALUES ('oi_2_1', ?, 'item_munch_1', 'Paneer Tikka Kathi Roll', 1, 90.0, 90.0),
            ('oi_2_2', ?, 'item_munch_4', 'Crispy Peri-Peri Fries', 1, 75.0, 75.0)`,
    [o2Id, o2Id]
  );
  db.execute(
    `INSERT INTO payments (id, order_id, amount, payment_method, transaction_id, payment_status, payment_date)
     VALUES ('pay_1002', ?, 185.0, 'Wallet', 'HB_TXN_WALLET_1002', 'Success', datetime('now', '-2 hours'))`,
    [o2Id]
  );
  db.execute(
    `INSERT INTO delivery_assignments (id, order_id, agent_id, status, assigned_at, delivered_at)
     VALUES ('da_1002', ?, 'usr_delivery_1', 'delivered', datetime('now', '-90 minutes'), datetime('now', '-45 minutes'))`,
    [o2Id]
  );

  // Order 3: Preparing (Active order for Vendor test)
  const o3Id = 'HB-2026-1003';
  db.execute(
    `INSERT INTO orders (id, student_id, vendor_id, delivery_point, delivery_slot, subtotal, delivery_fee, platform_fee, total_amount, status, special_instructions, order_date)
     VALUES (?, 'usr_student_2', 'ven_munchbox', 'Hostel B4 - Room 215', 'Immediate', 225.0, 15.0, 5.0, 245.0, 'Preparing', 'Extra spicy rolls please!', datetime('now', '-15 minutes'))`,
    [o3Id]
  );
  db.execute(
    `INSERT INTO order_items (id, order_id, item_id, item_name, quantity, unit_price, subtotal)
     VALUES ('oi_3_1', ?, 'item_munch_2', 'Double Egg Chicken Roll', 1, 130.0, 130.0),
            ('oi_3_2', ?, 'item_munch_3', 'Cheese Grilled Club Sandwich', 1, 95.0, 95.0)`,
    [o3Id, o3Id]
  );
  db.execute(
    `INSERT INTO payments (id, order_id, amount, payment_method, transaction_id, payment_status, payment_date)
     VALUES ('pay_1003', ?, 245.0, 'Card', 'HB_CARD_SIM_1003', 'Success', datetime('now', '-15 minutes'))`,
    [o3Id]
  );

  // Order 4: Ready (Active order for Delivery Agent claim test)
  const o4Id = 'HB-2026-1004';
  db.execute(
    `INSERT INTO orders (id, student_id, vendor_id, delivery_point, delivery_slot, subtotal, delivery_fee, platform_fee, total_amount, status, special_instructions, order_date)
     VALUES (?, 'usr_student_1', 'ven_southern', 'Hostel B2 - Ground Common Room', 'Immediate', 160.0, 15.0, 5.0, 180.0, 'Ready', 'Handle coffee cup with care.', datetime('now', '-10 minutes'))`,
    [o4Id]
  );
  db.execute(
    `INSERT INTO order_items (id, order_id, item_id, item_name, quantity, unit_price, subtotal)
     VALUES ('oi_4_1', ?, 'item_south_1', 'Mysore Masala Dosa', 1, 90.0, 90.0),
            ('oi_4_2', ?, 'item_south_2', 'Ghee Podi Idli (4 Pcs)', 1, 70.0, 70.0)`,
    [o4Id, o4Id]
  );
  db.execute(
    `INSERT INTO payments (id, order_id, amount, payment_method, transaction_id, payment_status, payment_date)
     VALUES ('pay_1004', ?, 180.0, 'UPI', 'HB_UPI_SIM_1004', 'Success', datetime('now', '-10 minutes'))`,
    [o4Id]
  );

  // Order 5: Out for Delivery (Active in transit for courier test)
  const o5Id = 'HB-2026-1005';
  db.execute(
    `INSERT INTO orders (id, student_id, vendor_id, delivery_point, delivery_slot, subtotal, delivery_fee, platform_fee, total_amount, status, special_instructions, order_date)
     VALUES (?, 'usr_student_2', 'ven_central_mess', 'Hostel B4 - Room 215', 'Immediate', 100.0, 15.0, 5.0, 120.0, 'Out for Delivery', 'Ring doorbell twice.', datetime('now', '-25 minutes'))`,
    [o5Id]
  );
  db.execute(
    `INSERT INTO order_items (id, order_id, item_id, item_name, quantity, unit_price, subtotal)
     VALUES ('oi_5_1', ?, 'item_mess_4', 'Egg Curry with Steamed Rice', 1, 100.0, 100.0)`,
    [o5Id]
  );
  db.execute(
    `INSERT INTO payments (id, order_id, amount, payment_method, transaction_id, payment_status, payment_date)
     VALUES ('pay_1005', ?, 120.0, 'UPI', 'HB_UPI_SIM_1005', 'Success', datetime('now', '-25 minutes'))`,
    [o5Id]
  );
  db.execute(
    `INSERT INTO delivery_assignments (id, order_id, agent_id, status, assigned_at)
     VALUES ('da_1005', ?, 'usr_delivery_1', 'picked_up', datetime('now', '-10 minutes'))`,
    [o5Id]
  );

  console.log('--- Seeding Notifications ---');
  db.execute(
    `INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
     VALUES 
      ('notif_1', 'usr_student_1', 'Welcome to HostelBite!', 'Explore the central mess menu and campus food outlets. Fast room delivery to Block B2.', 'info', 1, '/', datetime('now', '-2 days')),
      ('notif_2', 'usr_student_1', 'Order Delivered', 'Order #HB-2026-1002 was delivered at Hostel B2 - Room 304. Enjoy your meal!', 'order', 0, '/orders/HB-2026-1002', datetime('now', '-45 minutes')),
      ('notif_3', 'usr_vendor_munchbox', 'Kitchen Rush Notice', 'You have active orders in queue. Keep up the high delivery rating!', 'alert', 0, '/vendor', datetime('now', '-1 hour')),
      ('notif_4', 'usr_delivery_1', 'New Delivery Available', 'Order #HB-2026-1004 from Southern Spices is ready for pickup!', 'delivery', 0, '/delivery', datetime('now', '-10 minutes'))`
  );

  console.log('--- Seeding Sample Complaint ---');
  // Sample resolved complaint for historical analytics
  const compId = 'CMP_1000';
  db.execute(
    `INSERT INTO complaints (id, order_id, student_id, vendor_id, issue_category, description, status, refund_amount, resolution_reason, created_at, resolved_at)
     VALUES (?, 'HB-2026-1001', 'usr_student_1', 'ven_central_mess', 'Spilled or Damaged', 'Raita container lid came loose in bag.', 'Resolved', 50.0, 'Partial refund authorized by Chief Warden for spilled side dish.', datetime('now', '-1 day'), datetime('now', '-1 day'))`,
    [compId]
  );

  console.log('=== Database Seeding Completed Successfully! ===');
}

// Allow direct execution
if (require.main === module) {
  runSeed();
}
