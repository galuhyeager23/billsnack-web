# Apply seller_name migration to products table
# Run this script from server/ directory

$ErrorActionPreference = "Stop"

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Apply seller_name Migration" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Error: .env file not found in current directory" -ForegroundColor Red
    Write-Host "Please run this script from the server/ directory" -ForegroundColor Red
    exit 1
}

# Load environment variables from .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$DB_HOST = $env:DB_HOST
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD
$DB_NAME = $env:DB_NAME

if (-not $DB_HOST -or -not $DB_USER -or -not $DB_NAME) {
    Write-Host "Error: Missing database configuration in .env file" -ForegroundColor Red
    Write-Host "Required: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME" -ForegroundColor Red
    exit 1
}

Write-Host "Database Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $DB_HOST" -ForegroundColor Gray
Write-Host "  User: $DB_USER" -ForegroundColor Gray
Write-Host "  Database: $DB_NAME" -ForegroundColor Gray
Write-Host ""

$MIGRATION_FILE = "models\add_seller_name_to_products.sql"

if (-not (Test-Path $MIGRATION_FILE)) {
    Write-Host "Error: Migration file not found: $MIGRATION_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "Reading migration file: $MIGRATION_FILE" -ForegroundColor Yellow
$sqlContent = Get-Content -Path $MIGRATION_FILE -Raw

# Create mysql command
$mysqlCmd = "mysql"
$mysqlArgs = @(
    "-h", $DB_HOST,
    "-u", $DB_USER,
    "-D", $DB_NAME,
    "-e", $sqlContent
)

if ($DB_PASSWORD) {
    $mysqlArgs = @("-p$DB_PASSWORD") + $mysqlArgs
}

Write-Host ""
Write-Host "Applying migration..." -ForegroundColor Yellow

try {
    & $mysqlCmd $mysqlArgs
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Migration applied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Changes made:" -ForegroundColor Cyan
        Write-Host "  1. Added seller_name column to products table" -ForegroundColor Gray
        Write-Host "  2. Set default BillSnack Store for existing admin products" -ForegroundColor Gray
    } else {
        throw "MySQL command failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "Migration failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Migration Complete" -ForegroundColor Green
