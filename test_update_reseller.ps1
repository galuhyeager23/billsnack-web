# Test update reseller store name
Write-Host "`n=== TEST UPDATE RESELLER STORE NAME ===" -ForegroundColor Cyan

# 1. Login as admin
Write-Host "`n1. Login as admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@billsnack.id"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✓ Login successful!" -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$userId = 3

# 2. Get current user data
Write-Host "`n2. Get current reseller data (ID: $userId)..." -ForegroundColor Yellow
try {
    $currentUser = Invoke-RestMethod -Uri "http://localhost:4000/api/admin/users/$userId" -Method Get -Headers $headers
    Write-Host "Current data:" -ForegroundColor Green
    Write-Host "  Email: $($currentUser.email)"
    Write-Host "  Store Name: $($currentUser.store_name)"
    Write-Host "  Phone: $($currentUser.phone)"
    Write-Host "  Address: $($currentUser.address)"
} catch {
    Write-Host "✗ Failed to get user: $_" -ForegroundColor Red
    exit 1
}

# 3. Update store name
$newStoreName = "Toko Cemilan Jaya Updated $(Get-Date -Format 'HH:mm:ss')"
Write-Host "`n3. Updating store name to: $newStoreName" -ForegroundColor Yellow

$updateBody = @{
    email = $currentUser.email
    phone = $currentUser.phone
    address = $currentUser.address
    store_name = $newStoreName
    is_active = $true
} | ConvertTo-Json

Write-Host "Update payload:" -ForegroundColor Gray
Write-Host $updateBody -ForegroundColor Gray

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/admin/users/$userId" -Method Put -Body $updateBody -Headers $headers
    Write-Host "✓ Update successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    Write-Host ($updateResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
} catch {
    Write-Host "✗ Update failed!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# 4. Verify update
Write-Host "`n4. Verifying update..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

try {
    $verifyUser = Invoke-RestMethod -Uri "http://localhost:4000/api/admin/users/$userId" -Method Get -Headers $headers
    Write-Host "Updated data:" -ForegroundColor Green
    Write-Host "  Email: $($verifyUser.email)"
    Write-Host "  Store Name: $($verifyUser.store_name)"
    Write-Host "  Phone: $($verifyUser.phone)"
    Write-Host "  Address: $($verifyUser.address)"
    
    if ($verifyUser.store_name -eq $newStoreName) {
        Write-Host "`n✅ SUCCESS! Store name updated correctly!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ FAILED! Store name not updated!" -ForegroundColor Red
        Write-Host "Expected: $newStoreName" -ForegroundColor Yellow
        Write-Host "Got: $($verifyUser.store_name)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Verification failed: $_" -ForegroundColor Red
}

# 5. Check in products API
Write-Host "`n5. Checking product seller name..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "http://localhost:4000/api/products" -Method Get
    $resellerProduct = $products | Where-Object { $_.resellerId -eq $userId } | Select-Object -First 1
    
    if ($resellerProduct) {
        Write-Host "Product: $($resellerProduct.name)" -ForegroundColor Cyan
        Write-Host "  Seller Name: $($resellerProduct.sellerName)" -ForegroundColor White
        
        if ($resellerProduct.sellerName -eq $newStoreName) {
            Write-Host "  ✅ Seller name in products API is correct!" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Seller name in products API doesn't match!" -ForegroundColor Yellow
            Write-Host "  Expected: $newStoreName" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "Could not check products: $_" -ForegroundColor Gray
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Cyan
