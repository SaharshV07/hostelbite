# Requirements Traceability Matrix (RTM)
## HostelBite — Hostel Food Delivery Application

**Institution**: Manipal University Jaipur  
**Course**: B.Tech Information Technology, 5th Semester — SE Lab (AY 2026–27)  
**Authors**: Saharsh Vaibhav Lal & Vaibhav Kumar (5F Batch-1)  

---

| Requirement ID | Description | Priority | Architectural Layer / Module | Database Entity | UML Diagram Reference | Test Case ID |
|---|---|---|---|---|---|---|
| **FR-AUTH-01** | Student signup with university email & simulated OTP | High | Auth Service (`server/routes/auth.ts`) | `USER` | Exp 2 (Use Case), Exp 3 (DFD 1) | `TC-AUTH-01` |
| **FR-AUTH-02** | Mandatory hostel block/room capture | High | Auth Service, Student Profile | `USER` | Exp 4 (Class Diagram) | `TC-AUTH-02` |
| **FR-AUTH-03** | Vendor registration gated by Admin approval | High | Admin Service, Vendor Service | `VENDOR`, `USER` | Exp 2 (Use Case), Exp 3 (DFD 1) | `TC-AUTH-03` |
| **FR-AUTH-04** | Role-based JWT session authentication | High | Middleware (`server/middleware/auth.ts`) | `USER` | Exp 6 (Package Diagram) | `TC-AUTH-04` |
| **FR-AUTH-08** | Strong password hashing (bcrypt, salt >= 10) | High | Auth Service | `USER` | Exp 4 (Class Diagram) | `TC-AUTH-05` |
| **FR-VEN-01** | Vendor onboarding with FSSAI & cuisine category | High | Vendor Service (`server/routes/vendors.ts`) | `VENDOR` | Exp 2 (Use Case), Exp 3 (ERD) | `TC-VEN-01` |
| **FR-VEN-02** | Admin approve/reject/suspend vendor workflow | High | Admin Service (`server/routes/admin.ts`) | `VENDOR` | Exp 2 (Use Case), Exp 3 (DFD 1) | `TC-VEN-02` |
| **FR-VEN-08** | Vendor order acceptance pause/resume toggle | High | Vendor Service | `VENDOR` | Exp 4 (Class Diagram) | `TC-VEN-03` |
| **FR-MEN-01** | Daily mess menu display refreshed daily | High | Menu Service (`server/routes/menu.ts`) | `MENU_ITEM`, `VENDOR` | Exp 2 (Use Case), Exp 6 (Activity) | `TC-MEN-01` |
| **FR-MEN-02** | Dietary tag filtering (Veg/Non-Veg/Vegan/Jain) | High | Menu Client / Menu API | `MENU_ITEM` | Exp 3 (DFD 1), Exp 4 (Class) | `TC-MEN-02` |
| **FR-MEN-03** | Instant search across food items and vendors | High | Menu API / Client Filter | `MENU_ITEM`, `VENDOR` | Exp 2 (Use Case) | `TC-MEN-03` |
| **FR-MEN-04** | Stock availability indicator & out-of-stock guard | High | Menu Service, Order Service | `MENU_ITEM` | Exp 5 (Sequence), Exp 6 (Activity) | `TC-MEN-04` |
| **FR-ORD-01** | Single-vendor cart enforcement | High | Cart Context / Order Service | `ORDER`, `ORDER_ITEM` | Exp 3 (ERD), Exp 4 (Class) | `TC-ORD-01` |
| **FR-ORD-02** | Immediate or scheduled delivery slot | Medium | Order Service | `ORDER` | Exp 4 (Class Diagram) | `TC-ORD-02` |
| **FR-ORD-03** | Server-side total calculation (subtotal+fee) | High | Order Service (`server/services/orderService.ts`)| `ORDER` | Exp 5 (Sequence), Exp 7 (Collab) | `TC-ORD-03` |
| **FR-ORD-04** | Cancellation allowed only when status is `Placed` | High | Order Service | `ORDER` | Exp 5 (Sequence), Exp 6 (Activity) | `TC-ORD-04` |
| **FR-ORD-05** | Unique Order ID & digital receipt | High | Order Service | `ORDER`, `PAYMENT` | Exp 3 (ERD), Exp 4 (Class) | `TC-ORD-05` |
| **FR-PAY-01** | UPI, Card, and Prepaid Wallet payment methods | High | Payment Service (`server/routes/payment.ts`) | `PAYMENT` | Exp 2 (Use Case), Exp 5 (Seq) | `TC-PAY-01` |
| **FR-PAY-02** | Wallet top-up up to ₹5,000 cap | High | Wallet Service (`server/routes/wallet.ts`) | `USER`, `WALLET_TRANSACTION` | Exp 2 (Use Case), Exp 3 (ERD) | `TC-PAY-02` |
| **FR-PAY-03** | Simulated gateway with success/failure testing | High | Payment Service & Gateway Modal | `PAYMENT` | Exp 5 (Sequence), Exp 6 (Activity) | `TC-PAY-03` |
| **FR-PAY-04** | Instant wallet credit on refund | High | Complaint Service, Payment Service | `WALLET_TRANSACTION`, `USER` | Exp 2 (Use Case), Exp 4 (Class) | `TC-PAY-04` |
| **FR-DEL-01** | Real-time 6-stage lifecycle stepper | High | Order Tracker Component | `ORDER` | Exp 5 (Sequence), Exp 6 (Activity) | `TC-DEL-01` |
| **FR-DEL-02** | Delivery task pool and claim mechanism | High | Delivery Service (`server/routes/delivery.ts`) | `ORDER`, `DELIVERY_ASSIGNMENT` | Exp 2 (Use Case), Exp 5 (Seq) | `TC-DEL-02` |
| **FR-DEL-05** | Room & hostel block routing details for courier | High | Delivery Interface | `ORDER`, `USER` | Exp 3 (DFD 1), Exp 5 (Seq) | `TC-DEL-03` |
| **FR-NOT-01** | In-app alerts on status transitions | Medium | Notification Service (`server/routes/notifications.ts`) | `NOTIFICATION` | Exp 2 (Use Case), Exp 6 (Package)| `TC-NOT-01` |
| **FR-REV-01** | Rating & review restricted to delivered orders | Medium | Review Service (`server/routes/reviews.ts`) | `REVIEW`, `ORDER` | Exp 2 (Use Case), Exp 4 (Class) | `TC-REV-01` |
| **FR-REV-03** | Vendor official response to reviews | Medium | Review Service | `REVIEW` | Exp 4 (Class Diagram) | `TC-REV-02` |
| **FR-ADM-V-01**| Vendor Kanban order board (New, Prep, Ready, Done) | High | Vendor Dashboard UI | `ORDER` | Exp 2 (Use Case), Exp 6 (Package)| `TC-VEN-04` |
| **FR-ADM-V-02**| Self-service Menu CRUD for vendors | High | Menu Service | `MENU_ITEM` | Exp 4 (Class Diagram) | `TC-VEN-05` |
| **FR-CMP-01** | Complaint submission within 12 hours | Medium | Complaint Service (`server/routes/complaints.ts`) | `COMPLAINT`, `ORDER` | Exp 2 (Use Case), Exp 4 (Class) | `TC-CMP-01` |
| **FR-CMP-04** | Admin refund authorization & wallet payout | High | Admin Service, Complaint Service | `COMPLAINT`, `WALLET_TRANSACTION`| Exp 2 (Use Case), Exp 6 (Activity)| `TC-CMP-02` |
| **FR-ADM-01** | Campus dining metrics & mess wastage analysis | Medium | Analytics Service (`server/routes/analytics.ts`) | `ORDER`, `VENDOR` | Exp 2 (Use Case), Exp 6 (Package)| `TC-ADM-01` |
