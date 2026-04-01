# WeBuild — Forward Auction Platform
### EECS 4413 — Deliverable 3

WeBuild is a real-time forward auction e-commerce platform built with Spring Boot microservices, PostgreSQL, Docker, and a JavaScript single-page application frontend. Users can list items, place bids, and receive live bid updates via WebSocket.

---

## Prerequisites

Make sure the following are installed before running the application:

| Tool | Version | Notes |
|---|---|---|
| Docker Desktop | Latest | Required — runs all services |
| Git | Any | Required — to clone the repo |
| Node.js 18+ or Python 3 | Either | Optional — only needed if not opening `app.html` directly |

> Java and Maven are **not required** — everything runs inside Docker containers.

---

## Project Structure

```
WeBuild-E_commerce_platform/
├── docker-compose.yml          ← starts all 10 containers
├── server/
│   ├── gateway-service/        ← port 8080 — single entry point
│   ├── iam-service/            ← port 8081 — authentication
│   ├── catalogue-service/      ← port 8082 — items and search
│   ├── auction-service/        ← port 8083 — bidding and WebSocket
│   └── payment-service/        ← port 8084 — payments and receipts
├── client/
│   ├── app.html                ← single page application
│   ├── css/styles.css
│   └── js/
│       ├── auth.js
│       ├── api.js
│       ├── app.js
│       └── pages/
└── test-scripts/
    ├── main_flow.ps1
    ├── corner_cases.ps1
    └── TESTING_INSTRUCTIONS.md
```

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/your-team/WeBuild-E_commerce_platform.git
cd WeBuild-E_commerce_platform
```

---

## Step 2 — Start the Backend (Docker)

Open a terminal in the project root and run:

```bash
docker-compose up -d
```

This starts all 10 containers:
- 5 Spring Boot microservices
- 5 PostgreSQL databases (one per service)

**First run takes 2-3 minutes** — Docker needs to build the images and Spring Boot needs to connect to PostgreSQL and run the seed scripts.

### Verify everything is running

```bash
docker-compose ps
```

All 10 containers should show `Up` or `Up (healthy)`:

```
NAME                STATUS
auction-db          Up (healthy)
auction-service     Up
catalogue-db        Up (healthy)
catalogue-service   Up
gateway-service     Up
iam-db              Up (healthy)
iam-service         Up
payment-db          Up (healthy)
payment-service     Up
```

### Wait for services to be ready

Watch the gateway (last service to finish starting):

```bash
docker logs gateway-service -f
```

Wait until you see:
```
Started GatewayApplication in X seconds
```

Then press `Ctrl+C` to stop watching the logs.

---

## Step 3 — Open the Frontend

**Easiest:** drag `client/app.html` directly into Chrome. The gateway accepts `file://` origins, so this works out of the box.

**Alternative — serve it locally (any method works):**

Node.js:
```bash
cd client && npx serve .
```

Python:
```bash
cd client && python -m http.server 3000
```

Then open `http://localhost:3000`.

---

## Step 4 — Use the Application

### Pre-seeded accounts

The following accounts are created automatically on startup:

| Username | Password | Role |
|---|---|---|
| winner789 | WinPass!1 | Buyer |
| loser456 | LosePass!1 | Buyer |
| seller1 | SellerPass!1 | Seller |

### Pre-seeded auction items

5 items are seeded automatically with 30-day auction durations:

| Item | Category | Starting Price |
|---|---|---|
| Vintage Watch | Accessories | $50 |
| Gaming Laptop | Electronics | $800 |
| Antique Vase | Antiques | $100 |
| Mountain Bike | Sports | $200 |
| Leather Sofa | Furniture | $300 |

### Full user flow

1. Go to `http://localhost:3000`
2. Click **Log In** and sign in with any pre-seeded account
3. Browse active auctions on the home page
4. Click any item to open the detail page
5. Enter a bid amount and click **Place Bid**
6. When an auction ends, the winner can click **Pay Now**
7. Complete payment with any 12+ digit card number and a future expiry date
8. View the receipt after payment

---

## Step 5 — Run the Test Scripts (Optional)

Open PowerShell in the project root and run:

```powershell
# Allow scripts to run (one time only)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Happy path — tests all main use cases
.\test-scripts\main_flow.ps1

# Edge cases — tests all 29 test cases with PASS/FAIL summary
.\test-scripts\corner_cases.ps1
```

See `test-scripts/TESTING_INSTRUCTIONS.md` for individual curl commands and expected responses.

---

## WebSocket — Real-Time Bidding

The application uses WebSocket to broadcast bid updates to all connected browsers instantly.

To see it in action:

1. Open the same item page in **two browser windows** side by side
2. Place a bid in one window
3. Watch the other window update the bid amount **without refreshing**

A green dot at the bottom of the bid panel confirms the WebSocket connection is active:
- 🟢 **Live updates connected** — instant updates via WebSocket
- ⚫ **Live updates unavailable** — updates every 8 seconds via polling fallback

---

## AI Chatbot

A floating **Chat Assistant** button appears on every page. Click it to ask questions about the current auctions in natural language.

Examples:
- "What items are available right now?"
- "What is the current bid on the Gaming Laptop?"
- "How does shipping work?"

The chatbot uses the Google Gemini API and fetches live item data before responding.

> **Note:** The chatbot uses a free-tier Gemini API key with a daily request limit.
> If it stops responding, the key may be exhausted. See the section below on rotating the key.

### Rotating the Gemini API key

1. Go to https://aistudio.google.com/apikey and create a new key
2. Open `docker-compose.yml` and find the gateway-service section
3. Add or update the environment variable:
   ```yaml
   gateway-service:
     environment:
       - GEMINI_API_KEY=your-new-key-here
   ```
4. Restart the gateway:
   ```bash
   docker-compose restart gateway-service
   ```

---

## Rebuilding After Code Changes

If you modify any backend Java code, rebuild the affected service image before restarting:

```bash
# Rebuild a single service (faster)
docker-compose build gateway-service
docker-compose up -d --no-deps gateway-service

# Rebuild everything from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

> The frontend (`client/`) is plain HTML/JS — no rebuild is needed for frontend changes. Just refresh the browser.

---

## Stopping the Application

```bash
# Stop all containers (keeps database data)
docker-compose down

# Stop all containers AND wipe all data (fresh start)
docker-compose down -v
```

After `docker-compose down -v`, the next `docker-compose up -d` will reseed all data from scratch with fresh 30-day auction timers.

---

## Troubleshooting

### Auctions show as ended
The auction end times have expired. Wipe and restart:
```bash
docker-compose down -v
docker-compose up -d
```
Wait 2-3 minutes, then sign in fresh.

### Cannot connect to server
Make sure Docker is running and all containers show `Up`:
```bash
docker-compose ps
```
If any container shows `Restarting`, check its logs:
```bash
docker logs <container-name> --tail 30
```

### Listing an item fails
The PostgreSQL sequence may be out of sync. Reset it:
```bash
docker exec -it catalogue-db psql -U postgres -d cataloguedb -c "SELECT setval('items_id_seq', (SELECT MAX(id) FROM items));"
```

### Frontend shows blank page
Make sure Docker is running and the gateway has fully started. Open the browser console (F12) and check for errors — a `net::ERR_CONNECTION_REFUSED` on port 8080 means the backend is not ready yet.

### Sign in says cannot connect
The gateway service may still be starting up. Wait 60 seconds after `docker-compose up -d` and try again.

---

## Database Access (Development)

Each PostgreSQL database is exposed on a host port. Connect with any PostgreSQL client (pgAdmin, DBeaver, `psql`):

| Service | Host Port | Database | Username | Password |
|---|---|---|---|---|
| IAM | 5432 | iamdb | postgres | postgres |
| Catalogue | 5433 | cataloguedb | postgres | postgres |
| Auction | 5434 | auctiondb | postgres | postgres |
| Payment | 5435 | paymentdb | postgres | postgres |

Or query directly via Docker:

```bash
docker exec -it iam-db psql -U postgres -d iamdb
```

---

## API Reference

All requests go through the gateway on port 8080. Protected endpoints require `Authorization: Bearer <token>`.

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/signup | No | Register new account |
| POST | /api/signin | No | Sign in, returns token |
| POST | /api/signout | Yes | Invalidate session |

### Catalogue
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/items | Yes | All active items |
| GET | /api/items/search?keyword=X | Yes | Keyword search |
| GET | /api/items/category/{cat} | Yes | Filter by category |
| GET | /api/items/{id} | Yes | Single item |
| POST | /api/items | Yes | List new item |
| DELETE | /api/items/{id} | Yes | Remove listing |

### Auction
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/auction/state/{itemId} | Yes | Live state and timer |
| POST | /api/auction/bid | Yes | Place a bid |
| GET | /api/auction/bids/{itemId} | Yes | Bid history |
| GET | /api/auction/winner/{itemId} | Yes | Auction winner |
| GET | /api/auction/ended | Yes | All ended auctions |

### Payment
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/payment | Yes | Process payment |
| GET | /api/payment/receipt/{itemId} | Yes | View receipt |

### Chatbot
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/chatbot | Yes | Ask the AI assistant |

---

## Team

### Dursen Tulema
- WebSocket implementation (Spring STOMP/SockJS config, `SimpMessagingTemplate` broadcast in AuctionService)
- Sign In page implementation
- WebSocket frontend integration in `item.js` (STOMP subscription, live bid display, 8s polling fallback, connection status indicator)
- Outbid panel re-render fix (UI state transition without page refresh)
- Timezone mismatch fix (datetime-local UTC conversion in `sell.js`)
- Duplicate `startLiveUpdates` function bug fix
- Watchlist, bid history, and past auctions bug fixes
- SDD writing

### Quan
- Docker Compose setup and containerization of all 5 microservices
- PostgreSQL migration from H2 (schema, init scripts, DB-per-service)
- Backend API improvements (gateway routing, endpoint fixes)
- Sign Up page implementation
- Multi-image upload on sell page with left/right gallery navigation
- Dark mode across all pages (hero, cards, forms, payment, chatbot)
- Dynamic category filter (top 5 by listing count + More dropdown)
- Image lightbox (click to zoom with Escape/click-outside to close)
- My Listings stats tracking (sold count, revenue, avg price)
- Watchlist, bid history, and past auctions bug fixes
- SDD writing

### Sunny
- Integrated Google Gemini API into the Gateway service via `GatewayChatbotService.java`
- Designed and iterated system prompt across 4 versions to improve accuracy, grounding, and refusal behaviour
- Implemented live data injection by fetching real-time item data from the Catalogue service on every request
- Added server-side JSON strip logic to handle model formatting inconsistencies
- Evaluated chatbot accuracy across price queries, off-topic inputs, out-of-stock queries, and prompt injection attempts
- Added graceful fallback handling for Gemini API quota exhaustion
- SDD writing

### Sarimah
- Frontend UI (primary)
- Implemented the Landing page
- Implemented live countdown timers on all auction item cards, updating every second
- Built the Sell Item page with full form validation (name, price, end time, shipping, condition, image upload/URL)
- Built the My Listings page with Live/Ended tabs and delete functionality
- Built the Purchases page with Purchases/Bid History tabs and receipt linking
- Added navigation dropdown menu with Sell, My Listings, and Purchases routes
- Designed and implemented a JMeter load test plan with automated test runner and results analysis scripts
- Generated performance charts (response time vs. arrival rate, throughput vs. arrival rate)
- SDD writing
