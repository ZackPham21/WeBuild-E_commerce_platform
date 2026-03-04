# ============================================================
# WeBuild Forward Auction System - curl Test Script
# For Git Bash on Windows, Mac, or Linux
# Usage: bash test-scripts/curl_tests.sh
# ============================================================

BASE="http://localhost:8080/api"

echo "============================================="
echo "  WeBuild Auction System - curl Tests"
echo "============================================="

# ============================================================
# (1) SIGN UP - 3 POST requests to register users
# ============================================================
echo ""
echo "(1) POST Requests - Sign Up Users:"

curl -X POST -H "Content-Type: application/json" \
  -d "{\"username\":\"alice\",\"password\":\"Pass1234!\",\"firstName\":\"Alice\",\"lastName\":\"Smith\",\"streetNumber\":\"1\",\"streetName\":\"Bay St\",\"city\":\"Toronto\",\"country\":\"Canada\",\"postalCode\":\"M5J2T3\"}" \
  http://localhost:8080/api/signup

echo ""
curl -X POST -H "Content-Type: application/json" \
  -d "{\"username\":\"bob\",\"password\":\"Pass1234!\",\"firstName\":\"Bob\",\"lastName\":\"Jones\",\"streetNumber\":\"2\",\"streetName\":\"Yonge St\",\"city\":\"Toronto\",\"country\":\"Canada\",\"postalCode\":\"M4W2G8\"}" \
  http://localhost:8080/api/signup

echo ""
curl -X POST -H "Content-Type: application/json" \
  -d "{\"username\":\"carol\",\"password\":\"Pass1234!\",\"firstName\":\"Carol\",\"lastName\":\"Lee\",\"streetNumber\":\"3\",\"streetName\":\"Queen St\",\"city\":\"Toronto\",\"country\":\"Canada\",\"postalCode\":\"M5V2A1\"}" \
  http://localhost:8080/api/signup

# ============================================================
# (2) SIGN IN - POST to get session tokens
# ============================================================
echo ""
echo ""
echo "(2) POST Requests - Sign In:"

curl -X POST -H "Content-Type: application/json" \
  -d "{\"username\":\"winner789\",\"password\":\"WinPass!1\"}" \
  http://localhost:8080/api/signin

echo ""
curl -X POST -H "Content-Type: application/json" \
  -d "{\"username\":\"loser456\",\"password\":\"LosePass!1\"}" \
  http://localhost:8080/api/signin

# ============================================================
# (3) GET all active auction items
# ============================================================
echo ""
echo ""
echo "(3) GET Request - Browse All Active Auction Items:"

# Note: get token first
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"username\":\"winner789\",\"password\":\"WinPass!1\"}" \
  http://localhost:8080/api/signin | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"
echo ""

curl -X GET http://localhost:8080/api/items \
  -H "Authorization: Bearer $TOKEN"

# ============================================================
# (4) GET - Search items by keyword
# ============================================================
echo ""
echo ""
echo "(4) GET Request - Search Items by Keyword (laptop):"

curl -X GET "http://localhost:8080/api/items/search?keyword=laptop" \
  -H "Authorization: Bearer $TOKEN"

# ============================================================
# (5) GET - Filter items by category
# ============================================================
echo ""
echo ""
echo "(5) GET Request - Filter Items by Category (Electronics):"

curl -X GET http://localhost:8080/api/items/category/Electronics \
  -H "Authorization: Bearer $TOKEN"

# ============================================================
# (6) GET - Auction state with live timer
# ============================================================
echo ""
echo ""
echo "(6) GET Request - Live Auction State for Item 1:"

curl -X GET http://localhost:8080/api/auction/state/1 \
  -H "Authorization: Bearer $TOKEN"

# ============================================================
# (7) POST - Place bids
# ============================================================
echo ""
echo ""
echo "(7) POST Requests - Place Bids:"

curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"itemId\":1,\"amount\":100}" \
  http://localhost:8080/api/auction/bid

echo ""
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"itemId\":2,\"amount\":900}" \
  http://localhost:8080/api/auction/bid

echo ""
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"itemId\":3,\"amount\":150}" \
  http://localhost:8080/api/auction/bid

# ============================================================
# (8) GET - Bid history
# ============================================================
echo ""
echo ""
echo "(8) GET Request - Bid History for Item 1:"

curl -X GET http://localhost:8080/api/auction/bids/1 \
  -H "Authorization: Bearer $TOKEN"

# ============================================================
# (9) GET - Auction winner
# ============================================================
echo ""
echo ""
echo "(9) GET Request - Auction Winner for Item 1:"

curl -X GET http://localhost:8080/api/auction/winner/1 \
  -H "Authorization: Bearer $TOKEN"

# ============================================================
# (10) POST - Process payment
# ============================================================
echo ""
echo ""
echo "(10) POST Request - Process Payment for Item 1:"

curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"itemId\":1,\"expedited\":true,\"cardNumber\":\"4111111111111111\",\"cardHolderName\":\"Alice Winner\",\"expirationDate\":\"12/27\",\"securityCode\":\"123\"}" \
  http://localhost:8080/api/payment

# ============================================================
# (11) GET - View receipt
# ============================================================
echo ""
echo ""
echo "(11) GET Request - View Receipt for Item 1:"

curl -X GET http://localhost:8080/api/payment/receipt/1 \
  -H "Authorization: Bearer $TOKEN"

# ============================================================
# (12) POST - Sign out
# ============================================================
echo ""
echo ""
echo "(12) POST Request - Sign Out:"

curl -X POST http://localhost:8080/api/signout \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo ""
echo "============================================="
echo "  All curl tests complete"
echo "============================================="