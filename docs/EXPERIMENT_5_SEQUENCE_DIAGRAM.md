# Experiment 5: Sequence Diagram
## HostelBite — Hostel Food Delivery Application

**Course**: B.Tech Information Technology, 5th Semester  
**Subject**: Software Engineering Laboratory (AY 2026–27)  
**Institution**: Manipal University Jaipur  
**Authors**: Saharsh Vaibhav Lal & Vaibhav Kumar (5F Batch-1)  

---

### 1. Diagram Description
The sequence diagram details the end-to-end procedural workflow of placing, paying, preparing, delivering, and rating an order. It models interactions between:
- `Student / Resident`
- `HostelBite App` (Frontend Client)
- `Order Service` (Backend API)
- `Payment Service` (Backend API)
- `Payment Gateway` (Simulated Gateway Service)
- `HostelBite Database` (Persistent SQLite Store)
- `Vendor / Mess` (Kitchen Dashboard)
- `Delivery Agent` (Delivery Interface)

---

### 2. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student / Resident
    participant App as HostelBite App
    participant OrderSvc as Order Service
    participant PaySvc as Payment Service
    participant PG as Payment Gateway
    participant DB as HostelBite Database
    actor Vendor as Vendor / Mess
    actor Delivery as Delivery Agent

    %% 1. Browsing
    Student->>App: browseMenu()
    App->>DB: fetchAvailableMenu()
    DB-->>App: menuItems
    App-->>Student: displayMenu()

    %% 2. Checkout & Order Validation
    Student->>App: selectItemsAndPlaceOrder(items, slot, deliveryPoint)
    App->>OrderSvc: validateOrder()
    OrderSvc->>DB: checkItemAvailability()
    DB-->>OrderSvc: availabilityResult
    OrderSvc->>DB: saveOrder(Payment Pending)
    DB-->>OrderSvc: orderId, totalAmount
    OrderSvc-->>App: orderSummary
    App-->>Student: displayOrderSummary()

    %% 3. Payment Processing
    Student->>App: confirmPaymentMethod(method)
    App->>PaySvc: initiatePayment(orderId, amount)
    PaySvc->>PG: processPayment(amount, method)
    PG-->>PaySvc: paymentResultAndWebhook

    alt Payment Successful & Verified
        PaySvc->>PaySvc: verifyWebhookSignature()
        PaySvc->>DB: saveVerifiedPayment()
        DB-->>PaySvc: paymentSaved
        PaySvc->>OrderSvc: paymentVerified(orderId)
        OrderSvc->>DB: updateOrderStatus(Placed)
        DB-->>OrderSvc: statusUpdated
        OrderSvc-->>App: orderConfirmed
        App-->>Student: displayConfirmation()

        %% Vendor Notification & Preparation
        OrderSvc->>Vendor: sendNewOrder(orderDetails)
        Vendor->>OrderSvc: acceptOrder()
        OrderSvc->>DB: updateOrderStatus(Accepted)
        OrderSvc-->>App: notifyOrderAccepted()
        App-->>Student: orderAcceptedNotification()

        Vendor->>OrderSvc: updateStatus(Preparing)
        OrderSvc->>DB: updateOrderStatus(Preparing)

        Vendor->>OrderSvc: updateStatus(Ready)
        OrderSvc->>DB: updateOrderStatus(Ready)

        %% Delivery Claim & Fulfillment
        OrderSvc->>Delivery: offerDeliveryAssignment(orderDetails)
        Delivery->>OrderSvc: acceptDelivery()
        OrderSvc->>DB: saveDeliveryAssignment()
        Delivery->>OrderSvc: updateStatus(Out for Delivery)
        OrderSvc->>DB: updateOrderStatus(Out for Delivery)
        OrderSvc-->>App: deliveryStatusUpdate()
        App-->>Student: showDeliveryStatus()

        Delivery->>OrderSvc: confirmDelivery()
        OrderSvc->>DB: updateOrderStatus(Delivered)
        OrderSvc-->>App: deliveryConfirmation()
        App-->>Student: notifyDelivered()

        opt Student submits feedback
            Student->>App: submitRatingAndReview(rating, comment)
            App->>DB: saveReview()
            DB-->>App: reviewSaved
            App-->>Student: reviewConfirmation()
        end

        opt Student raises a complaint
            Student->>App: raiseComplaint(category, description)
            App->>DB: saveComplaint()
            DB-->>App: complaintRegistered
            App-->>Student: complaintConfirmation()
        end

    else Payment Failed or Verification Unsuccessful
        PaySvc-->>App: paymentFailure()
        App-->>Student: showFailureAndRetryOption()
    end
```

---

### 3. Safety & Transactional Flow Analysis
In academic UML documentation, some preliminary diagrams occasionally depict notifying the kitchen prior to payment verification. However, in our production-ready implementation, **HostelBite enforces strict financial safety**:
1. The order is initially persisted with `Payment Pending` status.
2. The payment transaction is processed and verified against the simulated gateway.
3. Only when payment is confirmed does the order transition to `Placed`, at which point it becomes visible on the Vendor Dashboard.
4. If payment fails, the order is flagged `Payment Failed` and is never dispatched to the kitchen queue, preventing kitchen inventory losses.
