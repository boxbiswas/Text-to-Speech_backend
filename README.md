# 🎙️ AuraVox — Backend API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![AWS Polly](https://img.shields.io/badge/AWS_Polly-TTS_Engine-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

**REST API powering AuraVox — a full-stack Text-to-Speech Studio. Handles user authentication, voice discovery via Amazon Polly, real-time audio synthesis, and per-user speech history management.**

</div>

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Architecture](#-architecture)
3. [Folder Structure](#-folder-structure)
4. [Tech Stack](#-tech-stack)
5. [Database Schema](#-database-schema)
6. [API Reference](#-api-reference)
7. [Authentication Flow](#-authentication-flow)
8. [TTS Provider Architecture](#-tts-provider-architecture)
9. [Environment Variables](#-environment-variables)
10. [Installation & Setup](#-installation--setup)
11. [Scripts](#-scripts)
12. [Dependencies](#-dependencies)
13. [Security](#-security)
14. [Error Handling](#-error-handling)

---

## 🔍 Overview

The AuraVox backend is a stateless REST API built with **Express.js v5** on **Node.js**. It is responsible for:

- **User authentication** via HTTP-only JWT cookies (register, login, logout)
- **TTS provider integration** — currently Amazon Polly with commented-out stubs for ElevenLabs and Azure
- **Voice discovery** — paginated fetching from Amazon Polly's `DescribeVoices` API (handles bilingual voices like Aditi)
- **Audio synthesis** — generates audio as Base64-encoded strings with automatic neural-to-standard engine fallback
- **Speech history** — stores every generated audio record per user in PostgreSQL, with full CRUD

---

## 🏗️ Architecture

```
HTTP Request
    ↓
app.js  ── CORS ── Cookie Parser ── JSON Body Parser
    ↓
Route  (authRoute / ttsRoutes / historyRoute)
    ↓
Middleware  (authenticate → JWT verify → attach req.user)
    ↓
Controller  (business logic + validation)
    ↓
Service / Prisma  (TTS provider or DB query)
    ↓
JSON Response
```

### Request Lifecycle

1. **CORS** validates the request origin against the whitelist.
2. **Cookie Parser** makes the `token` cookie available as `req.cookies.token`.
3. **Express JSON** parses the request body.
4. **Route** matches the URL and method.
5. **`authenticate` middleware** verifies the JWT, decodes user data, and injects `req.user`.
6. **Controller** validates inputs, calls the service or Prisma, and responds.

---

## 📂 Folder Structure

```
backend/
│
├── app.js                      # Server entry point — middleware & route mounting
├── prisma.config.ts            # Prisma CLI config (schema + migration paths + DB URL)
├── package.json                # Dependencies and npm scripts
├── .env                        # Secrets (never commit)
│
├── lib/
│   └── prisma.js               # Singleton PrismaClient instance
│
├── middlewares/
│   └── authMiddleware.js       # JWT verification + req.user injection
│
├── controllers/
│   ├── authController.js       # register, login, logout
│   ├── ttsController.js        # getVoices, generateSpeech
│   └── historyController.js    # createHistory, getHistory, getHistoryById, deleteHistory
│
├── routes/
│   ├── authRoute.js            # POST /auth/register, /auth/login, /auth/logout
│   ├── ttsRoutes.js            # GET /tts/voices, POST /tts
│   └── historyRoute.js         # GET/POST/DELETE /history, GET /history/:id
│
├── services/
│   └── ttsService.js           # Amazon Polly integration (voice list + audio synthesis)
│
└── prisma/
    └── schema.prisma           # Database schema — User + SpeechHistory models
```

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 22.x | JavaScript runtime |
| **Express** | 5.x | HTTP framework |
| **Prisma** | 7.x | ORM, schema management, migrations |
| **@prisma/client** | 7.x | Type-safe database queries |
| **pg** | 8.x | PostgreSQL connection pool |
| **@aws-sdk/client-polly** | 3.x | Amazon Polly TTS API |
| **bcrypt** | 6.x | Password hashing (10 salt rounds) |
| **jsonwebtoken** | 9.x | JWT signing and verification |
| **cookie-parser** | 1.x | HTTP-only cookie support |
| **cors** | 2.x | Cross-origin resource sharing |
| **dotenv** | 17.x | Environment variable loading |
| **nodemon** | 3.x | Dev server auto-restart |

---

## 🗄️ Database Schema

The database is hosted on **Supabase** (PostgreSQL). Prisma is used as the ORM.

### Models

#### `User`
| Field | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Primary key, auto-generated |
| `name` | `String` | User's full name |
| `email` | `String` | Unique |
| `passwordHash` | `String` | bcrypt hash |
| `createdAt` | `DateTime` | Auto-set on creation |
| `updatedAt` | `DateTime` | Auto-updated |
| `history` | `SpeechHistory[]` | Relation — one user → many history records |

#### `SpeechHistory`
| Field | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Primary key, auto-generated |
| `userId` | `String` | Foreign key → `User.id` (cascade delete) |
| `text` | `String` | The synthesized text |
| `language` | `String` | Language code (e.g., `en-US`) |
| `voice` | `String` | Polly Voice ID (e.g., `Joanna`) |
| `audioUrl` | `String` | Base64-encoded `data:audio/mp3;base64,...` string |
| `audioFormat` | `String` | `mp3` or `ogg` |
| `createdAt` | `DateTime` | Auto-set on creation |

### Indexes
- `User.email` — fast email lookups during login
- `SpeechHistory.userId` — fast per-user history queries
- `SpeechHistory.createdAt` — fast date-ordered queries

---

## 📡 API Reference

> **Base URL (local):** `http://localhost:<YOUR_PORT_HERE>`  
> All `/tts` and `/history` routes require a valid JWT cookie.

### Auth Routes — `/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Register a new user |
| `POST` | `/auth/login` | ❌ | Login and receive JWT cookie |
| `POST` | `/auth/logout` | ❌ | Clear the JWT cookie |

#### `POST /auth/register`
```json
// Request Body
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "yourpassword"
}

// Response 201
{
  "message": "Registration successful",
  "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" }
}
```

#### `POST /auth/login`
```json
// Request Body
{
  "email": "john@example.com",
  "password": "yourpassword"
}

// Response 200  (also sets HTTP-only cookie: token=<JWT>)
{
  "message": "Login successful",
  "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" }
}
```

---

### TTS Routes — `/tts`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/tts/voices` | ✅ | Fetch all available voices and languages from Amazon Polly |
| `POST` | `/tts` | ✅ | Generate audio from text |

#### `GET /tts/voices`
```json
// Response 200
{
  "languages": [
    { "code": "en-US", "name": "US English" },
    { "code": "hi-IN", "name": "Hindi" }
  ],
  "voices": [
    {
      "id": "Joanna",
      "name": "Joanna",
      "languageCode": "en-US",
      "languageName": "US English",
      "gender": "Female",
      "additionalLanguageCodes": []
    }
  ]
}
```

#### `POST /tts`
```json
// Request Body
{
  "text": "Hello, welcome to AuraVox!",
  "language": "en-US",
  "voice": "Joanna",
  "format": "mp3"
}

// Response 200
{
  "audioUrl": "data:audio/mp3;base64,<base64_string>"
}
```

> **Supported formats:** `mp3`, `ogg`

---

### History Routes — `/history`

All routes require authentication.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/history` | ✅ | Save a speech history record |
| `GET` | `/history` | ✅ | Get all history for the logged-in user |
| `GET` | `/history/:id` | ✅ | Get a specific history item |
| `DELETE` | `/history/:id` | ✅ | Delete a specific history item |

#### `GET /history`
```json
// Response 200
[
  {
    "id": "uuid",
    "userId": "uuid",
    "text": "Hello world",
    "language": "en-US",
    "voice": "Joanna",
    "audioUrl": "data:audio/mp3;base64,...",
    "audioFormat": "mp3",
    "createdAt": "2026-09-17T12:00:00.000Z"
  }
]
```

> **Security:** Users can only access their own history. Attempting to access another user's record returns `403 Forbidden`.

---

## 🔐 Authentication Flow

```
1. User POSTs credentials to /auth/login
2. Controller verifies email exists and bcrypt.compare(password, hash) passes
3. jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' }) creates a signed token
4. res.cookie('token', token, { httpOnly: true, secure: true, sameSite: ... })
5. On subsequent requests: Cookie sent automatically by browser
6. authenticate middleware: jwt.verify(req.cookies.token, JWT_SECRET)
7. Decoded payload attached to req.user  →  controller has access to req.user.id
```

**Cookie Settings:**

| Setting | Development | Production |
|---|---|---|
| `httpOnly` | `true` | `true` |
| `secure` | `false` | `true` (HTTPS only) |
| `sameSite` | `lax` | `none` (cross-origin) |
| `maxAge` | 7 days | 7 days |

---

## 🔊 TTS Provider Architecture

The `ttsService.js` file is designed to support multiple TTS providers. The active provider is **Amazon Polly**. The code for **ElevenLabs** and **Azure Cognitive Services** is preserved in comments for easy switching.

### Amazon Polly — Active

**Voice Discovery (`getProviderVoices`)**
- Paginates through `DescribeVoicesCommand` using `NextToken` to retrieve all 100+ voices
- Maps `AdditionalLanguageCodes` so bilingual voices (e.g., Aditi: `en-IN` + `hi-IN`) are discoverable in both languages

**Audio Synthesis (`generateAudio`)**
- Tries `Engine: 'neural'` first (higher quality)
- If Polly returns a `ValidationException` (voice doesn't support neural), automatically retries with `Engine: 'standard'`
- Returns audio as a `data:<mimeType>;base64,...` string — no disk writes needed

**Supported Formats:**
| Frontend Value | Polly `OutputFormat` | MIME Type |
|---|---|---|
| `mp3` | `mp3` | `audio/mp3` |
| `ogg` | `ogg_vorbis` | `audio/ogg` |

---

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=<YOUR_PORT_HERE>

# JWT
JWT_SECRET=<YOUR_JWT_SECRET_HERE>

# Database (Supabase PostgreSQL)
DATABASE_URL=<YOUR_DATABASE_URL_HERE>
DIRECT_URL=<YOUR_DIRECT_URL_HERE>

# AWS Amazon Polly
AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY_ID_HERE>
AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_ACCESS_KEY_HERE>
AWS_REGION=<YOUR_AWS_REGION_HERE>
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | Express server port (e.g., `3000`) |
| `JWT_SECRET` | ✅ | Long, random secret for signing JWTs. Use 64+ char hex string. |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Supabase pooler URL) |
| `DIRECT_URL` | ✅ | Direct PostgreSQL connection string (used by Prisma CLI for migrations) |
| `AWS_ACCESS_KEY_ID` | ✅ | AWS IAM key with `polly:SynthesizeSpeech` + `polly:DescribeVoices` permissions |
| `AWS_SECRET_ACCESS_KEY` | ✅ | AWS IAM secret |
| `AWS_REGION` | ✅ | AWS region where Polly is used (e.g., `ap-south-1` for Mumbai) |

---

## 🚀 Installation & Setup

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18.x+ (22.x recommended) |
| npm | 9.x+ |
| AWS Account | With IAM user having Polly permissions |
| PostgreSQL | Supabase or any cloud PostgreSQL |

### Steps

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install all dependencies
npm install

# 3. Create .env file and fill in all variables
# (see Environment Variables section above)

# 4. Apply database migrations to your Supabase instance
npx prisma migrate deploy

# 5. (Optional) Open Prisma Studio to browse the database
npx prisma studio

# 6. Start the development server
npm run dev
# → Server starts at http://localhost:<YOUR_PORT_HERE>
```

---

## 📜 Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `nodemon app.js` | Start with auto-restart on file changes |
| `start` | `node app.js` | Start in production mode |

---

## 📦 Dependencies

### Production

| Package | Version | Purpose |
|---|---|---|
| `express` | `^5.2.1` | HTTP server framework |
| `@prisma/client` | `^7.8.0` | Type-safe ORM queries |
| `@prisma/adapter-pg` | `^7.8.0` | pg connection pool adapter for Prisma |
| `pg` | `^8.22.0` | PostgreSQL connection pool |
| `@aws-sdk/client-polly` | `^3.x` | Amazon Polly TTS SDK |
| `bcrypt` | `^6.0.0` | Password hashing |
| `jsonwebtoken` | `^9.0.3` | JWT creation and verification |
| `cookie-parser` | `^1.x` | Parse HTTP cookies |
| `cors` | `^2.8.6` | CORS headers |
| `dotenv` | `^17.4.2` | `.env` loading |
| `nodemon` | `^3.1.14` | Dev auto-restart |

### Dev

| Package | Version | Purpose |
|---|---|---|
| `prisma` | `^7.10.0` | Prisma CLI (migrate, generate, studio) |

---

## 🔐 Security

| Concern | Implementation |
|---|---|
| **Password storage** | bcrypt with 10 salt rounds — passwords never stored in plaintext |
| **Token transport** | HTTP-only cookies — inaccessible to JavaScript (XSS-proof) |
| **Token expiry** | 7 days — enforced by `jsonwebtoken` |
| **HTTPS enforcement** | `secure: true` in production — cookie only transmitted over HTTPS |
| **CORS whitelist** | Explicit origin list — only known frontend origins allowed |
| **History isolation** | All history queries scoped to `req.user.id` — cross-user access returns `403` |
| **Input validation** | Required field checks in every controller before touching the database |

---

## ⚠️ Error Handling

All controllers follow a consistent `try/catch` pattern:

```javascript
try {
    // Business logic
    return res.status(200).json({ ... });
} catch (error) {
    console.error("Context Error:", error);
    return res.status(500).json({ message: 'Internal server error' });
}
```

**HTTP Status Codes used:**

| Code | Meaning | When Used |
|---|---|---|
| `200` | OK | Successful GET/POST |
| `201` | Created | Successful resource creation |
| `400` | Bad Request | Missing or invalid input fields |
| `401` | Unauthorized | Missing or invalid JWT cookie |
| `403` | Forbidden | Valid JWT but insufficient ownership |
| `404` | Not Found | Resource doesn't exist |
| `500` | Internal Server Error | Unexpected database or provider errors |

---

*See also: [Frontend README](../frontend/README.md)*
