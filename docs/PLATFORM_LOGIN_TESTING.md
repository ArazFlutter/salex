# Platform Login Testing Guide

This document explains how to test the platform login flow (Tap.az, Lalafo, Laylo.az) in different environments. The system supports three OTP acquisition methods depending on your setup.

## Overview

When a user connects their marketplace account, the flow is:
1. User submits phone number via `/platforms/:platform/start-login`
2. Selenium opens the platform website and enters the phone
3. Platform sends SMS OTP to user's phone
4. Selenium waits for the OTP code via one of three methods
5. User submits OTP via `/platforms/:platform/verify-otp`
6. Session cookies are saved to database

## Three OTP Acquisition Methods

### 1. Static Environment Variable (Testing)
**Use case**: Automated testing, CI/CD pipelines

Set environment variables before starting the server:

```bash
export TAPAZ_OTP_CODE=1234
export LALAFO_OTP_CODE=1234
export LAYLO_OTP_CODE=1234
```

The Selenium automation will immediately use these codes without waiting. Useful for:
- Automated integration tests
- CI/CD verification
- Quick manual testing

### 2. In-Memory Pool (Railway/Production)
**Use case**: Ephemeral filesystems, cloud deployments

No configuration needed. Instead of waiting for a file, the automation waits for a code in the in-memory pool. User submits the received OTP via API:

```bash
curl -X POST http://localhost:4000/api/platforms/tapaz/otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+994555010101", "code": "1234"}'
```

The automation polls the in-memory pool and continues once the code is available. This works on:
- Railway (ephemeral `/tmp` filesystem)
- Heroku
- Render
- Other serverless platforms

### 3. File-Based Polling (Local Development)
**Use case**: Local testing with actual platform interaction

No configuration needed. The automation creates a file and waits for you to write the OTP:

```bash
# Terminal 1: Start server (watches for file)
npm run server:dev

# Terminal 2: When prompted, submit OTP to file
echo "1234" > .tapaz-otp
```

The console output shows:
```
────────────────────────────────────────────────────────────────────
[tapaz] OTP required for phone: +994555010101
[tapaz] Option 1: Write OTP code to: /path/to/.tapaz-otp
[tapaz] Option 2: POST to /api/platforms/tapaz/otp with { phone, code }
[tapaz] Timeout: 120s
[tapaz] Example file: echo 1234 > "/path/to/.tapaz-otp"
────────────────────────────────────────────────────────────────────
```

Or use the API endpoint (works same as in-memory pool):

```bash
curl -X POST http://localhost:4000/api/platforms/tapaz/otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+994555010101", "code": "1234"}'
```

## Testing Locally

### Quick Test (Static OTP)

```bash
# Start server with static OTP
TAPAZ_OTP_CODE=1234 LALAFO_OTP_CODE=1234 npm run server:dev

# In another terminal, test the flow
curl -X POST http://localhost:4000/api/platforms/tapaz/start-login \
  -H "Content-Type: application/json" \
  -H "Cookie: auth=YOUR_TOKEN" \
  -d '{"phone": "+994555010101"}'

# Then verify OTP (immediately works with static OTP)
curl -X POST http://localhost:4000/api/platforms/tapaz/verify-otp \
  -H "Content-Type: application/json" \
  -H "Cookie: auth=YOUR_TOKEN" \
  -d '{"phone": "+994555010101", "otp": "1234"}'
```

### Interactive Test (Actual SMS)

```bash
# Start server (no static OTP)
npm run server:dev

# Call start-login, it will prompt for OTP file or API
curl -X POST http://localhost:4000/api/platforms/tapaz/start-login \
  -H "Content-Type: application/json" \
  -H "Cookie: auth=YOUR_TOKEN" \
  -d '{"phone": "+994555010101"}'

# In another terminal, once you receive SMS:
curl -X POST http://localhost:4000/api/platforms/tapaz/otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+994555010101", "code": "XXXX"}'

# Then verify
curl -X POST http://localhost:4000/api/platforms/tapaz/verify-otp \
  -H "Content-Type: application/json" \
  -H "Cookie: auth=YOUR_TOKEN" \
  -d '{"phone": "+994555010101", "otp": "XXXX"}'
```

## Testing on Railway

Railway deploys with Docker, which has an ephemeral filesystem. Use the API endpoint method:

1. Set up on Railway (no special OTP config needed)
2. When platform login is triggered, user waits for actual SMS from platform
3. User receives SMS and submits OTP via API endpoint:

```bash
curl -X POST https://your-railway-app.railway.app/api/platforms/tapaz/otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+994555010101", "code": "1234"}'
```

The Selenium automation (running in the same container) receives the code from the in-memory pool and completes the login.

## Customization

### Custom OTP Timeout
Increase timeout (default 120s):

```bash
TAPAZ_OTP_TIMEOUT_MS=300000 npm run server:dev  # 5 minutes
```

### Custom File Path (local dev)
```bash
TAPAZ_OTP_FILE=/tmp/my-otp npm run server:dev
```

## Troubleshooting

### "OTP timeout — no code received"
- **File method**: Ensure file exists and contains only digits (no extra whitespace)
- **API method**: Check that the `/api/platforms/:platform/otp` endpoint was called before timeout
- **Static method**: Verify env var is set and valid (4-6 digits)

### "Phone and code are required"
When calling the OTP API endpoint, ensure both fields are in the request body:
```json
{"phone": "+994555010101", "code": "1234"}
```

### File not found / Permission denied
The automation may not have write access to the working directory. Use custom path or API method:

```bash
TAPAZ_OTP_FILE=$HOME/.tapaz-otp npm run server:dev
```

## Implementation Details

The OTP service prioritizes in this order:
1. **Static env vars** (highest priority) - instant
2. **In-memory pool** - polls every 500ms, timeout 2min
3. **File polling** (fallback) - polls file every 500ms, timeout 2min

All three methods can coexist. The automation tries them in order and uses whichever is available.
