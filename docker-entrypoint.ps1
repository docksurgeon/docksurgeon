#!/usr/bin/env pwsh
# Docker Surgeon - Smart Port Finder (Windows)
# Finds available port if default is in use
# Used as entrypoint for Docker container on Windows

param(
    [string[]]$RemainingArgs
)

$ErrorActionPreference = "Stop"

# Configuration
$DefaultPort = if ($env:DS_PORT) { [int]$env:DS_PORT } else { 4242 }
$PortRangeStart = 4242
$PortRangeEnd = 4500
$NextAuthUrlProvided = $env:NEXTAUTH_URL

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [PORT-FINDER] $Message"
}

function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -WarningAction SilentlyContinue
        return -not $connection.TcpTestSucceeded
    } catch {
        return $true
    }
}

Write-Log "Starting Docker Surgeon with smart port detection..."
Write-Log "Default port: $DefaultPort"

# Check if default port is available
if (Test-Port -Port $DefaultPort) {
    Write-Log "✅ Port $DefaultPort is available"
    $ActualPort = $DefaultPort
} else {
    Write-Log "⚠️  Port $DefaultPort is already in use, scanning for available port..."
    
    $ActualPort = $null
    for ($port = $PortRangeStart; $port -le $PortRangeEnd; $port++) {
        if (Test-Port -Port $port) {
            $ActualPort = $port
            Write-Log "✅ Found available port: $ActualPort"
            break
        }
    }
    
    if ($null -eq $ActualPort) {
        Write-Log "❌ ERROR: No available ports found in range $PortRangeStart-$PortRangeEnd"
        exit 1
    }
    
    # Update DS_PORT for docker-compose
    $env:DS_PORT = $ActualPort
}

# Set NEXTAUTH_URL if not explicitly provided
if ([string]::IsNullOrEmpty($NextAuthUrlProvided)) {
    $env:NEXTAUTH_URL = "http://localhost:$ActualPort"
    Write-Log "ℹ️  NEXTAUTH_URL set to: $env:NEXTAUTH_URL"
} else {
    Write-Log "ℹ️  Using provided NEXTAUTH_URL: $NextAuthUrlProvided"
}

Write-Log "Configuration complete:"
Write-Log "  - Port: $ActualPort"
Write-Log "  - NEXTAUTH_URL: $($env:NEXTAUTH_URL -or 'not set')"
Write-Log ""
Write-Log "Starting Next.js application..."
Write-Log "================================"

# Execute remaining arguments (the Next.js command)
if ($RemainingArgs.Count -gt 0) {
    & $RemainingArgs
} else {
    # Default: run npm start
    npm start
}
