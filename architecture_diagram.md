# StayOps PMS Engine: Master Technical Architecture & Specification

This document provides a comprehensive technical architecture specification for the **StayOps Property Management System (PMS)**, covering system components, data flow sequence diagrams, database ER schemas, REST API contracts, and security architecture.

---

## 1. High-Level Component & Layer Architecture

```mermaid
graph TD
    subgraph ClientLayer ["Client Presentation Layer (React 18 + Vite SPA)"]
        FD["Frontdesk Engine<br/>(Frontdesk.jsx)"]
        RES["Reservation Engine<br/>(Reservations.jsx)"]
        CRM["Guest CRM Module<br/>(Reservations.jsx)"]
        TAX["Tax Invoice Generator<br/>(TaxInvoiceModal.jsx)"]
    end

    subgraph SecurityLayer ["Security & Interceptor Layer"]
        AUTH_FILTER["JwtAuthenticationFilter.java"]
        CORS["CorsConfigurationSource"]
    end

    subgraph ServiceLayer ["Backend Application Layer (Spring Boot 3 / Java 17)"]
        CTRL_RES["ReservationController.java<br/>(/api/reservations)"]
        CTRL_MEAL["MealOrderController.java<br/>(/api/meal-orders)"]
        CTRL_CRM["GuestProfileController.java<br/>(/api/crm/guests)"]
        
        SVC_RES["ReservationService.java"]
        SVC_MEAL["MealOrderService.java"]
        SVC_CRM["GuestProfileService.java"]
        
        REPO_RES["ReservationRepository.java"]
        REPO_MEAL["MealOrderRepository.java"]
        REPO_CRM["GuestProfileRepository.java"]
    end

    subgraph DataLayer ["Persistence Layer (MySQL 8.0)"]
        TBL_RES[("reservations table")]
        TBL_MEAL[("meal_orders table")]
        TBL_CRM[("guest_profiles table")]
        TBL_USER[("users table")]
    end

    %% Flow Connections
    FD -->|REST / JSON| AUTH_FILTER
    RES -->|REST / JSON| AUTH_FILTER
    CRM -->|REST / JSON| AUTH_FILTER
    
    AUTH_FILTER --> CORS
    CORS --> CTRL_RES
    CORS --> CTRL_MEAL
    CORS --> CTRL_CRM

    CTRL_RES --> SVC_RES --> REPO_RES --> TBL_RES
    CTRL_MEAL --> SVC_MEAL --> REPO_MEAL --> TBL_MEAL
    CTRL_CRM --> SVC_CRM --> REPO_CRM --> TBL_CRM
    
    TBL_RES -.->|Foreign Key| TBL_USER
    TBL_MEAL -.->|Foreign Key| TBL_RES
```

---

## 2. End-to-End Operational Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Client as React SPA (Frontdesk/Reservations)
    participant Auth as Spring Security (JWT Filter)
    participant Ctrl as REST Controllers
    participant Svc as Service Layer
    participant DB as MySQL Database (JPA Hibernate)

    %% 1. BOOKING CREATION
    rect rgb(240, 249, 255)
    Note over Client, DB: 1. Reservation Creation (Per-Person Pricing Algorithm)
    Client->>Auth: POST /api/reservations (Bearer <token>)
    Auth->>Ctrl: Forward Authenticated Request (UserId: 10)
    Ctrl->>Svc: createReservation(reservationDto)
    Svc->>Svc: Calculate totalAmount = baseRate * guests * nights
    Svc->>DB: INSERT INTO reservations (status='confirmed', total_amount=12500)
    DB-->>Svc: Entity Saved (ID: 42)
    Svc-->>Client: HTTP 201 Created { id: 42, bookingRef: "BK-042" }
    end

    %% 2. CHECK-IN
    rect rgb(248, 250, 252)
    Note over Client, DB: 2. Check-In State Transition
    Client->>Auth: PUT /api/reservations/42/status { "status": "checkedin" }
    Auth->>Ctrl: Validate JWT Claims & Delegate
    Ctrl->>Svc: updateReservationStatus(42, "checkedin")
    Svc->>DB: UPDATE reservations SET status = 'checkedin' WHERE id = 42
    DB-->>Client: HTTP 200 OK { status: "checkedin" }
    end

    %% 3. MEAL ORDERS
    rect rgb(240, 253, 244)
    Note over Client, DB: 3. Folio Add-on Meal Order Logging
    Client->>Auth: POST /api/meal-orders { reservationId: 42, itemName: "Dinner", amount: 850 }
    Auth->>Ctrl: Pass Request to MealOrderController
    Ctrl->>Svc: saveMealOrder(mealOrderEntity)
    Svc->>DB: INSERT INTO meal_orders (reservation_id, item_name, amount)
    DB-->>Client: HTTP 200 OK { id: 101, amount: 850.00 }
    end

    %% 4. CHECK-OUT SETTLEMENT
    rect rgb(254, 242, 242)
    Note over Client, DB: 4. Folio Settlement & Check-Out Execution
    Client->>Client: Compute Folio: Total = Base Tariff (12500) + Meals (850) = 13350
    Client->>Client: Compute Balance Owed = Total (13350) - Paid (5000) = 8350
    alt Balance Owed > 0
        Client->>Auth: PUT /api/reservations/42/payment { amountPaid: 13350, paymentStatus: "Paid in Full" }
        Auth->>Ctrl: Settle Payment Endpoint
        Ctrl->>DB: UPDATE reservations SET amount_paid = 13350, payment_status = 'Paid in Full'
    end
    Client->>Auth: PUT /api/reservations/42/status { "status": "checkedout" }
    Auth->>Ctrl: Update Status Endpoint
    Ctrl->>DB: UPDATE reservations SET status = 'checkedout'
    DB-->>Client: HTTP 200 OK (Completed Archive & Generate GST Tax Invoice)
    end
```

---

## 3. Database ER Schema Specifications

### Table 1: `reservations`
| Field Name | Datatype | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | Primary Key, Auto-Increment | Database internal primary identifier. |
| `user_id` | `BIGINT` | Foreign Key (`users.id`), NOT NULL | Owner / Manager multi-tenant account link. |
| `property_id` | `BIGINT` | Foreign Key (`properties.id`), NOT NULL | Target homestay/villa reference. |
| `booking_ref` | `VARCHAR(255)` | Unique, NOT NULL | Public reservation code (e.g. `BK-005`). |
| `guest_name` | `VARCHAR(255)` | NOT NULL | Guest full name. |
| `guest_phone` | `VARCHAR(50)` | Indexed | Contact mobile number. |
| `guest_email` | `VARCHAR(255)` | Nullable | Contact email address. |
| `room_unit` | `VARCHAR(100)` | Nullable | Assigned room or villa unit. |
| `check_in` | `DATE` | NOT NULL | Check-in arrival date. |
| `check_out` | `DATE` | NOT NULL | Scheduled departure date. |
| `guest_count` | `INT` | Default `1`, NOT NULL | Number of adult guests ($\text{Per-Person Pricing}$). |
| `total_amount` | `DECIMAL(10,2)` | NOT NULL | Base room tariff calculation. |
| `amount_paid` | `DECIMAL(10,2)` | Default `0.00`, NOT NULL | Total accumulated payments received. |
| `payment_status` | `VARCHAR(50)` | Default `'Pending'` | Status (`Paid in Full`, `Partial`, `Pending`). |
| `status` | `VARCHAR(50)` | Default `'Confirmed'` | Operations state (`confirmed`, `checkedin`, `checkedout`, `no_show`). |

### Table 2: `meal_orders`
| Field Name | Datatype | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | Primary Key, Auto-Increment | Meal order primary identifier. |
| `reservation_id` | `BIGINT` | Foreign Key (`reservations.id`) | Target room folio reservation reference. |
| `guest_name` | `VARCHAR(255)` | Nullable | Guest full name. |
| `meal_type` | `VARCHAR(100)` | Nullable | Category (`Dinner 🥘`, `Breakfast 🥞`, `Lunch 🍱`). |
| `item_name` | `VARCHAR(255)` | NOT NULL | Menu item details. |
| `amount` | `DECIMAL(10,2)` | Default `0.00` | Added price to room folio. |
| `created_at` | `DATETIME` | Default `CURRENT_TIMESTAMP` | Order timestamp. |

---

## 4. REST API Endpoint Specifications

### 1. Create Reservation
- **Endpoint**: `POST /api/reservations`
- **Headers**: `Authorization: Bearer <jwt_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "guestName": "Kiran Dev",
    "guestPhone": "9876543210",
    "guestEmail": "kiran@gmail.com",
    "checkIn": "2026-08-29",
    "checkOut": "2026-08-31",
    "guestCount": 2,
    "totalAmount": 12500.0,
    "amountPaid": 5000.0,
    "paymentStatus": "Partial",
    "propertyId": 1
  }
  ```
- **Response**: `HTTP 201 Created`

### 2. Update Operational Status
- **Endpoint**: `PUT /api/reservations/{id}/status`
- **Headers**: `Authorization: Bearer <jwt_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "status": "checkedout"
  }
  ```
- **Response**: `HTTP 200 OK`

### 3. Settle Payment & Folio
- **Endpoint**: `PUT /api/reservations/{id}/payment`
- **Headers**: `Authorization: Bearer <jwt_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "amountPaid": 13350.0,
    "paymentStatus": "Paid in Full"
  }
  ```
- **Response**: `HTTP 200 OK`

### 4. Create Database Meal Order
- **Endpoint**: `POST /api/meal-orders`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "reservationId": 42,
    "guestName": "Kiran Dev",
    "mealType": "Dinner 🥘",
    "itemName": "Coorg Akki Otti & Chicken Curry x 2",
    "amount": 850.0
  }
  ```
- **Response**: `HTTP 200 OK`

---

## 5. Security & Authentication Architecture

- **Stateless JWT Filter**: Requests pass through `JwtAuthenticationFilter.java` validating HMAC SHA-256 tokens in `Authorization: Bearer <token>`.
- **CORS Configuration**: Allowed origins configured via `CorsConfigurationSource` to accept credentials from `http://localhost:5173`.
- **RBAC & Multi-Tenancy**: All DB queries in `ReservationRepository` scope by `user_id` extracted from JWT claims (`jwtService.extractUserId(token)`), ensuring strict multi-tenant data isolation between property owners.
