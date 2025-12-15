# API Documentation

This document covers the EFT Quest Tracker API endpoints, with a focus on the companion app authentication system.

## Authentication

The API supports two authentication methods:

1. **Session-based authentication** (Web app) - Uses NextAuth session cookies
2. **Token-based authentication** (Companion app) - Uses Bearer tokens in Authorization header

### Why Token-Based Auth for Companion App?

The Tauri companion app runs on `tauri://localhost` while the API is at `https://learntotarkov.com`. Session cookies cannot be shared across different origins due to browser security restrictions (CORS, SameSite policies). Token-based authentication solves this by including the token in the Authorization header of each request.

## Companion API Endpoints

All companion endpoints are prefixed with `/api/companion/`.

---

### POST /api/companion/link

Generate a new companion token for linking a device.

**Authentication:** Session-based (web app only)

**Request Body:**

```json
{
  "deviceName": "My Desktop PC",
  "gameMode": "PVP"
}
```

**Response (201 Created):**

```json
{
  "token": "cmp_a1b2c3d4e5f6789012345678901234ab",
  "deviceName": "My Desktop PC",
  "createdAt": "2025-12-15T03:00:00.000Z"
}
```

**Error Responses:**

- `401 Unauthorized`: No valid session
- `429 Too Many Requests`: Device limit reached (max 5 tokens per user)

**Notes:**

- Token is shown only once and cannot be retrieved later
- Token format: `cmp_` prefix + 32 hexadecimal characters
- Token is hashed with bcrypt (cost factor 10) before storage
- Only last 4 characters stored as hint for identification

**Example:**

```bash
curl -X POST https://learntotarkov.com/api/companion/link \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"deviceName":"My Laptop","gameMode":"PVE"}'
```

---

### GET /api/companion/link

List all active companion tokens for the authenticated user.

**Authentication:** Session-based (web app only)

**Response (200 OK):**

```json
[
  {
    "id": "cljx1234567890",
    "deviceName": "My Desktop PC",
    "gameMode": "PVP",
    "lastSeen": "2025-12-15T02:55:00.000Z",
    "createdAt": "2025-12-14T10:00:00.000Z"
  },
  {
    "id": "cljx9876543210",
    "deviceName": "Work Laptop",
    "gameMode": "PVE",
    "lastSeen": "2025-12-14T18:30:00.000Z",
    "createdAt": "2025-12-13T14:20:00.000Z"
  }
]
```

**Error Responses:**

- `401 Unauthorized`: No valid session

---

### POST /api/companion/status

Validate a companion token and return user information with quest statistics.

**Authentication:** Bearer token

**Request Headers:**

```
Authorization: Bearer cmp_a1b2c3d4e5f6789012345678901234ab
```

**Response (200 OK):**

```json
{
  "valid": true,
  "userId": "user_abc123",
  "userName": "JohnDoe",
  "stats": {
    "completed": 45,
    "inProgress": 12,
    "available": 23,
    "locked": 120
  }
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid, expired, or revoked token

```json
{
  "valid": false,
  "error": "Invalid or revoked token"
}
```

**Notes:**

- Updates the token's `lastSeen` timestamp on successful validation
- O(n) bcrypt comparison against all active tokens (acceptable for typical usage)

**Example:**

```bash
curl -X POST https://learntotarkov.com/api/companion/status \
  -H "Authorization: Bearer cmp_a1b2c3d4e5f6789012345678901234ab"
```

---

### POST /api/companion/sync

Sync quest progress from the companion app to the database.

**Authentication:** Bearer token

**Request Headers:**

```
Authorization: Bearer cmp_a1b2c3d4e5f6789012345678901234ab
```

**Request Body:**

```json
{
  "events": [
    {
      "questId": "5936d90786f7742b1420ba5b",
      "status": "STARTED",
      "timestamp": "2025-12-15T03:00:00.000Z"
    },
    {
      "questId": "5967530a86f77462ba22226b",
      "status": "COMPLETED",
      "timestamp": "2025-12-15T03:05:00.000Z"
    }
  ]
}
```

**Status Mapping:**

Companion app status → Database status

- `STARTED` → `IN_PROGRESS`
- `COMPLETED` → `COMPLETED`
- `FAILED` → `AVAILABLE`

**Response (200 OK):**

```json
{
  "success": true,
  "synced": 2,
  "stats": {
    "completed": 46,
    "inProgress": 13,
    "available": 24,
    "locked": 119
  }
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid, expired, or revoked token
- `400 Bad Request`: Invalid event format or quest ID not found

```json
{
  "success": false,
  "error": "Some events failed to sync",
  "synced": 1,
  "failedEvents": [
    {
      "questId": "invalid_quest_id",
      "status": "COMPLETED",
      "reason": "Quest not found"
    }
  ],
  "stats": {
    "completed": 46,
    "inProgress": 13,
    "available": 24,
    "locked": 119
  }
}
```

**Notes:**

- All updates are performed in a database transaction for atomicity
- Automatically unlocks dependent quests when prerequisites are completed
- Returns updated quest statistics after sync

**Example:**

```bash
curl -X POST https://learntotarkov.com/api/companion/sync \
  -H "Authorization: Bearer cmp_a1b2c3d4e5f6789012345678901234ab" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "questId": "5936d90786f7742b1420ba5b",
        "status": "STARTED",
        "timestamp": "2025-12-15T03:00:00.000Z"
      }
    ]
  }'
```

---

### DELETE /api/companion/unlink

Revoke a companion token (soft delete).

**Authentication:** Session-based (web app only)

**Request Body:**

```json
{
  "tokenId": "cljx1234567890"
}
```

**Response (200 OK):**

```json
{
  "success": true
}
```

**Error Responses:**

- `401 Unauthorized`: No valid session
- `400 Bad Request`: Missing or invalid tokenId
- `403 Forbidden`: Token belongs to another user
- `404 Not Found`: Token not found or already revoked

**Notes:**

- Uses soft delete pattern (sets `revokedAt` timestamp)
- Revoked tokens cannot be reactivated
- Companion app automatically clears invalid tokens on 401 response

**Example:**

```bash
curl -X DELETE https://learntotarkov.com/api/companion/unlink \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"tokenId":"cljx1234567890"}'
```

---

## Security Considerations

### Token Security

- **Hashing:** Tokens are hashed with bcrypt (cost factor 10) before storage
- **One-time display:** Raw tokens are never stored and shown only once during generation
- **Token format validation:** Enforced regex pattern: `^cmp_[a-f0-9]{32}$`
- **Soft delete:** Revoked tokens kept in database with `revokedAt` timestamp for audit trail

### Rate Limiting

- **Token generation:** 5 tokens per user maximum (enforced at database level)
- **API requests:** No rate limiting implemented yet (future enhancement)

### CORS

- **Web app:** Uses `credentials: "include"` for session cookies
- **Companion app:** Uses `credentials: "omit"` and Bearer token authentication

### Token Storage

- **MVP:** localStorage in Tauri app (accessible but convenient)
- **Post-MVP:** Migrate to Tauri secure store (`@tauri-apps/plugin-store`)

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request format or parameters
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Valid authentication but insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Unexpected server error

---

## Database Schema

### CompanionToken Model

```prisma
model CompanionToken {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token      String    @unique // bcrypt hashed
  tokenHint  String    // Last 4 chars for identification
  deviceName String
  gameMode   String
  lastSeen   DateTime  @default(now())
  createdAt  DateTime  @default(now())
  revokedAt  DateTime? // Soft delete

  @@index([userId])
  @@index([token])
  @@map("companion_tokens")
}
```

---

## Additional Resources

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma ORM](https://www.prisma.io/docs)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [Tauri Security](https://tauri.app/v1/guides/security/)
