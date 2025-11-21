# Test API to check if store_name appears

Write-Host "=== TEST GET /admin/users API ===" -ForegroundColor Cyan

# Login as admin
Write-Host "`n1. Login as admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@billsnack.id"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResp.token
    Write-Host "✓ Login successful, token: $($token.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Get all users
Write-Host "`n2. GET /api/admin/users..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    $users = Invoke-RestMethod -Uri "http://localhost:4000/api/admin/users" -Headers $headers
    
    Write-Host "✓ Found $($users.Count) users" -ForegroundColor Green
    
    # Find jaya@gmail.com
    $jaya = $users | Where-Object { $_.email -eq 'jaya@gmail.com' }
    
    if ($jaya) {
        Write-Host "`n=== USER: jaya@gmail.com ===" -ForegroundColor Cyan
        Write-Host "ID: $($jaya.id)"
        Write-Host "Email: $($jaya.email)"
        Write-Host "store_name: $($jaya.store_name)"
        Write-Host "first_name: $($jaya.first_name)"
        Write-Host "last_name: $($jaya.last_name)"
        Write-Host "Role: $($jaya.role)"
    } else {
        Write-Host "✗ User jaya@gmail.com not found" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Failed to get users: $_" -ForegroundColor Red
    exit 1
}

# Get single user
Write-Host "`n3. GET /api/admin/users/3..." -ForegroundColor Yellow
try {
    $user = Invoke-RestMethod -Uri "http://localhost:4000/api/admin/users/3" -Headers $headers
    
    Write-Host "✓ Got user data" -ForegroundColor Green
    Write-Host "`n=== USER DETAIL (ID: 3) ===" -ForegroundColor Cyan
    Write-Host "Email: $($user.email)"
    Write-Host "store_name: $($user.store_name)"
    Write-Host "first_name: $($user.first_name)"
    Write-Host "rp_phone: $($user.rp_phone)"
    
} catch {
    Write-Host "✗ Failed to get user: $_" -ForegroundColor Red
    exit 1
}

# Get products to check sellerName
Write-Host "`n4. GET /api/products (check sellerName)..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "http://localhost:4000/api/products"
    
    # Filter products from seller_id 3
    $jayaProducts = $products | Where-Object { $_.seller_id -eq 3 }
    
    if ($jayaProducts.Count -gt 0) {
        Write-Host "✓ Found $($jayaProducts.Count) products from seller_id 3" -ForegroundColor Green
        $jayaProducts | Select-Object -First 3 | ForEach-Object {
            Write-Host "  - [$($_.id)] $($_.name) | Seller: $($_.sellerName)"
        }
    } else {
        Write-Host "  No products from seller_id 3" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "✗ Failed to get products: $_" -ForegroundColor Red
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Cyan
