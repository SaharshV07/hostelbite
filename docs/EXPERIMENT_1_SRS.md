# Experiment 1: Software Requirements Specification (SRS)
## HostelBite — Hostel Food Delivery Application

**Course**: B.Tech Information Technology, 5th Semester  
**Subject**: Software Engineering Laboratory (AY 2026–27)  
**Institution**: Manipal University Jaipur  
**Authors**: Saharsh Vaibhav Lal & Vaibhav Kumar (5F Batch-1)  
**Standard**: IEEE Std 830-1998 Format  

---

### 1. Introduction

#### 1.1 Purpose
This document specifies the software requirements for **HostelBite**, an integrated hostel food ordering, mess subscription management, and last-mile delivery web application designed for residential university campuses such as Manipal University Jaipur (MUJ). This specification covers the complete system: student ordering portal, vendor/mess dashboard, delivery personnel dispatch interface, and hostel administrative control panel.

#### 1.2 Document Conventions
- **Shall**: Indicates a mandatory requirement for system completion.
- **Should**: Indicates a desirable requirement.
- **FR-<Module>-<Number>**: Functional Requirement identifier.
- **NFR-<Category>-<Number>**: Non-Functional Requirement identifier.
- **BR-<Number>**: Business Rule identifier.

#### 1.3 Intended Audience
- **Development Team**: Technical implementation, API design, database schema, and automated tests.
- **Academic Evaluators / Mentors**: Verification against syllabus and rubric criteria.
- **Campus Stakeholders (Hostel Mess Committee, Food Vendors, Chief Warden)**: Operational understanding of workflows and policies.

#### 1.4 Product Scope
HostelBite solves chronic dining issues in university hostels:
1. Long physical queues and unpredictable rush at mess counters and campus eateries.
2. Inaccurate manual meal counting leading to heavy food wastage.
3. Cumbersome cash transactions or manual UPI screenshot verification.
4. Lack of transparent, real-time status tracking for room deliveries.
5. Absence of a structured, SLA-bound complaint and feedback mechanism.

**In-Scope**: Student ordering, daily mess menu, multiple campus food vendors, cashless checkout (UPI/Card/Prepaid Wallet), real-time order lifecycle tracking, role-based dashboards, in-hostel delivery dispatch, dispute/complaint management, and analytical reports.  
**Out-of-Scope (v1.0)**: Off-campus deliveries beyond university gates, physical POS hardware integration, external restaurant aggregation, and automated drone delivery.

---

### 2. Overall Description

#### 2.1 Product Perspective
HostelBite operates as an independent three-tier web application:
- **Presentation Tier**: Responsive React + TypeScript frontend running on modern desktop and mobile browsers.
- **Application Tier**: RESTful API built on Node.js and Express.js with role-based access control (RBAC).
- **Data Tier**: Relational SQLite database with foreign key enforcement and transactional integrity.
- **External Interfaces**: Simulated cashless payment gateway (supporting UPI, Card, Net Banking), simulated SMS/Push notifications.

#### 2.2 User Classes and Characteristics
1. **Student / Resident**: Browses menus, customizes orders, pays digitally, tracks status in real time, rates orders, and files complaints.
2. **Mess Manager / Food Vendor**: Manages daily menu, updates item availability and pricing, accepts/prepares orders, and responds to reviews.
3. **Delivery Personnel**: Claims ready orders, navigates to hostel blocks and rooms, updates delivery status, and confirms drop-off.
4. **Hostel Administrator**: Approves vendors, audits orders, resolves escalated complaints, authorizes refunds, and monitors mess wastage and campus sales.

#### 2.3 Operating Environment
- Client: Any modern web browser (Chrome, Edge, Firefox, Safari) on laptops, tablets, and mobile devices.
- Server: Node.js (v18+) runtime on Windows, macOS, or Linux.
- Database: SQLite 3 relational database file.

---

### 3. Functional Requirements

#### 3.1 User Registration & Authentication (FR-AUTH)
- **FR-AUTH-01**: University email (`@muj.manipal.edu`) and phone number registration with simulated development-mode OTP verification.
- **FR-AUTH-02**: Mandatory capture of student residence details: Hostel Block (e.g., B1, B2, B3, B4, B5, G1, G2), Floor, and Room Number.
- **FR-AUTH-03**: Vendor registration gated behind Administrator approval; account remains inactive until approved.
- **FR-AUTH-04**: JWT session tokens with role-based claim verification for API authorization.
- **FR-AUTH-05**: Self-service password reset using registered mobile/email and simulated OTP.
- **FR-AUTH-06**: Account lockout protection after 5 consecutive failed login attempts.
- **FR-AUTH-07**: Profile management allowing students to update their default delivery location.
- **FR-AUTH-08**: Passwords securely hashed with bcrypt (salt rounds >= 10); no plaintext passwords in storage or responses.

#### 3.2 Hostel/Mess & Vendor Onboarding (FR-VEN)
- **FR-VEN-01**: Capture of business name, cuisine category, FSSAI registration number, and operating hours.
- **FR-VEN-02**: Admin workflow to approve, reject, or request revision on vendor applications.
- **FR-VEN-03**: Mess Committee daily meal plan and subscription configuration.
- **FR-VEN-04**: Vendor-defined serviceable hostel blocks, delivery time windows, and minimum order values.
- **FR-VEN-05**: FSSAI license expiry tracking and automatic alert system.
- **FR-VEN-06**: Admin suspension switch that immediately removes a vendor from the active student menu.
- **FR-VEN-07**: Cuisine category classification (North Indian, South Indian, Rolls & Fast Food, Beverages, Healthy).
- **FR-VEN-08**: Vendor self-service pause switch ("Accepting Orders" toggle) for temporary kitchen rush.

#### 3.3 Menu Browsing & Search (FR-MEN)
- **FR-MEN-01**: Display of active mess menu refreshed daily.
- **FR-MEN-02**: Dietary classification filter: Vegetarian, Non-Vegetarian, Vegan, Jain.
- **FR-MEN-03**: Instant text search across food items, descriptions, and vendor names.
- **FR-MEN-04**: Visual grey-out and ordering disablement for out-of-stock items.
- **FR-MEN-05**: Vendor estimated prep and delivery time display.
- **FR-MEN-06**: Student favorite items bookmarking for fast one-click reordering.
- **FR-MEN-07**: Price range filtering (e.g., ₹0–₹100, ₹100–₹250, ₹250+).
- **FR-MEN-08**: "New Item" badge for freshly introduced culinary options.

#### 3.4 Cart & Order Placement (FR-ORD)
- **FR-ORD-01**: Single-vendor cart policy to ensure streamlined single-ticket kitchen fulfillment.
- **FR-ORD-02**: Delivery scheduling: Immediate or specified slot (Breakfast, Lunch, Snacks, Dinner, Late Night).
- **FR-ORD-03**: Transparent itemized bill breakdown: Subtotal + Delivery Fee (₹15) + Platform Fee (₹5) = Grand Total.
- **FR-ORD-04**: Order cancellation strictly restricted to the `Placed` status before vendor accepts.
- **FR-ORD-05**: Generation of unique order ID (e.g., `HB-2026-XXXX`) and digital receipt on checkout.
- **FR-ORD-06**: Vendor minimum order value validation (default ₹50).
- **FR-ORD-07**: Special preparation instructions (up to 200 characters per order).
- **FR-ORD-08**: Cart validation on server side: recalculating prices and ensuring items are still available.

#### 3.5 Payment & Wallet Management (FR-PAY)
- **FR-PAY-01**: Support for UPI, Debit/Credit Card, and in-app Prepaid Wallet payment options.
- **FR-PAY-02**: In-app hostel wallet top-up in ₹100 increments up to a ₹5,000 regulatory balance cap.
- **FR-PAY-03**: Simulated payment gateway modal featuring explicit "Simulate Success" and "Simulate Failure" controls.
- **FR-PAY-04**: Instant wallet refund credit upon authorized dispute resolution or vendor order rejection.
- **FR-PAY-05**: Immutable ledger of wallet transactions with running balance after each debit/credit.
- **FR-PAY-06**: Tokenized payment simulation; zero storage of raw card numbers or UPI PINs.
- **FR-PAY-07**: Real-time wallet balance display in student navigation header.
- **FR-PAY-08**: Transaction confirmation notifications on every balance movement.

#### 3.6 Order Tracking & Delivery Management (FR-DEL)
- **FR-DEL-01**: Real-time horizontal stepper tracking order states: `Placed` → `Accepted` → `Preparing` → `Ready` → `Out for Delivery` → `Delivered`.
- **FR-DEL-02**: Delivery agent task board showing ready orders awaiting pickup.
- **FR-DEL-03**: Claiming workflow where delivery personnel take ownership of an order.
- **FR-DEL-04**: Status transition to `Out for Delivery` upon vendor hand-off.
- **FR-DEL-05**: Display of student hostel block, floor, room number, and phone contact to the delivery agent.
- **FR-DEL-06**: Delivery confirmation with timestamp recording.
- **FR-DEL-07**: Delivery agent shift status toggle (`Available` vs. `Offline`).
- **FR-DEL-08**: Maximum limit of concurrent active deliveries per agent to prevent delivery delays.

#### 3.7 Notifications & Alerts (FR-NOT)
- **FR-NOT-01**: Notification on order state change for student.
- **FR-NOT-02**: Instant alert for vendor upon receiving a newly confirmed paid order.
- **FR-NOT-03**: Alert for delivery personnel when an order is flagged `Ready`.
- **FR-NOT-04**: In-app notification center with read/unread tracking and direct navigation links.

#### 3.8 Ratings & Reviews (FR-REV)
- **FR-REV-01**: Rating prompt enabled exclusively after an order has reached `Delivered` status.
- **FR-REV-02**: 1 to 5 star rating with optional text comment.
- **FR-REV-03**: Single public response permitted per review by the vendor.
- **FR-REV-04**: Administrator ability to remove abusive or fraudulent reviews.
- **FR-REV-05**: Enforcement of exactly one review per delivered order.
- **FR-REV-06**: Aggregated average rating dynamically displayed on vendor catalog page.

#### 3.9 Vendor/Mess Dashboard Operations (FR-ADM-V)
- **FR-ADM-V-01**: Kanban-style order board categorized into New, Preparing, Ready, and Completed.
- **FR-ADM-V-02**: Full menu CRUD: add new item, edit title/description/price/dietary tag, toggle availability, delete item.
- **FR-ADM-V-03**: Accept or Reject incoming order. Rejecting triggers automatic wallet refund and order cancellation.
- **FR-ADM-V-04**: Daily and weekly sales total, order count, and revenue breakdown.

#### 3.10 Complaint & Dispute Management (FR-CMP)
- **FR-CMP-01**: Formal complaint filing available within 12 hours of order delivery.
- **FR-CMP-02**: Standardized issue categories: Food Quality, Missing Item, Spilled/Damaged Package, Wrong Item, Excessive Delay.
- **FR-CMP-03**: Strict enforcement of at most one complaint per order.
- **FR-CMP-04**: Admin dispute resolution console with refund authorization: Full Refund, Partial Refund, or Dismissed.
- **FR-CMP-05**: Automated transaction logging and instant wallet balance credit when refund is approved.

#### 3.11 Administrator Dashboard & Analytics (FR-ADM & FR-RPT)
- **FR-ADM-01**: High-level KPI overview: total orders, gross revenue, active vendor count, open complaints.
- **FR-ADM-02**: Vendor application management: approve, reject, or suspend.
- **FR-ADM-03**: User directory covering Students, Vendors, Delivery Agents, and Admins.
- **FR-ADM-04**: Dispute resolution center with mandatory reason notes on refunds.
- **FR-ADM-05**: Daily order breakdown by hostel block and vendor.
- **FR-ADM-06**: Mess wastage indicator comparing meal counts with registered hostel subscriptions.

---

### 4. Non-Functional Requirements

- **NFR-PERF-01**: API response times under 500ms for typical catalog and cart operations.
- **NFR-PERF-02**: Fast client-side searching and filtering with zero noticeable lag.
- **NFR-SEC-01**: Role-based access control (RBAC) enforced on every API route using JWT authentication.
- **NFR-SEC-02**: Password hashing using bcrypt with 10+ salt rounds; password hashes excluded from all API payloads.
- **NFR-SEC-03**: Idempotent payment processing preventing duplicate charges on repeated clicks.
- **NFR-QUAL-01**: Clean, student-friendly, and accessible user interface formatted with Indian Rupee (`₹`) symbols.
- **NFR-QUAL-02**: Persistent relational storage retaining data integrity across server restarts.

---

### 5. Business Rules (BR)

- **BR-01**: One active account per student, tied to a unique university email.
- **BR-02**: Orders cannot proceed to checkout unless cart subtotal meets or exceeds the vendor's minimum order value.
- **BR-03**: An order cannot be viewed or accepted by a vendor until the payment status is verified as `Success`.
- **BR-04**: Order cancellation is permitted only while status is `Placed`.
- **BR-05**: Status transitions must follow the strict lifecycle: `Placed` → `Accepted` → `Preparing` → `Ready` → `Out for Delivery` → `Delivered`.
- **BR-06**: Maximum wallet balance allowed is ₹5,000 (complying with RBI PPI guidelines).
- **BR-07**: Complaints must be filed within 12 hours of delivery; reviews are limited to delivered orders only.
- **BR-08**: Rejection of an order by a vendor immediately triggers an automatic full refund to the student's wallet.
