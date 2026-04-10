@echo off
setlocal

if "%PORT%"=="" set PORT=3000

echo Starting Salex on http://localhost:%PORT%
call npm.cmd run dev
