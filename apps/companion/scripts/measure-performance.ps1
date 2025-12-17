# Performance Measurement Script for EFT Tracker Companion
# Measures startup time, memory usage, and binary size

param(
    [switch]$Quiet
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "EFT Tracker Companion - Performance Measurement" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Find the installer or built binary
$appPath = "C:\Program Files\EFT Tracker Companion\eft-tracker-companion.exe"
$buildPath = ".\src-tauri\target\release\eft-tracker-companion.exe"

if (-not (Test-Path $appPath) -and -not (Test-Path $buildPath)) {
    Write-Host "Error: EFT Tracker Companion not found." -ForegroundColor Red
    Write-Host "Expected locations:" -ForegroundColor Yellow
    Write-Host "  - $appPath (installed)" -ForegroundColor Yellow
    Write-Host "  - $buildPath (built)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Build the app first: pnpm build:companion" -ForegroundColor Yellow
    exit 1
}

$executablePath = if (Test-Path $appPath) { $appPath } else { $buildPath }

Write-Host ""
Write-Host "Testing: $executablePath" -ForegroundColor Yellow
Write-Host ""

# Kill any existing process
Get-Process | Where-Object { $_.MainWindowTitle -eq "EFT Tracker Companion" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

# === STARTUP TIME TEST ===
Write-Host "[1/3] Measuring startup time..." -ForegroundColor Cyan

$startupTimes = @()
$numRuns = 3

for ($i = 1; $i -le $numRuns; $i++) {
    Write-Host "  Run $i/$numRuns" -ForegroundColor Gray

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $process = Start-Process $executablePath -PassThru

    # Wait for window to appear or timeout at 10 seconds
    $windowAppeared = $false
    $maxWait = 0
    while ($maxWait -lt 100 -and -not $windowAppeared) {
        Start-Sleep -Milliseconds 100
        $maxWait++

        # Check if process has a main window title
        $p = Get-Process | Where-Object { $_.Id -eq $process.Id }
        if ($p -and $p.MainWindowTitle) {
            $windowAppeared = $true
        }
    }

    $stopwatch.Stop()
    $elapsed = [math]::Round($stopwatch.Elapsed.TotalSeconds, 2)
    $startupTimes += $elapsed

    Write-Host "    Duration: $elapsed seconds" -ForegroundColor Green

    # Measure memory while running
    Start-Sleep -Seconds 2

    # Get memory usage
    $processInfo = Get-Process | Where-Object { $_.Id -eq $process.Id }
    if ($processInfo) {
        $memoryMB = [math]::Round($processInfo.WorkingSet64 / 1MB, 2)
        Write-Host "    Memory: $memoryMB MB" -ForegroundColor Green
    }

    # Kill process for next run
    try {
        $process | Stop-Process -Force
    }
    catch {
        # Process may have already exited
    }

    Start-Sleep -Milliseconds 500
}

# Calculate average
$avgStartup = [math]::Round(($startupTimes | Measure-Object -Average).Average, 2)

Write-Host ""
Write-Host "Startup Time Results:" -ForegroundColor Yellow
Write-Host "  Runs: $startupTimes" -ForegroundColor Gray
Write-Host "  Average: $avgStartup seconds" -ForegroundColor Green

if ($avgStartup -le 3) {
    Write-Host "  Status: ✓ PASS (target: <3s)" -ForegroundColor Green
}
else {
    Write-Host "  Status: ✗ FAIL (target: <3s)" -ForegroundColor Red
}

# === MEMORY USAGE TEST ===
Write-Host ""
Write-Host "[2/3] Measuring idle memory usage..." -ForegroundColor Cyan

$process = Start-Process $executablePath -PassThru
Start-Sleep -Milliseconds 1000

# Wait for stable memory (after 5 seconds)
Start-Sleep -Seconds 5

$processInfo = Get-Process | Where-Object { $_.Id -eq $process.Id }
$memoryMB = [math]::Round($processInfo.WorkingSet64 / 1MB, 2)

Write-Host "  Idle Memory: $memoryMB MB" -ForegroundColor Green

if ($memoryMB -le 150) {
    Write-Host "  Status: ✓ PASS (target: <150 MB)" -ForegroundColor Green
}
else {
    Write-Host "  Status: ✗ FAIL (target: <150 MB)" -ForegroundColor Red
}

$process | Stop-Process -Force

# === BINARY SIZE TEST ===
Write-Host ""
Write-Host "[3/3] Measuring binary size..." -ForegroundColor Cyan

if (Test-Path $executablePath) {
    $sizeBytes = (Get-Item $executablePath).Length
    $sizeMB = [math]::Round($sizeBytes / 1MB, 2)

    Write-Host "  Binary Size: $sizeMB MB" -ForegroundColor Green

    if ($sizeMB -le 20) {
        Write-Host "  Status: ✓ PASS (target: <20 MB)" -ForegroundColor Green
    }
    else {
        Write-Host "  Status: ✗ FAIL (target: <20 MB)" -ForegroundColor Red
    }
}

# === SUMMARY ===
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Performance Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$allPass = ($avgStartup -le 3) -and ($memoryMB -le 150) -and ($sizeMB -le 20)

Write-Host ""
Write-Host "| Metric | Target | Actual | Status |" -ForegroundColor Gray
Write-Host "|--------|--------|--------|--------|" -ForegroundColor Gray
Write-Host "| Startup Time | <3s | $avgStartup s | $(if ($avgStartup -le 3) { '✓ PASS' } else { '✗ FAIL' }) |" -ForegroundColor Gray
Write-Host "| Idle Memory | <150 MB | $memoryMB MB | $(if ($memoryMB -le 150) { '✓ PASS' } else { '✗ FAIL' }) |" -ForegroundColor Gray
Write-Host "| Binary Size | <20 MB | $sizeMB MB | $(if ($sizeMB -le 20) { '✓ PASS' } else { '✗ FAIL' }) |" -ForegroundColor Gray

Write-Host ""
if ($allPass) {
    Write-Host "✓ All performance targets met!" -ForegroundColor Green
}
else {
    Write-Host "✗ Some performance targets not met" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Date: $(Get-Date)" -ForegroundColor Gray
Write-Host ""
