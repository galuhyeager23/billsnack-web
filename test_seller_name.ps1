# Test endpoint products untuk cek seller name

Write-Host "`n=== TEST SELLER NAME ===" -ForegroundColor Cyan

# 1. Get all products
Write-Host "`n1. Testing GET /api/products" -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "http://localhost:4000/api/products" -Method Get
    Write-Host "Found $($products.Count) products" -ForegroundColor Green
    
    if ($products.Count -gt 0) {
        $products | Select-Object -First 3 | ForEach-Object {
            Write-Host "`nProduct: $($_.name)" -ForegroundColor Cyan
            Write-Host "  Seller Name: $($_.sellerName)" -ForegroundColor White
            Write-Host "  Reseller ID: $($_.resellerId)" -ForegroundColor Gray
            Write-Host "  Category: $($_.category)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# 2. Get top-selling
Write-Host "`n`n2. Testing GET /api/products/top-selling" -ForegroundColor Yellow
try {
    $topSelling = Invoke-RestMethod -Uri "http://localhost:4000/api/products/top-selling?limit=5" -Method Get
    Write-Host "Found $($topSelling.Count) top-selling products" -ForegroundColor Green
    
    $topSelling | ForEach-Object {
        Write-Host "`nProduct: $($_.name)" -ForegroundColor Cyan
        Write-Host "  Seller Name: $($_.sellerName)" -ForegroundColor White
        Write-Host "  Sold Qty: $($_.soldQty)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n`n=== TEST COMPLETE ===" -ForegroundColor Cyan
