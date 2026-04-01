# WeBuild — Forward Auction Platform
### EECS 4413 — Deliverable 3

WeBuild is a real-time forward auction e-commerce platform built with Spring Boot microservices, PostgreSQL, Docker, and a JavaScript single-page application frontend. Users can list items, place bids, and receive live bid updates via WebSocket.

---

## Prerequisites

Make sure the following are installed before running the application:

| Tool | Version | Download |
|---|---|---|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Node.js | 18+ | https://nodejs.org |
| Git | Any | https://git-scm.com |

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

## Step 3 — Start the Frontend

Open a **new terminal** in the `client/` folder:

```bash
cd client
npx serve .
```

You will see output like:

```
Serving!
- Local:    http://localhost:3000
```

Open `http://localhost:3000` in your browser.

> **Note:** The frontend must be served from a local server, not opened as a file directly.
> Opening `app.html` directly with `file://` will cause CORS errors.

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
Make sure you are running `npx serve .` from inside the `client/` folder, not opening the file directly in the browser.

### Sign in says cannot connect
The gateway service may still be starting up. Wait 60 seconds after `docker-compose up -d` and try again.

---

## H2 Console (Development Only)

If the services are running locally with H2 (not Docker), the database consoles are available at:

| Service | URL | JDBC URL |
|---|---|---|
| IAM | http://localhost:8081/h2-console | jdbc:h2:mem:iamdb |
| Catalogue | http://localhost:8082/h2-console | jdbc:h2:mem:cataloguedb |
| Auction | http://localhost:8083/h2-console | jdbc:h2:mem:auctiondb |
| Payment | http://localhost:8084/h2-console | jdbc:h2:mem:paymentdb |

Username: `sa` | Password: *(leave blank)*

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

| Member | Role |
|---|---|
| Dursen Tulema | WebSocket implementation, Sign In page, frontend bug fixes, SDD |
| Quan | Docker, PostgreSQL migration, backend improvements, Sign Up page, SDD |
| Sunny | AI chatbot (distinguishable feature), SDD |
| Sarimah | Frontend UI (primary), SDD |
