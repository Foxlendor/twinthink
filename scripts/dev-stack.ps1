# TwinThink Local Development Launcher (PowerShell)
# Starts the FastAPI backend (:8001) and Next.js frontend (:3000)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host ">>> Starting TwinThink API on http://127.0.0.1:8001..." -ForegroundColor Cyan
$apiProc = Start-Process -FilePath "python" -ArgumentList "apps/api/main.py" -WorkingDirectory $repoRoot -PassThru

Start-Sleep -Seconds 2

Write-Host ">>> Starting TwinThink Web on http://localhost:3000..." -ForegroundColor Cyan
$webProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WorkingDirectory "$repoRoot\apps\web" -PassThru

Write-Host "==================================================" -ForegroundColor Green
Write-Host " TwinThink Stack Running:" -ForegroundColor Green
Write-Host "   API: http://127.0.0.1:8001 (Docs: /docs, Health: /health)" -ForegroundColor Green
Write-Host "   Web: http://localhost:3000" -ForegroundColor Green
Write-Host " Press Enter to stop both processes..." -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Green

try {
    [Console]::ReadLine()
} finally {
    Write-Host "Stopping processes..." -ForegroundColor Yellow
    if ($webProc) { Stop-Process -Id $webProc.Id -Force -ErrorAction SilentlyContinue }
    if ($apiProc) { Stop-Process -Id $apiProc.Id -Force -ErrorAction SilentlyContinue }
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "TwinThink stack stopped." -ForegroundColor Gray
}
