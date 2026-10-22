# Experiment 3: Data Flow Diagrams (DFD) and Entity-Relationship Diagram (ERD)
## HostelBite — Hostel Food Delivery Application

**Course**: B.Tech Information Technology, 5th Semester  
**Subject**: Software Engineering Laboratory (AY 2026–27)  
**Institution**: Manipal University Jaipur  
**Authors**: Saharsh Vaibhav Lal & Vaibhav Kumar (5F Batch-1)  

---

### 1. Data Flow Diagrams

#### 1.1 Context-Level DFD (Level 0)
The Level 0 Context DFD represents the fundamental data boundary of HostelBite, showing incoming and outgoing data flows between external entities and the central application process.

```mermaid
flowchart TD
    %% External Entities
    E_Student["fa:fa-user Student / Resident"]
    E_Vendor["fa:fa-store Vendor / Mess Manager"]
    E_MessComm["fa:fa-users Mess Committee"]
    E_Delivery["fa:fa-biking Delivery Agent"]
    E_Admin["fa:fa-user-shield Hostel Administrator"]
    E_Gateway["fa:fa-credit-card Payment Gateway"]
    E_Notify["fa:fa-bell Notification Service"]

    %% Central Process
    P_System(("0. HostelBite Food Delivery System"))

    %% Student Flows
    E_Student -->|"Registration / Login Data, Orders, Payments, Ratings, Complaints"| P_System
    P_System -->|"Authentication Result, Menu Items, Order Status, Receipts"| E_Student

    %% Vendor Flows
    E_Vendor -->|"Menu & Availability Updates, Order Acceptance / Rejection"| P_System
    P_System -->|"Incoming Paid Orders, Status Updates, Complaints & Reviews"| E_Vendor

    %% Mess Committee Flows
    E_MessComm -->|"Daily Meal Plan, Subscription Config"| P_System
    P_System -->|"Meal Counts, Wastage Projections, Reports"| E_MessComm

    %% Delivery Agent Flows
    E_Delivery -->|"Availability Status, Delivery Confirmation"| P_System
    P_System -->|"Assigned Ready Orders, Hostel Block & Delivery Points"| E_Delivery

    %% Administrator Flows
    E_Admin -->|"Vendor Approvals / Suspensions, Refund Authorizations"| P_System
    P_System -->|"Campus Analytics, Vendor Dossiers, Audit Logs"| E_Admin

    %% Payment Gateway Flows
    P_System -->|"Payment Verification Request, Refund Request"| E_Gateway
    E_Gateway -->|"Payment Confirmation / Failure Webhook Callback"| P_System

    %% Notification Service Flows
    P_System -->|"Trigger Push / In-App Notification"| E_Notify
    E_Notify -->|"Delivery Status Acknowledgment"| P_System
```

---

#### 1.2 Level 1 DFD
The Level 1 DFD decomposes the central system into six core functional sub-processes and five persistent data stores.

```mermaid
flowchart TD
    %% Entities
    Student["Student"]
    Vendor["Vendor"]
    Delivery["Delivery Agent"]
    Admin["Administrator"]
    PG["Payment Gateway"]
    NS["Notification Service"]

    %% Processes
    P1["1.0 Registration & Auth\n(Signup, OTP, Login)"]
    P2["2.0 Menu & Vendor Mgmt\n(Onboarding, Catalog)"]
    P3["3.0 Order Processing\n(Cart, Checkout, Validation)"]
    P4["4.0 Payment & Wallet\n(Checkout, Top-up, Refund)"]
    P5["5.0 Delivery Mgmt\n(Assignment, Tracking)"]
    P6["6.0 Feedback & Notify\n(Ratings, Complaints, Alerts)"]

    %% Data Stores
    D1[("D1 Users")]
    D2[("D2 Menu Items")]
    D3[("D3 Orders & Items")]
    D4[("D4 Payments & Wallet")]
    D5[("D5 Reviews & Complaints")]

    %% Process 1: Auth
    Student -->|"Credentials & Hostel Details"| P1
    P1 <-->|"Read/Write Profile"| D1

    %% Process 2: Menu
    Vendor -->|"Catalog Items & Availability"| P2
    P2 <-->|"Menu Data"| D2

    %% Process 3: Order Processing
    Student -->|"Cart Items & Delivery Point"| P3
    P3 -->|"Fetch Prices & Stock"| D2
    P3 -->|"Create Order (Pending)"| D3

    %% Process 4: Payment
    P3 -->|"Initiate Payment"| P4
    P4 <-->|"Process / Webhook"| PG
    P4 -->|"Update Payment Record"| D4
    P4 -->|"Update Order (Placed)"| D3

    %% Process 5: Delivery
    D3 -->|"Ready Orders"| P5
    Delivery <-->|"Claim & Confirm Drop-off"| P5
    P5 -->|"Update Status"| D3

    %% Process 6: Feedback & Admin
    Student -->|"Review & Complaint"| P6
    P6 -->|"Store Feedback"| D5
    Admin -->|"Resolve Dispute"| P6
    P6 -->|"Trigger Alert"| NS
```

---

### 2. Entity-Relationship Diagram (ERD)

The conceptual schema encompasses the eight core entities from the approved class diagram alongside supporting entities (`WALLET_TRANSACTION`, `DELIVERY_ASSIGNMENT`, `NOTIFICATION`).

```mermaid
erDiagram
    USER ||--o{ ORDER : "places"
    USER ||--o{ WALLET_TRANSACTION : "owns"
    USER ||--o| VENDOR : "operates"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ DELIVERY_ASSIGNMENT : "fulfills"

    VENDOR ||--o{ MENU_ITEM : "manages"
    VENDOR ||--o{ ORDER : "receives"

    ORDER ||--|{ ORDER_ITEM : "contains"
    MENU_ITEM ||--o{ ORDER_ITEM : "referenced_in"

    ORDER ||--|| PAYMENT : "settled_by"
    ORDER ||--o| REVIEW : "rated_by"
    ORDER ||--o| COMPLAINT : "disputed_in"
    ORDER ||--o| DELIVERY_ASSIGNMENT : "assigned_to"

    USER {
        string user_id PK
        string name
        string email UK
        string mobile
        string password_hash
        string role
        string hostel_block
        string floor
        string room
        decimal wallet_balance
        string status
        datetime created_at
    }

    VENDOR {
        string vendor_id PK
        string user_id FK
        string business_name
        string fssai_license
        string cuisine_category
        string serviceable_blocks
        string delivery_time_window
        decimal minimum_order_value
        boolean accepting_orders
        string status
    }

    MENU_ITEM {
        string item_id PK
        string vendor_id FK
        string item_name
        string description
        decimal price
        string dietary_tag
        boolean availability
        string photo
        boolean is_new
    }

    ORDER {
        string order_id PK
        string student_id FK
        string vendor_id FK
        string delivery_point
        string delivery_slot
        decimal subtotal
        decimal delivery_fee
        decimal platform_fee
        decimal total_amount
        string status
        string special_instructions
        datetime order_date
    }

    ORDER_ITEM {
        string order_item_id PK
        string order_id FK
        string item_id FK
        int quantity
        decimal unit_price
        decimal subtotal
        string customization_notes
    }

    PAYMENT {
        string payment_id PK
        string order_id FK
        decimal amount
        string payment_method
        string transaction_id
        string payment_status
        datetime payment_date
    }

    WALLET_TRANSACTION {
        string transaction_id PK
        string user_id FK
        string order_id FK
        decimal amount
        string transaction_type
        decimal balance_after
        string description
        datetime transaction_date
    }

    REVIEW {
        string review_id PK
        string order_id FK
        string student_id FK
        string vendor_id FK
        int rating
        string review_text
        string photo
        string vendor_response
        datetime review_date
    }

    COMPLAINT {
        string complaint_id PK
        string order_id FK
        string student_id FK
        string vendor_id FK
        string issue_category
        string description
        string status
        decimal refund_amount
        string resolution_reason
        datetime created_at
        datetime resolved_at
    }

    DELIVERY_ASSIGNMENT {
        string assignment_id PK
        string order_id FK
        string agent_id FK
        string status
        datetime assigned_at
        datetime delivered_at
    }

    NOTIFICATION {
        string notification_id PK
        string user_id FK
        string title
        string message
        string type
        boolean is_read
        string link
        datetime created_at
    }
```
