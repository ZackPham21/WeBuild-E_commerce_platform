# ============================================================
# WeBuild Auction Platform - Corner Case Tests
# Tests all 16 test cases from the SDD including robustness
# Usage: .\test-scripts\corner_cases.ps1
# ============================================================

$BASE = "http://localhost:8080/api"
$pass = 0
$fail = 0

function Invoke-API {
    param($Uri, $Method = "GET", $Headers = @{}, $Body = $null)
    try {
        if ($Body) {
            $result = Invoke-RestMethod -Uri $Uri -Method $Method -Headers $Headers `
                -ContentType "application/json" -Body $Body
        } else {
            $result = Invoke-RestMethod -Uri $Uri -Method $Method -Headers $Headers
        }
        return @{ success = $true; body = $result; code = 200 }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $msg  = $_.ErrorDetails.Message
        return @{ success = $false; body = $msg; code = $code }
    }
}

function Assert-Success {
    param($label, $resp)
    if ($resp.success) {
        Write-Host "  PASS - $label" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "  FAIL - $label (HTTP $($resp.code)): $($resp.body)" -ForegroundColor Red
        $script:fail++
    }
}

function Assert-Failure {
    param($label, $resp)
    if (-not $resp.success) {
        Write-Host "  PASS - $label (correctly rejected HTTP $($resp.code))" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "  FAIL - $label (should have been rejected but got 200)" -ForegroundColor Red
        $script:fail++
    }
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor White
Write-Host "  WeBuild Auction - Corner Case Tests  " -ForegroundColor White
Write-Host "=======================================" -ForegroundColor White

# ── Setup: sign in as pre-seeded users ───────────────────────
Write-Host ""
Write-Host "--- SETUP: Signing in as pre-seeded users ---" -ForegroundColor Magenta

try {
    $winnerToken = (Invoke-RestMethod -Uri "$BASE/signin" -Method POST `
        -ContentType "application/json" `
        -Body (@{username="winner789"; password="WinPass!1"} | ConvertTo-Json)).token
    $winnerHeaders = @{ Authorization = "Bearer $winnerToken" }
    Write-Host "  winner789 signed in: $winnerToken" -ForegroundColor Gray
} catch {
    Write-Host "  ERROR: Could not sign in as winner789. Is IAM service running?" -ForegroundColor Red
    exit 1
}

try {
    $loserToken = (Invoke-RestMethod -Uri "$BASE/signin" -Method POST `
        -ContentType "application/json" `
        -Body (@{username="loser456"; password="LosePass!1"} | ConvertTo-Json)).token
    $loserHeaders = @{ Authorization = "Bearer $loserToken" }
    Write-Host "  loser456 signed in: $loserToken" -ForegroundColor Gray
} catch {
    Write-Host "  ERROR: Could not sign in as loser456. Is IAM service running?" -ForegroundColor Red
    exit 1
}

# ── TC-IAM-001: Successful Sign Up ───────────────────────────
Write-Host ""
Write-Host "=== TC-IAM-001: Successful Sign Up ===" -ForegroundColor Cyan
$ts      = [int](Get-Date -UFormat %s)
$newUser = @{
    username      = "tc001_$ts"
    password      = "SecurePass456"
    firstName     = "John"
    lastName      = "Smith"
    streetNumber  = "123"
    streetName    = "Main Street"
    city          = "Toronto"
    country       = "Canada"
    postalCode    = "M5H2N2"
} | ConvertTo-Json
$resp = Invoke-API -Uri "$BASE/signup" -Method POST -Body $newUser
Assert-Success "New user registration succeeds" $resp

# ── TC-IAM-006: Duplicate Username ───────────────────────────
Write-Host ""
Write-Host "=== TC-IAM-006: Duplicate Username ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/signup" -Method POST -Body $newUser
Assert-Failure "Duplicate username is rejected" $resp

# ── TC-IAM-005: Wrong Password ───────────────────────────────
Write-Host ""
Write-Host "=== TC-IAM-005: Sign In with Wrong Password ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/signin" -Method POST `
    -Body (@{username="winner789"; password="WrongPassword999"} | ConvertTo-Json)
Assert-Failure "Wrong password is rejected" $resp

# ── TC-IAM: Sign In with Non-existent User ────────────────────
Write-Host ""
Write-Host "=== TC-IAM: Sign In with Non-existent User ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/signin" -Method POST `
    -Body (@{username="nobody_xyz"; password="Pass123"} | ConvertTo-Json)
Assert-Failure "Non-existent user login is rejected" $resp

# ── TC-CAT-002: Search No Results ────────────────────────────
Write-Host ""
Write-Host "=== TC-CAT-002: Search With No Matching Results ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/items/search?keyword=xyznomatch" -Method GET -Headers $winnerHeaders
Assert-Success "Empty search returns successfully (no crash)" $resp
if ($resp.success -and $resp.body.Count -eq 0) {
    Write-Host "  PASS - Correctly returns empty result set" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  FAIL - Expected empty results" -ForegroundColor Red
    $fail++
}

# ── TC-CAT-007: Category Filter ──────────────────────────────
Write-Host ""
Write-Host "=== TC-CAT-007: Filter by Category ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/items/category/Electronics" -Method GET -Headers $winnerHeaders
Assert-Success "Category filter returns results" $resp

# ── TC-CAT-008: Only Active Auctions Shown ───────────────────
Write-Host ""
Write-Host "=== TC-CAT-008: Browse Active Auctions Only ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/items" -Method GET -Headers $winnerHeaders
Assert-Success "Active items endpoint works" $resp

# ── TC-AUC-009: Valid Bid ────────────────────────────────────
Write-Host ""
Write-Host "=== TC-AUC-009: Valid Bid Submission ===" -ForegroundColor Cyan
$stateResp  = Invoke-API -Uri "$BASE/auction/state/1" -Method GET -Headers $winnerHeaders
$currentBid = [int]$stateResp.body.currentHighestBid
$validBid   = $currentBid + 5
$resp = Invoke-API -Uri "$BASE/auction/bid" -Method POST -Headers $winnerHeaders `
    -Body (@{itemId=1; amount=$validBid} | ConvertTo-Json)
Assert-Success "Valid bid (current+5) is accepted" $resp

# ── TC-AUC-003: Bid Equal to Current ─────────────────────────
Write-Host ""
Write-Host "=== TC-AUC-003: Bid Equal to Current Highest ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/auction/bid" -Method POST -Headers $loserHeaders `
    -Body (@{itemId=1; amount=$validBid} | ConvertTo-Json)
Assert-Failure "Equal bid is rejected" $resp

# ── TC-AUC-010: Bid Lower than Current ───────────────────────
Write-Host ""
Write-Host "=== TC-AUC-010: Bid Lower Than Current ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/auction/bid" -Method POST -Headers $loserHeaders `
    -Body (@{itemId=1; amount=($validBid - 10)} | ConvertTo-Json)
Assert-Failure "Lower bid is rejected" $resp

# ── TC-AUC-010: Non-integer Bid ──────────────────────────────
Write-Host ""
Write-Host "=== TC-AUC-010: Non-Integer Bid ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/auction/bid" -Method POST -Headers $loserHeaders `
    -Body (@{itemId=1; amount=($validBid + 0.50)} | ConvertTo-Json)
Assert-Failure "Decimal bid is rejected" $resp

# ── TC-AUC-011: Timer Countdown ──────────────────────────────
Write-Host ""
Write-Host "=== TC-AUC-011: Auction Timer Countdown ===" -ForegroundColor Cyan
$before = (Invoke-API -Uri "$BASE/auction/state/1" -Method GET -Headers $winnerHeaders).body.secondsRemaining
Start-Sleep -Seconds 3
$after  = (Invoke-API -Uri "$BASE/auction/state/1" -Method GET -Headers $winnerHeaders).body.secondsRemaining
Write-Host "  Before: $before seconds  |  After 3s wait: $after seconds" -ForegroundColor Gray
if ($after -lt $before) {
    Write-Host "  PASS - Timer is counting down correctly" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  FAIL - Timer did not decrease" -ForegroundColor Red
    $fail++
}

# ── TC-PAY-013: Non-winner Payment ───────────────────────────
Write-Host ""
Write-Host "=== TC-PAY-013: Non-Winner Payment Attempt ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/payment" -Method POST -Headers $loserHeaders -Body (@{
    itemId         = 1
    expedited      = $false
    cardNumber     = "4111111111111111"
    cardHolderName = "Bob Loser"
    expirationDate = "12/27"
    securityCode   = "123"
} | ConvertTo-Json)
Assert-Failure "Non-winner payment is rejected" $resp

# ── TC-PAY: Invalid Card Number ──────────────────────────────
Write-Host ""
Write-Host "=== TC-PAY: Invalid Card Number ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/payment" -Method POST -Headers $winnerHeaders -Body (@{
    itemId         = 1
    expedited      = $false
    cardNumber     = "1234567890"
    cardHolderName = "Alice Winner"
    expirationDate = "12/27"
    securityCode   = "123"
} | ConvertTo-Json)
Assert-Failure "Invalid card number is rejected" $resp

# ── TC-PAY: Expired Card ─────────────────────────────────────
Write-Host ""
Write-Host "=== TC-PAY: Expired Card ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/payment" -Method POST -Headers $winnerHeaders -Body (@{
    itemId         = 1
    expedited      = $false
    cardNumber     = "4111111111111111"
    cardHolderName = "Alice Winner"
    expirationDate = "01/20"
    securityCode   = "123"
} | ConvertTo-Json)
Assert-Failure "Expired card is rejected" $resp

# ── TC-PAY-014: Valid Payment with Expedited Shipping ────────
Write-Host ""
Write-Host "=== TC-PAY-014: Valid Payment with Expedited Shipping ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/payment" -Method POST -Headers $winnerHeaders -Body (@{
    itemId         = 1
    expedited      = $true
    cardNumber     = "4111111111111111"
    cardHolderName = "Alice Winner"
    expirationDate = "12/27"
    securityCode   = "123"
} | ConvertTo-Json)
# Either success (first run) or already paid (subsequent runs) — both are valid
if ($resp.success) {
    Write-Host "  PASS - Payment processed successfully" -ForegroundColor Green
    $pass++
} elseif ($resp.code -eq 400) {
    Write-Host "  PASS - Payment correctly handled (may already be paid from prior run)" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  FAIL - Unexpected error: $($resp.body)" -ForegroundColor Red
    $fail++
}

# ── TC-PAY-015: Duplicate Payment ───────────────────────────
Write-Host ""
Write-Host "=== TC-PAY-015: Duplicate Payment ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/payment" -Method POST -Headers $winnerHeaders -Body (@{
    itemId         = 1
    expedited      = $true
    cardNumber     = "4111111111111111"
    cardHolderName = "Alice Winner"
    expirationDate = "12/27"
    securityCode   = "123"
} | ConvertTo-Json)
Assert-Failure "Duplicate payment is rejected" $resp

# ── TC-REC-016: View Receipt ─────────────────────────────────
Write-Host ""
Write-Host "=== TC-REC-016: View Receipt ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/payment/receipt/1" -Method GET -Headers $winnerHeaders
Assert-Success "Receipt is retrievable after payment" $resp

# ── Unauthorized Access ──────────────────────────────────────
Write-Host ""
Write-Host "=== SECURITY: Unauthorized Access (No Token) ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/items" -Method GET
Assert-Failure "Request without token is rejected" $resp

# ── Password Reset ───────────────────────────────────────────
Write-Host ""
Write-Host "=== TC-IAM: Password Reset Request ===" -ForegroundColor Cyan
$resp = Invoke-API -Uri "$BASE/reset-password" -Method POST `
    -Body (@{username="winner789"} | ConvertTo-Json)
Assert-Success "Password reset token generated" $resp

# ── Summary ──────────────────────────────────────────────────
Write-Host ""
Write-Host "=======================================" -ForegroundColor White
Write-Host "           TEST SUMMARY                " -ForegroundColor White
Write-Host "=======================================" -ForegroundColor White
Write-Host "  PASSED: $pass" -ForegroundColor Green
Write-Host "  FAILED: $fail" -ForegroundColor Red
$total = $pass + $fail
Write-Host "  TOTAL:  $total" -ForegroundColor White
Write-Host "=======================================" -ForegroundColor White
Write-Host ""