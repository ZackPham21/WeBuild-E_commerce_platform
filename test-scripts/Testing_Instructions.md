# WeBuild Forward Auction System — Testing Instructions
## EECS 4413 — Deliverable 2

---

## Prerequisites

- Java 17 or higher installed
- Maven 3.8+ installed (or use IntelliJ to run services)
- Windows PowerShell or Command Prompt
- All 5 services must be running before testing

---

## Step 1 — Start All 5 Services

Open **5 separate PowerShell windows** and run one command in each.  
Wait for `Started *Application in X seconds` before moving to the next.

```powershell
# Window 1 - IAM Service (Port 8081)
cd C:\Users\dursa\IdeaProjects\WeBuild-E_commerce_platform\server\iam-service
mvn spring-boot:run
```

```powershell
# Window 2 - Catalogue Service (Port 8082)
cd C:\Users\dursa\IdeaProjects\WeBuild-E_commerce_platform\server\catalogue-service
mvn spring-boot:run
```

```powershell
# Window 3 - Auction Service (Port 8083)
cd C:\Users\dursa\IdeaProjects\WeBuild-E_commerce_platform\server\auction-service
mvn spring-boot:run
```

```powershell
# Window 4 - Payment Service (Port 8084)
cd C:\Users\dursa\IdeaProjects\WeBuild-E_commerce_platform\server\payment-service
mvn spring-boot:run
```

```powershell
# Window 5 - Gateway Service (Port 8080) — START THIS LAST
cd C:\Users\dursa\IdeaProjects\WeBuild-E_commerce_platform\server\gateway-service
mvn spring-boot:run
```

### Verify all services are running

```powershell
netstat -ano | findstr "8080 8081 8082 8083 8084"
```

You should see 5 lines with `LISTENING`. If any are missing, that service failed to start — check its window for errors.

---

## Step 2 — Open a New PowerShell Window for Testing

All curl commands below go in this window.  
**All results print directly in PowerShell — no browser required.**

> Note: On Windows, always use `curl.exe` not `curl` to avoid PowerShell's built-in alias.

---

## Step 3 — Run the curl Tests

---

### (1) Sign Up — POST 3 new users

```powershell
curl.exe -X POST -H "Content-Type: application/json" -d "{\"username\":\"alice\",\"password\":\"Pass1234!\",\"firstName\":\"Alice\",\"lastName\":\"Smith\",\"streetNumber\":\"1\",\"streetName\":\"Bay St\",\"city\":\"Toronto\",\"country\":\"Canada\",\"postalCode\":\"M5J2T3\"}" http://localhost:8080/api/signup
```

```powershell
curl.exe -X POST -H "Content-Type: application/json" -d "{\"username\":\"bob\",\"password\":\"Pass1234!\",\"firstName\":\"Bob\",\"lastName\":\"Jones\",\"streetNumber\":\"2\",\"streetName\":\"Yonge St\",\"city\":\"Toronto\",\"country\":\"Canada\",\"postalCode\":\"M4W2G8\"}" http://localhost:8080/api/signup
```

```powershell
curl.exe -X POST -H "Content-Type: application/json" -d "{\"username\":\"carol\",\"password\":\"Pass1234!\",\"firstName\":\"Carol\",\"lastName\":\"Lee\",\"streetNumber\":\"3\",\"streetName\":\"Queen St\",\"city\":\"Toronto\",\"country\":\"Canada\",\"postalCode\":\"M5V2A1\"}" http://localhost:8080/api/signup
```

**Expected response for each:**
```json
{"success": true, "message": "Account created successfully."}
```

---

### (2) Sign Up with Duplicate Username — should fail

```powershell
curl.exe -X POST -H "Content-Type: application/json" -d "{\"username\":\"alice\",\"password\":\"Another123\",\"firstName\":\"Fake\",\"lastName\":\"Alice\",\"streetNumber\":\"9\",\"streetName\":\"Fake St\",\"city\":\"Toronto\",\"country\":\"Canada\",\"postalCode\":\"M5H2N2\"}" http://localhost:8080/api/signup
```

**Expected response:**
```json
{"success": false, "message": "Username already exists."}
```

---

### (3) Sign In — POST to get session token

```powershell
curl.exe -X POST -H "Content-Type: application/json" -d "{\"username\":\"alice\",\"password\":\"Pass1234!\"}" http://localhost:8080/api/signin
```

**Expected response:**
```json
{
  "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "userId": 4,
  "username": "alice"
}
```

> **Important:** Copy the token value from this response.  
> Set it as a variable for all remaining commands:

```powershell
$TOKEN = "paste-your-token-here"
```

---

### (4) Sign In with Wrong Password — should fail

```powershell
curl.exe -X POST -H "Content-Type: application/json" -d "{\"username\":\"alice\",\"password\":\"WrongPass\"}" http://localhost:8080/api/signin
```

**Expected response:**
```json
{"success": false, "message": "Invalid username or password."}
```

---

### (5) Sign In with Non-Existent User — should fail

```powershell
curl.exe -X POST -H "Content-Type: application/json" -d "{\"username\":\"nobody_xyz\",\"password\":\"Pass123\"}" http://localhost:8080/api/signin
```

**Expected response:**
```json
{"success": false, "message": "Invalid username or password."}
```

---

### (6) Browse All Active Auction Items — GET

```powershell
curl.exe -X GET http://localhost:8080/api/items -H "Authorization: Bearer $TOKEN"
```

**Expected response:** All 5 seeded items:
```json
[
  {"id": 1, "name": "Vintage Watch",  "category": "Accessories", "startingPrice": 50.0,  "status": "ACTIVE"},
  {"id": 2, "name": "Gaming Laptop",  "category": "Electronics", "startingPrice": 800.0, "status": "ACTIVE"},
  {"id": 3, "name": "Antique Vase",   "category": "Antiques",    "startingPrice": 100.0, "status": "ACTIVE"},
  {"id": 4, "name": "Mountain Bike",  "category": "Sports",      "startingPrice": 200.0, "status": "ACTIVE"},
  {"id": 5, "name": "Leather Sofa",   "category": "Furniture",   "startingPrice": 300.0, "status": "ACTIVE"}
]
```

---

### (7) Search Items by Keyword — GET

```powershell
curl.exe -X GET "http://localhost:8080/api/items/search?keyword=laptop" -H "Authorization: Bearer $TOKEN"
```

**Expected response:** Only the Gaming Laptop:
```json
[{"id": 2, "name": "Gaming Laptop", "category": "Electronics", "startingPrice": 800.0}]
```

---

### (8) Search Keyword With No Results — GET

```powershell
curl.exe -X GET "http://localhost:8080/api/items/search?keyword=xyznomatch" -H "Authorization: Bearer $TOKEN"
```

**Expected response:** Empty array:
```json
[]
```

---

### (9) Filter Items by Category — GET

```powershell
curl.exe -X GET http://localhost:8080/api/items/category/Electronics -H "Authorization: Bearer $TOKEN"
```

**Expected response:** Only Electronics items:
```json
[{"id": 2, "name": "Gaming Laptop", "category": "Electronics"}]
```

---

### (10) Get Single Item by ID — GET

```powershell
curl.exe -X GET http://localhost:8080/api/items/1 -H "Authorization: Bearer $TOKEN"
```

**Expected response:**
```json
{
  "id": 1,
  "name": "Vintage Watch",
  "category": "Accessories",
  "startingPrice": 50.0,
  "shippingCost": 10.0,
  "expeditedShippingCost": 25.0,
  "shippingDays": 7,
  "status": "ACTIVE"
}
```

---

### (11) Get Live Auction State with Countdown Timer — GET

```powershell
curl.exe -X GET http://localhost:8080/api/auction/state/1 -H "Authorization: Bearer $TOKEN"
```

**Expected response:**
```json
{
  "auctionId": 1,
  "itemId": 1,
  "status": "OPEN",
  "currentHighestBid": 50.0,
  "highestBidderId": "none",
  "highestBidderUsername": "none",
  "secondsRemaining": 171234,
  "endTime": "2026-03-06T06:17:14"
}
```

> Run this command twice with a few seconds between — `secondsRemaining` should decrease, confirming the timer is counting down.

---

### (12) Place a Valid Bid — POST

```powershell
curl.exe -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"itemId\":1,\"amount\":75}" http://localhost:8080/api/auction/bid
```

**Expected response:**
```json
{
  "success": true,
  "reason": "SUCCESS",
  "newHighestBid": 75,
  "newHighestBidderUsername": "alice",
  "newHighestBidderId": 4,
  "timeRemaining": 171230
}
```

---

### (13) Place Three More Bids on Different Items — POST

```powershell
curl.exe -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"itemId\":2,\"amount\":900}" http://localhost:8080/api/auction/bid
```

```powershell
curl.exe -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"itemId\":3,\"amount\":150}" http://localhost:8080/api/auction/bid
```

**Expected response for each:**
```json
{"success": true, "reason": "SUCCESS", "newHighestBid": 900}
```

---

### (14) Bid Equal to Current Highest — should fail

```powershell
curl.exe -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"itemId\":1,\"amount\":75}" http://localhost:8080/api/auction/bid
```

**Expected response:**
```json
{"success": false, "reason": "FAIL_BID_TOO_LOW"}
```

---

### (15) Bid Lower Than Current — should fail

```powershell
curl.exe -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"itemId\":1,\"amount\":50}" http://localhost:8080/api/auction/bid
```

**Expected response:**
```json
{"success": false, "reason": "FAIL_BID_TOO_LOW"}
```

---

### (16) Decimal (Non-Integer) Bid — should fail

```powershell
curl.exe -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"itemId\":1,\"amount\":76.50}" http://localhost:8080/api/auction/bid
```

**Expected response:**
```json
{"success": false, "reason": "FAIL_NOT_INTEGER"}
```

---

### (17) View Bid History — GET

```powershell
curl.exe -X GET http://localhost:8080/api/auction/bids/1 -H "Authorization: Bearer $TOKEN"
```

**Expected response:** All bids placed on item 1 in order:
```json
[
  {
    "id": 1,
    "auctionId": 1,
    "userId": 4,
    "username": "alice",
    "amount": 75.0,
    "timestamp": "2026-03-04T07:00:00"
  }
]
```

---

### (18) Get Auction Winner — GET

```powershell
curl.exe -X GET http://localhost:8080/api/auction/winner/1 -H "Authorization: Bearer $TOKEN"
```

**Expected response:**
```json
{
  "winnerId": 4,
  "winnerUsername": "alice",
  "winningBid": 75.0,
  "itemId": 1
}
```

---

### (19) Non-Winner Tries to Pay — should fail

First sign in as bob and get his token:

```powershell
curl.exe -X POST -H "Content-Type: application/json" -d "{\"username\":\"winner789\",\"password\":\"WinPass!1\"}" http://localhost:8080/api/signin
```

Set his token:
```powershell
$LOSER_TOKEN = "paste-bobs-token-here"
```

Bob tries to pay for item 1 (alice won it):
```powershell
curl.exe -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $LOSER_TOKEN" -d "{\"itemId\":1,\"expedited\":false,\"cardNumber\":\"4111111111111111\",\"cardHolderName\":\"Bob Jones\",\"expirationDate\":\"12/27\",\"securityCode\":\"123\"}" http://localhost:8080/api/payment
```

**Expected response:**
```json
{"success": false, "message": "Only the winning bidder can pay for this item."}
```

---

### (20) Payment with Invalid Card Number — should fail

```powershell
curl.exe -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"itemId\":1,\"expedited\":false,\"cardNumber\":\"1234567890\",\"cardHolderName\":\"Alice Smith\",\"expirationDate\":\"12/27\",\"securityCode\":\"123\"}" http://localhost:8080/api/payment
```

**Expected response:**
```json
{"success": false, "message": "Invalid card number."}
```

---

### (21) Payment with Expired Card — should fail

```powershell
curl.exe -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"itemId\":1,\"expedited\":false,\"cardNumber\":\"4111111111111111\",\"cardHolderName\":\"Alice Smith\",\"expirationDate\":\"01/20\",\"securityCode\":\"123\"}" http://localhost:8080/api/payment
```

**Expected response:**
```json
{"success": false, "message": "Card has expired."}
```

---

### (22) Valid Payment with Expedited Shipping — POST

```powershell
curl.exe -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"itemId\":1,\"expedited\":true,\"cardNumber\":\"4111111111111111\",\"cardHolderName\":\"Alice Smith\",\"expirationDate\":\"12/27\",\"securityCode\":\"123\"}" http://localhost:8080/api/payment
```

**Expected response:**
```json
{
  "success": true,
  "message": "Payment processed successfully.",
  "paymentId": 1,
  "totalAmount": 110.0,
  "maskedCard": "****-****-****-1111"
}
```

> Total is calculated as: winning bid ($75) + shipping ($10) + expedited ($25) = **$110**  
> The full card number is never stored — only the masked last 4 digits.

---

### (23) Duplicate Payment for Same Item — should fail

```powershell
curl.exe -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"itemId\":1,\"expedited\":true,\"cardNumber\":\"4111111111111111\",\"cardHolderName\":\"Alice Smith\",\"expirationDate\":\"12/27\",\"securityCode\":\"123\"}" http://localhost:8080/api/payment
```

**Expected response:**
```json
{"success": false, "message": "Payment already processed for this item."}
```

---

### (24) View Receipt — GET

```powershell
curl.exe -X GET http://localhost:8080/api/payment/receipt/1 -H "Authorization: Bearer $TOKEN"
```

**Expected response:**
```json
{
  "receiptId": 1,
  "itemId": 1,
  "winnerUsername": "alice",
  "winningBid": 75.0,
  "shippingCost": 10.0,
  "expedited": true,
  "totalAmount": 110.0,
  "maskedCardNumber": "****-****-****-1111",
  "processedAt": "2026-03-04T07:05:00"
}
```

---

### (25) Access Protected Route Without Token — should fail

```powershell
curl.exe -X GET http://localhost:8080/api/items
```

**Expected response:**
```json
{"error": "No session token provided."}
```

---

### (26) Sign Out — POST

```powershell
curl.exe -X POST http://localhost:8080/api/signout -H "Authorization: Bearer $TOKEN"
```

**Expected response:**
```json
{"success": true, "message": "Signed out successfully."}
```

---

### (27) Use Token After Sign Out — should fail

```powershell
curl.exe -X GET http://localhost:8080/api/items -H "Authorization: Bearer $TOKEN"
```

**Expected response:**
```json
{"error": "Invalid or expired session token."}
```

---

## Pre-Seeded Test Data

The following data is created automatically on startup — no manual setup needed.

### Users (IAM Service)

| Username  | Password     |
|-----------|--------------|
| winner789 | WinPass!1    |
| loser456  | LosePass!1   |
| seller1   | SellerPass!1 |

### Auction Items (Catalogue + Auction Services)

| ID | Item          | Category    | Starting Price | Duration |
|----|---------------|-------------|----------------|----------|
| 1  | Vintage Watch | Accessories | $50            | 48 hours |
| 2  | Gaming Laptop | Electronics | $800           | 72 hours |
| 3  | Antique Vase  | Antiques    | $100           | 24 hours |
| 4  | Mountain Bike | Sports      | $200           | 36 hours |
| 5  | Leather Sofa  | Furniture   | $300           | 96 hours |

---

## H2 Database Console (Optional — Browser)

The only thing that opens in a browser is the H2 database console for inspecting raw data:

| Service   | URL                               | JDBC URL                 |
|-----------|-----------------------------------|--------------------------|
| IAM       | http://localhost:8081/h2-console  | jdbc:h2:mem:iamdb        |
| Catalogue | http://localhost:8082/h2-console  | jdbc:h2:mem:cataloguedb  |
| Auction   | http://localhost:8083/h2-console  | jdbc:h2:mem:auctiondb    |
| Payment   | http://localhost:8084/h2-console  | jdbc:h2:mem:paymentdb    |

**Login:** Username `sa` | Password *(leave blank)*

---

## Service Architecture

All requests go through the **Gateway on port 8080**.  
The Gateway validates your session token and routes to the correct backend service.

```
Your curl command
      |
      v
Gateway (8080)  <-- validates token with IAM
      |
      +---> IAM Service       (8081) - users, sessions
      +---> Catalogue Service (8082) - items, search
      +---> Auction Service   (8083) - bids, timers
      +---> Payment Service   (8084) - payments, receipts
```

---

## Quick Test Summary

| # | Test | Method | Expected |
|---|------|--------|----------|
| 1 | Sign up new user | POST | 200 success |
| 2 | Duplicate username | POST | 400 rejected |
| 3 | Sign in correct | POST | 200 + token |
| 4 | Sign in wrong password | POST | 401 rejected |
| 5 | Sign in non-existent user | POST | 401 rejected |
| 6 | Browse all active items | GET | 200 + 5 items |
| 7 | Search by keyword | GET | 200 + matching items |
| 8 | Search no results | GET | 200 + empty array |
| 9 | Filter by category | GET | 200 + filtered items |
| 10 | Get single item | GET | 200 + item details |
| 11 | Auction state + timer | GET | 200 + secondsRemaining |
| 12 | Valid bid | POST | 200 + SUCCESS |
| 13 | Bid equal to current | POST | 400 FAIL_BID_TOO_LOW |
| 14 | Bid lower than current | POST | 400 FAIL_BID_TOO_LOW |
| 15 | Decimal bid | POST | 400 FAIL_NOT_INTEGER |
| 16 | Bid history | GET | 200 + bid list |
| 17 | Auction winner | GET | 200 + winner details |
| 18 | Non-winner payment | POST | 400 rejected |
| 19 | Invalid card number | POST | 400 rejected |
| 20 | Expired card | POST | 400 rejected |
| 21 | Valid payment + expedited | POST | 200 + receipt |
| 22 | Duplicate payment | POST | 400 rejected |
| 23 | View receipt | GET | 200 + receipt details |
| 24 | No token access | GET | 400 rejected |
| 25 | Sign out | POST | 200 success |
| 26 | Token after sign out | GET | 401 rejected |