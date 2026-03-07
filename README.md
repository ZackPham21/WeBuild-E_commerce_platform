# WeBuild Forward Auction E-Commerce System
## EECS 4413 — Deliverable 2

## Overview
A forward-auction e-commerce platform where sellers list items and buyers
compete by placing progressively higher bids until the auction timer expires.
Built with Spring Boot microservices architecture.

## Architecture
Five microservices communicate through a Gateway facade:

| Service           | Port | Responsibility                        |
|-------------------|------|---------------------------------------|
| Gateway Service   | 8080 | Single entry point, session validation|
| IAM Service       | 8081 | Users, authentication, sessions       |
| Catalogue Service | 8082 | Item listings, search, categories     |
| Auction Service   | 8083 | Bidding, timers, winner determination |
| Payment Service   | 8084 | Payments, receipts                    |

All services use H2 in-memory databases — **no database setup required**.

---

## Prerequisites
- Java 17 or higher
- IntelliJ IDEA (recommended) OR Maven 3.8+
- PowerShell (for test scripts, Windows)

---

## Running the Application

### Option A — IntelliJ IDEA (Recommended)

1. Open the project in IntelliJ IDEA
2. Find and run each main class by right-clicking → **Run**:
```
server/iam-service/src/main/java/.../IamServiceApplication.java
server/catalogue-service/src/main/java/.../CatalogueServiceApplication.java
server/auction-service/src/main/java/.../AuctionServiceApplication.java
server/payment-service/src/main/java/.../PaymentServiceApplication.java
server/gateway-service/src/main/java/.../GatewayServiceApplication.java
```

3. Start **Gateway last**, after the other 4 show `Started`
4. Look for `Started *Application in X seconds` in each Run tab

### Option B — Terminal (Maven required)

Open 5 separate terminals:
```bash
# Terminal 1
cd server/iam-service
mvn spring-boot:run

# Terminal 2
cd server/catalogue-service
mvn spring-boot:run

# Terminal 3
cd server/auction-service
mvn spring-boot:run

# Terminal 4
cd server/payment-service
mvn spring-boot:run

# Terminal 5 — start LAST
cd server/gateway-service
mvn spring-boot:run
```

### Verify All Services Are Running
```powershell
netstat -ano | findstr "8080 8081 8082 8083 8084"
```
You should see 5 lines with `LISTENING`.

---

## Running the Test Scripts
```powershell
# Allow scripts (run once as Administrator if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Happy path — tests all main use cases in order
.\test-scripts\main_flow.ps1

# Execute each of the postman request by their proper sequence, as some statements depend on others to work. Auction-related tests require the tester to enter a time of their own choice.
```

---

## Pre-Seeded Test Data

No manual setup needed. On startup, the following is created automatically:

### Users (IAM Service)
| Username   | Password     | Role   |
|------------|--------------|--------|
| winner789  | WinPass!1    | Buyer  |
| loser456   | LosePass!1   | Buyer  |
| seller1    | SellerPass!1 | Seller |

### Auction Items (Catalogue + Auction Services)
| ID | Item          | Category    | Starting Price | Duration |
|----|---------------|-------------|---------------|----------|
| 1  | Vintage Watch | Accessories | $50           | 48 hours |
| 2  | Gaming Laptop | Electronics | $800          | 72 hours |
| 3  | Antique Vase  | Antiques    | $100          | 24 hours |
| 4  | Mountain Bike | Sports      | $200          | 36 hours |
| 5  | Leather Sofa  | Furniture   | $300          | 96 hours |

---

## API Reference

All requests go through the **Gateway on port 8080**.  
Protected endpoints require: `Authorization: Bearer <token>`

### Authentication
| Method | Endpoint              | Auth | Description          |
|--------|-----------------------|:----:|----------------------|
| POST   | /api/signup           | No   | Register new user    |
| POST   | /api/signin           | No   | Sign in, get token   |
| POST   | /api/signout          | Yes  | Sign out             |
| POST   | /api/reset-password   | No   | Request password reset|

### Catalogue
| Method | Endpoint                        | Auth | Description          |
|--------|---------------------------------|:----:|----------------------|
| GET    | /api/items                      | Yes  | Browse active auctions|
| GET    | /api/items/search?keyword=X     | Yes  | Keyword search        |
| GET    | /api/items/category/{category}  | Yes  | Filter by category    |
| GET    | /api/items/{id}                 | Yes  | Get item details      |
| POST   | /api/items                      | Yes  | List item for auction |

### Auction
| Method | Endpoint                    | Auth | Description           |
|--------|-----------------------------|:----:|-----------------------|
| GET    | /api/auction/state/{itemId} | Yes  | Live state and timer  |
| POST   | /api/auction/bid            | Yes  | Place a bid           |
| GET    | /api/auction/winner/{itemId}| Yes  | Get auction winner    |
| GET    | /api/auction/bids/{itemId}  | Yes  | Full bid history      |

### Payment
| Method | Endpoint                        | Auth | Description           |
|--------|---------------------------------|:----:|-----------------------|
| POST   | /api/payment                    | Yes  | Process payment        |
| GET    | /api/payment/receipt/{itemId}   | Yes  | View receipt           |

---

## H2 Database Consoles

For inspecting data during development:

| Service   | URL                              | JDBC URL              |
|-----------|----------------------------------|-----------------------|
| IAM       | http://localhost:8081/h2-console | jdbc:h2:mem:iamdb     |
| Catalogue | http://localhost:8082/h2-console | jdbc:h2:mem:cataloguedb|
| Auction   | http://localhost:8083/h2-console | jdbc:h2:mem:auctiondb |
| Payment   | http://localhost:8084/h2-console | jdbc:h2:mem:paymentdb |

Username: `sa` | Password: *(leave blank)*

---

## Design Patterns Used

1. **Facade** — GatewayService is the single entry point hiding all backend complexity
2. **Repository** — Spring Data JPA repositories abstract all database operations
3. **Strategy** — Bid validation and payment validation are encapsulated as swappable logic
4. **Template Method** — RestTemplate provides consistent structure for all HTTP service calls

### Patterns Considered but Not Used
1. **Observer** — Would notify all active bidders of new bids in real-time; deferred to Deliverable 3 (WebSocket implementation)
2. **Singleton** — Spring beans are singletons by default; explicit Singleton pattern was redundant
```

---

Your final structure in IntelliJ's Project panel should look like:

WeBuild-E_commerce_platform/
├── server/
│   ├── iam-service/
│   ├── catalogue-service/
│   ├── auction-service/
│   ├── payment-service/
│   └── gateway-service/
├── test-scripts/
│   ├── main_flow.ps1        ← new
│   └── corner_cases.ps1     ← new
└── README.md                ← new
```
