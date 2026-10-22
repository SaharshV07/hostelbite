# HostelBite — Hostel Food Delivery Application
**Course**: B.Tech Information Technology, 5th Semester  
**Subject**: Software Engineering Laboratory (AY 2026–27)  
**Institution**: Manipal University Jaipur  
**Authors**: Saharsh Vaibhav Lal & Vaibhav Kumar (5F Batch-1)  

---

## 1. Project Overview
**HostelBite** is a full-stack hostel food delivery and mess management web application tailored for university residential campuses. It replaces inefficient manual registers and phone-call ordering with a real-time digitized platform connecting four core campus user roles:
1. **Students / Residents**: Browse daily mess menus & campus eateries, place customizable room deliveries, pay via UPI/Card/Prepaid Wallet, track live orders, rate food, and lodge dispute complaints.
2. **Mess Managers & Vendors**: Manage culinary catalogs, toggle out-of-stock items, triage orders on a 4-column visual Kanban board, and respond to student reviews.
3. **Delivery Couriers / Runners**: View available packed orders, claim deliveries, route to hostel blocks and rooms, and confirm hand-offs.
4. **Hostel Administrators (Chief Warden)**: Approve vendor onboarding, inspect mess wastage metrics, audit orders, and authorize wallet refunds.

---

## 2. Technology Stack
- **Frontend**: React 19, TypeScript, Vite, React Router v7, Lucide Icons, Modern Plain CSS (Responsive, Indian Rupee formatting `₹`).
- **Backend**: Node.js v22, Express.js, TypeScript, REST API architecture, JWT authentication, bcrypt password hashing.
- **Database**: Relational SQLite (`hostelbite.db`) with foreign key constraints, indexes, and atomic transaction handling.
- **Testing**: Vitest + Supertest integration test suite (covering all 14 project test specifications).

---

## 3. Demo Accounts & Credentials

The application includes a prominent **1-Click Role Switcher Bar** at the top of the screen to effortlessly switch between roles during evaluations. You can also sign in manually with these seeded credentials:

| Role | Outlet / Campus Function | Email Address | Password | Default Campus Location |
|---|---|---|---|---|
| **Student** | Resident (Lead Author) | `student@muj.manipal.edu` | `Student@123` | Hostel Block B2, Room 304 (Wallet: ₹1,250) |
| **Student 2** | Resident (Co-Author) | `vaibhav@muj.manipal.edu` | `Student@123` | Hostel Block B4, Room 215 (Wallet: ₹850) |
| **Vendor (Mess)** | Central Hostel Mess & Dining | `mess@muj.manipal.edu` | `Mess@123` | Central Mess Dining Hall |
| **Vendor (Canteen)**| Munch Box Fast Food & Rolls | `munchbox@muj.manipal.edu` | `Vendor@123` | Food Court 1, Shop 04 |
| **Vendor (South)** | Southern Spices & Dosa Hub | `southern@muj.manipal.edu` | `Vendor@123` | Food Court 2, Shop 11 |
| **Delivery Courier** | Campus Runner / Courier | `delivery@muj.manipal.edu` | `Delivery@123` | Dispatch Bay / Security Gate Post |
| **Administrator** | Chief Warden / Hostel Office | `admin@muj.manipal.edu` | `Admin@123` | Administrative Block, Room 102 |

---

## 4. Quick Start & Execution Instructions

### Prerequisites
- Node.js (v18+ or v22 LTS recommended)
- npm (v9+ or v11)

### Installation
Dependencies are already installed, but to install from scratch:
```powershell
# From the root directory:
npm run install:all
```
*(Or install in both folders individually: `cd server; npm install; cd ../client; npm install`)*

### Database Initialization & Seeding
To initialize the database schema and populate with realistic MUJ eateries, 20+ dishes, and demo orders:
```powershell
npm run seed
```

### Running Automated Test Suite
To run the automated Vitest + Supertest integration test suite (30 passing tests covering all 14 testing specifications):
```powershell
npm test
```

### Starting the Application Locally

#### Terminal 1 — Start Backend Server:
```powershell
npm run server
```
*Backend runs at `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`)*

#### Terminal 2 — Start Frontend Application:
```powershell
npm run client
```
*Frontend runs at `http://localhost:5173`*

Open **`http://localhost:5173`** in your browser.

---

## 5. Lab Experiments & UML Documentation Directory (`docs/`)

The repository includes complete, editable Mermaid diagram sources and documentation for all 7 Software Engineering Lab experiments:

- **Experiment 1 (SRS)**: [`docs/EXPERIMENT_1_SRS.md`](docs/EXPERIMENT_1_SRS.md) — IEEE Std 830-1998 formatted SRS covering functional requirements (FR-AUTH, FR-VEN, FR-MEN, FR-ORD, FR-PAY, FR-DEL, FR-NOT, FR-REV, FR-ADM, FR-CMP, FR-RPT), non-functional requirements, and business rules.
- **Experiment 2 (Use Case Diagram)**: [`docs/EXPERIMENT_2_USE_CASE.md`](docs/EXPERIMENT_2_USE_CASE.md) — Mermaid use case diagram with Student, Vendor, Delivery, and Admin actors, including `<<include>>` and `<<extend>>` relations.
- **Experiment 3 (DFD & ERD)**: [`docs/EXPERIMENT_3_DFD_ERD.md`](docs/EXPERIMENT_3_DFD_ERD.md) — Context DFD (Level 0), Decomposed DFD (Level 1), and complete Entity-Relationship Diagram preserving all 8 core entities and supporting tables.
- **Experiment 4 (Class Diagram)**: [`docs/EXPERIMENT_4_CLASS_DIAGRAM.md`](docs/EXPERIMENT_4_CLASS_DIAGRAM.md) — Strict class diagram preserving the eight core conceptual classes: `User`, `Vendor`, `MenuItem`, `Order`, `OrderItem` (composition), `Payment`, `Complaint`, and `Review`.
- **Experiment 5 (Sequence Diagram)**: [`docs/EXPERIMENT_5_SEQUENCE_DIAGRAM.md`](docs/EXPERIMENT_5_SEQUENCE_DIAGRAM.md) — Detailed ordering and verification sequence diagram. Explains the financial safety logic of verifying payment prior to kitchen order dispatch.
- **Experiment 6 (Activity & Package Diagrams)**: [`docs/EXPERIMENT_6_ACTIVITY_PACKAGE.md`](docs/EXPERIMENT_6_ACTIVITY_PACKAGE.md) — Food ordering control flow activity diagram and 4-tier Package diagram (Presentation, Application Services, Data Access & Storage, External Services).
- **Experiment 7 (Collaboration Diagram)**: [`docs/EXPERIMENT_7_COLLABORATION_DIAGRAM.md`](docs/EXPERIMENT_7_COLLABORATION_DIAGRAM.md) — Numbered message sequence communication diagram between `student`, `app`, `db`, `pg`, and `vendor`.
- **Traceability Matrix**: [`docs/REQUIREMENTS_TRACEABILITY_MATRIX.md`](docs/REQUIREMENTS_TRACEABILITY_MATRIX.md) — Full cross-referencing matrix mapping each requirement ID to its architectural layer, database entity, diagram, and test case.

---

## 6. Simulated vs. Real Integrations

In accordance with academic lab guidelines, this project avoids paid third-party dependencies while providing full demonstration capabilities:

| Component | Implementation Type | Operational Details |
|---|---|---|
| **Payment Gateway** | **Simulated Sandbox Gateway** | Features a modal with **"Simulate Successful Payment"** and **"Simulate Failed Payment"** buttons to test both positive and negative financial workflows. Idempotent token generation (`HB_SIM_...`). |
| **In-App Prepaid Wallet** | **Real Relational Ledger** | Full database implementation with atomic balance debits, credits, ₹5,000 RBI PPI cap enforcement, and immutable transaction audit log. |
| **SMS / Mobile OTP** | **Simulated Development Flow** | Clearly labeled development-mode OTP verification. Passwords securely hashed with bcrypt (salt rounds = 10). |
| **Real-Time Order Tracking** | **Periodic Client Polling** | Automatic background polling (every 5-6s) to ensure state transitions reflect on client screens without manual page reloads. |
| **Push Notifications** | **In-App Notification Center** | Real database-persisted notifications with unread counter badges and direct order links. |

---

## 7. Centralized Order Lifecycle Policy

Status transitions are strictly guarded by the centralized `OrderService` state machine:
```
Payment Pending ──(Payment Verified)──> Placed ──(Vendor Accepts)──> Accepted
       │                                   │                            │
       └──(Declined)──> Cancelled          └──(Cancel)──> Cancelled     └──(Cancel)──> Cancelled (Auto-Refund)
                                                                        │
                                                                   Preparing
                                                                        │
                                                                      Ready ──(Courier Claims)──> Out for Delivery
                                                                                                        │
                                                                                                    Delivered
                                                                                                        │
                                                                                                     Disputed
```
- **Cancellation**: Permitted only while status is `Placed` (before kitchen acceptance).
- **Kitchen Safety**: Vendors only see orders after payment is verified as `Success`.
- **Reviews**: Only unlocked after order reaches `Delivered` (maximum 1 review per order).
- **Complaints**: Only unlocked within 12 hours of delivery (maximum 1 complaint per order).
- **Refunds**: Admin or Vendor authorized refunds immediately credit the student's prepaid wallet balance and append an immutable transaction ledger record.

---

## 8. Requirements Traceability Checklist

- [x] **FR-AUTH**: University email signup, mobile capture, bcrypt hashing, JWT session, role-based protection.
- [x] **FR-VEN**: Vendor onboarding with FSSAI license, cuisine category, order pause/resume toggle.
- [x] **FR-MEN**: Daily mess menu display, dietary filters (Veg/Non-Veg/Vegan/Jain), search, out-of-stock toggle.
- [x] **FR-ORD**: Single-vendor cart enforcement, delivery slot selection, room-level delivery address, server-side price recalculation.
- [x] **FR-PAY**: UPI, Card, and Prepaid Wallet payment methods, simulated gateway success/failure testing, instant refund credit.
- [x] **FR-DEL**: Horizontal progress stepper, courier task claim pool, Out for Delivery and Delivered hand-off confirmation.
- [x] **FR-NOT**: Real-time in-app notifications on status changes, unread badge counter.
- [x] **FR-REV**: 1-5 star ratings for delivered orders, single vendor response.
- [x] **FR-CMP**: Complaint filing within 12h, predefined issue categories, admin refund authorization.
- [x] **FR-ADM**: Overview dashboard, active orders audit log, vendor approvals, mess wastage projection metric.

---

## 9. Known Limitations (Academic v1.0 Scope)
1. **Single-Campus Scope**: Designed specifically for Manipal University Jaipur hostel blocks (B1-B5, G1-G3); multi-campus tenancy is deferred to v2.0.
2. **GPS Geolocation**: Delivery points are captured as discrete hostel blocks, floors, and room numbers rather than live continuous GPS polyline tracking.
3. **SMS Provider**: Live SMS OTP dispatch requires a paid Twilio or MSG91 gateway account; current release runs in verified development mode.
