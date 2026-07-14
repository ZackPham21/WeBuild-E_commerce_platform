# ============================================================
# WeBuild Auction Platform - Main Flow Test Script
# Tests the happy path for all major use cases
# Usage: .\test-scripts\main_flow.ps1
# ============================================================

$BASE = "http://localhost:8080/api"

# Unique username each run to avoid duplicate conflicts
$timestamp = [int](Get-Date -UFormat %s)
$username  = "testuser_$timestamp"

Write-Host ""
Write-Host "=======================================" -ForegroundColor White
Write-Host "  WeBuild Auction - Main Flow Tests   " -ForegroundColor White
Write-Host "=======================================" -ForegroundColor White
Write-Host ""

# ── UC1.1: Sign Up ───────────────────────────────────────────
Write-Host "=== UC1.1: Sign Up (username: $username) ===" -ForegroundColor Cyan
$signupBody = @{
    username     = $username
    password     = "Pass1234!"
    firstName    = "John"
    lastName     = "Doe"
    streetNumber = "100"
    streetName   = "King St"
    city         = "Toronto"
    country      = "Canada"
    postalCode   = "M5H2N2"
} | ConvertTo-Json

try {
    $signupResp = Invoke-RestMethod -Uri "$BASE/signup" -Method POST `
        -ContentType "application/json" -Body $signupBody
    $signupResp | ConvertTo-Json
} catch {
    Write-Host "Sign up note: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ── UC1.2: Sign In ───────────────────────────────────────────
Write-Host ""
Write-Host "=== UC1.2: Sign In ===" -ForegroundColor Cyan
$signinBody = @{ username = $username; password = "Pass1234!" } | ConvertTo-Json

try {
    $signinResp = Invoke-RestMethod -Uri "$BASE/signin" -Method POST `
        -ContentType "application/json" -Body $signinBody
    $TOKEN = $signinResp.token
    Write-Host "Token received: $TOKEN" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Sign in failed - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure all 5 services are running before executing this script." -ForegroundColor Yellow
    exit 1
}

$headers = @{ Authorization = "Bearer $TOKEN" }

# ── Setup: seller1 lists a fresh item so this script is idempotent ──
# (item 1 gets closed + marked SOLD after the payment step below, so
#  reusing it on a second run would fail with FAIL_AUCTION_ENDED)
Write-Host ""
Write-Host "=== Setup: seller1 lists a fresh item for this run ===" -ForegroundColor Cyan
$sellerSignin = Invoke-RestMethod -Uri "$BASE/signin" -Method POST `
    -ContentType "application/json" `
    -Body (@{ username = "seller1"; password = "SellerPass!1" } | ConvertTo-Json)
$sellerHeaders = @{ Authorization = "Bearer $($sellerSignin.token)" }

$now = Get-Date
$itemBody = @{
    name                  = "Test Item $timestamp"
    description           = "Auto-generated item for main_flow.ps1"
    category              = "Electronics"
    startingPrice         = 10
    sellerId              = $sellerSignin.userId
    auctionStartTime      = $now.ToString("yyyy-MM-ddTHH:mm:ss")
    auctionEndTime        = $now.AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss")
    shippingDays          = 3
    shippingCost          = 5
    expeditedShippingCost = 15
    imageUrl              = ""
    condition             = "New"
} | ConvertTo-Json

$itemResp = Invoke-RestMethod -Uri "$BASE/items" -Method POST -Headers $sellerHeaders `
    -ContentType "application/json" -Body $itemBody
$itemId = $itemResp.id
Write-Host "Created item ID: $itemId" -ForegroundColor Green

# ── UC2.2: Browse Active Auction Items ───────────────────────
Write-Host ""
Write-Host "=== UC2.2: Browse Active Auction Items ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BASE/items" -Method GET -Headers $headers | ConvertTo-Json -Depth 5

# ── UC2.1: Keyword Search ────────────────────────────────────
Write-Host ""
Write-Host "=== UC2.1: Search Items by Keyword (laptop) ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BASE/items/search?keyword=laptop" -Method GET -Headers $headers | ConvertTo-Json -Depth 5

# ── UC2.3: Category Filter ───────────────────────────────────
Write-Host ""
Write-Host "=== UC2.3: Filter Items by Category (Electronics) ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BASE/items/category/Electronics" -Method GET -Headers $headers | ConvertTo-Json -Depth 5

# ── UC3: Get Auction State ───────────────────────────────────
Write-Host ""
Write-Host "=== UC3: Get Live Auction State for Item $itemId ===" -ForegroundColor Cyan
$auctionState = Invoke-RestMethod -Uri "$BASE/auction/state/$itemId" -Method GET -Headers $headers
$auctionState | ConvertTo-Json -Depth 5

# ── UC3: Place a Bid ─────────────────────────────────────────
Write-Host ""
Write-Host "=== UC3: Place a Valid Bid on Item $itemId ===" -ForegroundColor Cyan
$currentBid = [int]$auctionState.currentHighestBid
$newBid     = $currentBid + 1
Write-Host "Current highest bid: $currentBid  -->  Placing bid of: $newBid" -ForegroundColor White

try {
    $bidResp = Invoke-RestMethod -Uri "$BASE/auction/bid" -Method POST -Headers $headers `
        -ContentType "application/json" -Body (@{ itemId = $itemId; amount = $newBid } | ConvertTo-Json)
    $bidResp | ConvertTo-Json
} catch {
    Write-Host "Bid error: $($_.Exception.Message)" -ForegroundColor Red
}

# ── Bid History ──────────────────────────────────────────────
Write-Host ""
Write-Host "=== UC3: View Bid History for Item $itemId ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BASE/auction/bids/$itemId" -Method GET -Headers $headers | ConvertTo-Json -Depth 5

# ── UC4: Auction Winner ──────────────────────────────────────
Write-Host ""
Write-Host "=== UC4: Check Auction Winner for Item $itemId ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$BASE/auction/winner/$itemId" -Method GET -Headers $headers | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Winner check: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ── UC5: Payment ─────────────────────────────────────────────
Write-Host ""
Write-Host "=== UC5: Process Payment as Auction Winner ===" -ForegroundColor Cyan
Write-Host "Note: Payment only succeeds if current user is the highest bidder." -ForegroundColor Gray

$paymentBody = @{
    itemId        = $itemId
    expedited     = $true
    cardNumber    = "4111111111111111"
    cardHolderName = "John Doe"
    expirationDate = "12/27"
    securityCode  = "123"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$BASE/payment" -Method POST -Headers $headers `
        -ContentType "application/json" -Body $paymentBody | ConvertTo-Json
} catch {
    Write-Host "Payment note: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This is expected if this user is not the current highest bidder." -ForegroundColor Gray
}

# ── UC6: Receipt ─────────────────────────────────────────────
Write-Host ""
Write-Host "=== UC6: View Receipt for Item $itemId ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$BASE/payment/receipt/$itemId" -Method GET -Headers $headers | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Receipt note: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Receipt only available after successful payment." -ForegroundColor Gray
}

# ── Sign Out ─────────────────────────────────────────────────
Write-Host ""
Write-Host "=== UC1.2: Sign Out ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BASE/signout" -Method POST -Headers $headers | ConvertTo-Json

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "       Main Flow Tests Complete        " -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""