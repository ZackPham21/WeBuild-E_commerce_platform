@echo off
REM ============================================================
REM WeBuild Forward Auction System - curl Test Script
REM For Windows Command Prompt
REM Usage: test-scripts\curl_tests_windows.cmd
REM ============================================================

set BASE=http://localhost:8080/api

echo =============================================
echo   WeBuild Auction System - curl Tests
echo =============================================

REM ============================================================
REM (1) POST Requests - Sign Up 3 new users
REM ============================================================
echo.
echo (1) POST Requests - Sign Up Users:

curl -X POST -H "Content-Type: application/json" -d "{\"username\":\"alice\",\"password\":\"Pass1234!\",\"firstName\":\"Alice\",\"lastName\":\"Smith\",\"streetNumber\":\"1\",\"streetName\":\"Bay St\",\"city\":\"Toronto\",\"country\":\"Canada\",\"postalCode\":\"M5J2T3\"}" http://localhost:8080/api/signup
echo.
curl -X POST -H "Content-Type: application/json" -d "{\"username\":\"bob\",\"password\":\"Pass1234!\",\"firstName\":\"Bob\",\"lastName\":\"Jones\",\"streetNumber\":\"2\",\"streetName\":\"Yonge St\",\"city\":\"Toronto\",\"country\":\"Canada\",\"postalCode\":\"M4W2G8\"}" http://localhost:8080/api/signup
echo.
curl -X POST -H "Content-Type: application/json" -d "{\"username\":\"carol\",\"password\":\"Pass1234!\",\"firstName\":\"Carol\",\"lastName\":\"Lee\",\"streetNumber\":\"3\",\"streetName\":\"Queen St\",\"city\":\"Toronto\",\"country\":\"Canada\",\"postalCode\":\"M5V2A1\"}" http://localhost:8080/api/signup

REM ============================================================
REM (2) POST Requests - Sign In (pre-seeded users)
REM ============================================================
echo.
echo.
echo (2) POST Requests - Sign In:

curl -X POST -H "Content-Type: application/json" -d "{\"username\":\"winner789\",\"password\":\"WinPass!1\"}" http://localhost:8080/api/signin
echo.
curl -X POST -H "Content-Type: application/json" -d "{\"username\":\"loser456\",\"password\":\"LosePass!1\"}" http://localhost:8080/api/signin

REM ============================================================
REM NOTE: Copy the token from the signin response above
REM       and paste it below replacing YOUR_TOKEN_HERE
REM ============================================================
echo.
echo NOTE: Copy the token value from the signin response above.
echo       Then re-run from step 3 onwards replacing YOUR_TOKEN_HERE
echo       with your actual token.
echo.
set /p TOKEN="Paste your token here and press Enter: "

REM ============================================================
REM (3) GET Request - Browse all active auction items
REM ============================================================
echo.
echo (3) GET Request - Browse All Active Auction Items:

curl -X GET http://localhost:8080/api/items -H "Authorization: Bearer %TOKEN%"

REM ============================================================
REM (4) GET Request - Search by keyword
REM ============================================================
echo.
echo.
echo (4) GET Request - Search Items by Keyword (laptop):

curl -X GET "http://localhost:8080/api/items/search?keyword=laptop" -H "Authorization: Bearer %TOKEN%"

REM ============================================================
REM (5) GET Request - Filter by category
REM ============================================================
echo.
echo.
echo (5) GET Request - Filter by Category (Electronics):

curl -X GET http://localhost:8080/api/items/category/Electronics -H "Authorization: Bearer %TOKEN%"

REM ============================================================
REM (6) GET Request - Live auction state and timer
REM ============================================================
echo.
echo.
echo (6) GET Request - Live Auction State for Item 1:

curl -X GET http://localhost:8080/api/auction/state/1 -H "Authorization: Bearer %TOKEN%"

REM ============================================================
REM (7) POST Requests - Place bids
REM ============================================================
echo.
echo.
echo (7) POST Requests - Place Bids:

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"itemId\":1,\"amount\":100}" http://localhost:8080/api/auction/bid
echo.
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"itemId\":2,\"amount\":900}" http://localhost:8080/api/auction/bid
echo.
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"itemId\":3,\"amount\":150}" http://localhost:8080/api/auction/bid

REM ============================================================
REM (8) GET Request - Bid history
REM ============================================================
echo.
echo.
echo (8) GET Request - Bid History for Item 1:

curl -X GET http://localhost:8080/api/auction/bids/1 -H "Authorization: Bearer %TOKEN%"

REM ============================================================
REM (9) GET Request - Auction winner
REM ============================================================
echo.
echo.
echo (9) GET Request - Auction Winner for Item 1:

curl -X GET http://localhost:8080/api/auction/winner/1 -H "Authorization: Bearer %TOKEN%"

REM ============================================================
REM (10) POST Request - Process payment
REM ============================================================
echo.
echo.
echo (10) POST Request - Process Payment (winner only):

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"itemId\":1,\"expedited\":true,\"cardNumber\":\"4111111111111111\",\"cardHolderName\":\"Alice Winner\",\"expirationDate\":\"12/27\",\"securityCode\":\"123\"}" http://localhost:8080/api/payment

REM ============================================================
REM (11) GET Request - View receipt
REM ============================================================
echo.
echo.
echo (11) GET Request - View Receipt for Item 1:

curl -X GET http://localhost:8080/api/payment/receipt/1 -H "Authorization: Bearer %TOKEN%"

REM ============================================================
REM (12) POST Request - Sign out
REM ============================================================
echo.
echo.
echo (12) POST Request - Sign Out:

curl -X POST http://localhost:8080/api/signout -H "Authorization: Bearer %TOKEN%"

echo.
echo.
echo =============================================
echo   All curl tests complete
echo =============================================
pause