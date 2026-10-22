# Experiment 6: Activity and Package Diagrams
## HostelBite — Hostel Food Delivery Application

**Course**: B.Tech Information Technology, 5th Semester  
**Subject**: Software Engineering Laboratory (AY 2026–27)  
**Institution**: Manipal University Jaipur  
**Authors**: Saharsh Vaibhav Lal & Vaibhav Kumar (5F Batch-1)  

---

### 1. Activity Diagram: Food Ordering Process
The Activity diagram models the control flow through user actions, decisions, and system validations from application launch to delivery hand-off and feedback.

```mermaid
flowchart TD
    Start((●)) --> OpenApp["Open HostelBite Application"]
    OpenApp --> BrowseMenu["Browse Mess & Vendor Menus"]
    BrowseMenu --> SelectFood["Select Food Items & Add to Cart"]
    SelectFood --> ReviewCart["Review Cart & Total Amount"]

    ReviewCart --> CheckAvail{"Items\nAvailable?"}
    CheckAvail -->|No| ItemsUnavailable["Display Items Unavailable Message"]
    ItemsUnavailable --> EndFail1((◉))

    CheckAvail -->|Yes| SelectPay["Select Payment Method (UPI / Card / Wallet)"]
    SelectPay --> ProcessPay["Process Payment via Gateway"]

    ProcessPay --> CheckPay{"Payment\nSuccessful?"}
    CheckPay -->|No| PayFail["Display Payment Failure Message & Retry"]
    PayFail --> EndFail2((◉))

    CheckPay -->|Yes| SaveOrder["Save Order & Payment Details (State: Placed)"]
    SaveOrder --> SendVendor["Send Order to Vendor / Mess Queue"]

    SendVendor --> CheckAccept{"Vendor\nAccepts?"}
    CheckAccept -->|No| RejectNotice["Notify Student of Rejection"]
    RejectNotice --> AutoRefund["Cancel Order & Auto-Refund to Wallet"]
    AutoRefund --> EndFail3((◉))

    CheckAccept -->|Yes| PrepareFood["Prepare Food (State: Preparing)"]
    PrepareFood --> MarkReady["Mark Food Ready for Pickup (State: Ready)"]
    MarkReady --> AssignAgent["Claim / Assign Delivery Agent"]
    AssignAgent --> Dispatch["Out for Delivery to Hostel Block"]
    Dispatch --> DeliverOrder["Deliver Order at Room / Delivery Point"]
    DeliverOrder --> UpdateDelivered["Update Status to Delivered"]
    UpdateDelivered --> OrderReceipt["Show Order Confirmation & Rating Prompt"]
    OrderReceipt --> EndSuccess((◉))
```

---

### 2. Package Diagram: System Architecture
The Package diagram illustrates the tiered modular organization and layer dependencies across the system.

```mermaid
flowchart TD
    subgraph Presentation_Layer ["«package» Presentation Layer"]
        direction LR
        UI_Student["Student App\n(UI)"]
        UI_Vendor["Vendor Dashboard\n(UI)"]
        UI_Delivery["Delivery Interface\n(UI)"]
        UI_Admin["Admin Dashboard\n(UI)"]
    end

    subgraph Application_Services ["«package» Application Services"]
        direction TB
        subgraph Row1 [" "]
            direction LR
            Svc_User["User\nManagement"]
            Svc_Menu["Menu & Vendor\nManagement"]
            Svc_Order["Order\nManagement"]
            Svc_Pay["Payment &\nWallet Management"]
        end
        subgraph Row2 [" "]
            direction LR
            Svc_Delivery["Delivery\nManagement"]
            Svc_Complaint["Complaint & Refund\nManagement"]
            Svc_Notify["Notifications\n& Alerts"]
            Svc_Analytics["Reporting &\nAnalytics"]
        end
    end

    subgraph Data_Storage ["«package» Data Access and Storage"]
        direction LR
        Repo_DAL["Repositories\n(Data Access Layer)"]
        DB_SQLite["SQLite / Relational\nDatabase"]
        Cache_Store["In-Memory State\n& Cache"]
    end

    subgraph External_Services ["«package» External Services"]
        direction LR
        Ext_Gateway["Payment Gateway\n(Simulated / Razorpay)"]
        Ext_Push["Push Notifications\n(In-App / Firebase)"]
        Ext_SMS["SMS Service\n(Dev-Mode Fallback)"]
    end

    %% Dependencies
    Presentation_Layer -. "«dependency»" .-> Application_Services
    Application_Services -. "«dependency»" .-> Data_Storage
    Application_Services -. "«dependency»" .-> External_Services
```

---

### 3. Layer Responsibilities
- **Presentation Layer**: Built with React, TypeScript, and Vite. Implements clean, responsive student menus, kitchen Kanban boards, courier task lists, and administrative oversight consoles.
- **Application Services Layer**: Built with Node.js and Express.js. Contains domain logic, order lifecycle state validations, cart price recalculations, and role authorization middlewares.
- **Data Access and Storage Layer**: Uses SQLite with strict foreign keys and transactional operations to safeguard order, payment, and wallet ledgers.
- **External Services**: Encapsulates external communications (payment verification simulation and notifications).
