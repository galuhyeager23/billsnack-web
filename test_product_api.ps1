# Test script untuk create product via API
# Jalankan: .\test_product_api.ps1

# 1. Login sebagai admin
Write-Host "1. Login sebagai admin..." -ForegroundColor Cyan
$loginBody = @{
    email = "admin@billsnack.id"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✓ Login berhasil! Token: $($token.Substring(0,20))..." -ForegroundColor Green
    Write-Host "User role: $($loginResponse.user.role)" -ForegroundColor Yellow
} catch {
    Write-Host "✗ Login gagal: $_" -ForegroundColor Red
    exit 1
}

# 2. Create product
Write-Host "`n2. Create product..." -ForegroundColor Cyan
$productBody = @{
    name = "Test Product $(Get-Date -Format 'HHmmss')"
    description = "Test description"
    price = 15000
    stock = 100
    category = "Chips & Crisps"
    images = @("https://via.placeholder.com/300")
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/products" -Method Post -Body $productBody -Headers $headers
    Write-Host "✓ Product created!" -ForegroundColor Green
    Write-Host "Product ID: $($createResponse.id)" -ForegroundColor Yellow
    Write-Host "Product name: $($createResponse.name)" -ForegroundColor Yellow
} catch {
    Write-Host "✗ Create product gagal!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    
    # Try to get detailed error
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}
