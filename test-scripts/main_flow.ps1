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
Write-Host "=== UC3: Get Live Auction State for Item 1 ===" -ForegroundColor Cyan
$auctionState = Invoke-RestMethod -Uri "$BASE/auction/state/1" -Method GET -Headers $headers
$auctionState | ConvertTo-Json -Depth 5

# ── UC3: Place a Bid ─────────────────────────────────────────
Write-Host ""
Write-Host "=== UC3: Place a Valid Bid on Item 1 ===" -ForegroundColor Cyan
$currentBid = [int]$auctionState.currentHighestBid
$newBid     = $currentBid + 1
Write-Host "Current highest bid: $currentBid  -->  Placing bid of: $newBid" -ForegroundColor White

try {
    $bidResp = Invoke-RestMethod -Uri "$BASE/auction/bid" -Method POST -Headers $headers `
        -ContentType "application/json" -Body (@{ itemId = 1; amount = $newBid } | ConvertTo-Json)
    $bidResp | ConvertTo-Json
} catch {
    Write-Host "Bid error: $($_.Exception.Message)" -ForegroundColor Red
}

# ── Bid History ──────────────────────────────────────────────
Write-Host ""
Write-Host "=== UC3: View Bid History for Item 1 ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BASE/auction/bids/1" -Method GET -Headers $headers | ConvertTo-Json -Depth 5

# ── UC4: Auction Winner ──────────────────────────────────────
Write-Host ""
Write-Host "=== UC4: Check Auction Winner for Item 1 ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$BASE/auction/winner/1" -Method GET -Headers $headers | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Winner check: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ── UC5: Payment ─────────────────────────────────────────────
Write-Host ""
Write-Host "=== UC5: Process Payment as Auction Winner ===" -ForegroundColor Cyan
Write-Host "Note: Payment only succeeds if current user is the highest bidder." -ForegroundColor Gray

$paymentBody = @{
    itemId        = 1
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
Write-Host "=== UC6: View Receipt for Item 1 ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$BASE/payment/receipt/1" -Method GET -Headers $headers | ConvertTo-Json -Depth 5
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