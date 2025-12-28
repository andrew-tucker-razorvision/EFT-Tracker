# dev-cleanup.ps1 - Clean up orphaned dev server processes, lock files, and Playwright sessions
#
# Usage: powershell -ExecutionPolicy Bypass -File scripts/dev-cleanup.ps1
#
# Run this script when:
# - Playwright MCP browser_navigate times out or shows "about:blank"
# - Dev server won't start due to "Port 3000 in use" or lock file errors
# - You see "Browser is already in use" errors from Playwright
# - Next.js shows "Unable to acquire lock" errors
#
# What it cleans:
# - Node processes holding port 3000
# - Next.js .next cache and lock files
# - Orphaned node processes from this project
# - Playwright MCP browser profile locks

param(
    [switch]$PlaywrightOnly  # Only clean Playwright, skip dev server cleanup
)

Write-Host "Cleaning up development environment..." -ForegroundColor Cyan

if (-not $PlaywrightOnly) {
    # Kill any node processes on port 3000
    Write-Host "`nChecking port 3000..." -ForegroundColor White
    $port3000 = netstat -ano 2>$null | Select-String ":3000.*LISTENING"
    if ($port3000) {
        $procIds = $port3000 | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
        foreach ($procId in $procIds) {
            if ($procId -match '^\d+$' -and $procId -ne '0') {
                Write-Host "  Killing process $procId (port 3000)" -ForegroundColor Yellow
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    } else {
        Write-Host "  Port 3000 is free" -ForegroundColor Green
    }

    # Remove Next.js lock file and cache
    Write-Host "`nChecking Next.js cache..." -ForegroundColor White
    $nextCache = Join-Path $PSScriptRoot "..\apps\web\.next"

    if (Test-Path $nextCache) {
        Write-Host "  Removing .next cache..." -ForegroundColor Yellow
        Remove-Item $nextCache -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Cache removed" -ForegroundColor Green
    } else {
        Write-Host "  No cache to remove" -ForegroundColor Green
    }

    # Kill any orphaned node processes related to this project
    Write-Host "`nChecking for orphaned node processes..." -ForegroundColor White
    $killed = 0
    Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
            if ($cmdLine -and $cmdLine -like "*EFT-Tracker*") {
                Write-Host "  Killing orphaned node process $($_.Id)" -ForegroundColor Yellow
                Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
                $killed++
            }
        } catch {
            # Ignore errors for processes we can't inspect
        }
    }
    if ($killed -eq 0) {
        Write-Host "  No orphaned processes found" -ForegroundColor Green
    }
}

# Clean up Playwright MCP browser profiles
Write-Host "`nChecking Playwright MCP sessions..." -ForegroundColor White
$playwrightProfiles = Get-ChildItem "$env:LOCALAPPDATA\ms-playwright\mcp-chrome-*" -Directory -ErrorAction SilentlyContinue

if ($playwrightProfiles) {
    foreach ($browserProfile in $playwrightProfiles) {
        $lockFile = Join-Path $browserProfile.FullName "SingletonLock"
        if (Test-Path $lockFile) {
            Write-Host "  Removing locked profile: $($browserProfile.Name)" -ForegroundColor Yellow
            # Try to remove lock file first
            Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
        }
        # Remove the entire profile directory to ensure clean state
        try {
            Remove-Item $browserProfile.FullName -Recurse -Force -ErrorAction Stop
            Write-Host "  Removed profile: $($browserProfile.Name)" -ForegroundColor Green
        } catch {
            Write-Host "  Could not remove $($browserProfile.Name) - browser may still be open" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  No Playwright profiles to clean" -ForegroundColor Green
}

# Also kill any Chrome processes that might be from Playwright
Write-Host "`nChecking for Playwright Chrome processes..." -ForegroundColor White
$chromeKilled = 0
Get-Process -Name "chrome" -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($cmdLine -and $cmdLine -like "*--remote-debugging-pipe*") {
            Write-Host "  Killing Playwright Chrome process $($_.Id)" -ForegroundColor Yellow
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            $chromeKilled++
        }
    } catch {
        # Ignore errors
    }
}
if ($chromeKilled -eq 0) {
    Write-Host "  No Playwright Chrome processes found" -ForegroundColor Green
}

Write-Host "`nCleanup complete!" -ForegroundColor Cyan
if (-not $PlaywrightOnly) {
    Write-Host "You can now run 'npm run dev'" -ForegroundColor Green
}
Write-Host "Playwright MCP should work on next browser_navigate call" -ForegroundColor Green
