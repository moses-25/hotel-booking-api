# Postman Testing Guide — Hotel Booking API

Complete, current reference for testing the API with Postman. It covers the
environment setup, the correct order to run requests (including the
first-user bootstrap), every endpoint, the exact response/error shapes the
code returns, and a troubleshooting table built from the real error messages.

> This file reflects the **current state of the database** (roles `10-12`,
> statuses `13-16`). The older `POSTMAN_TESTING_GUIDE.md` assumes ids `1-4`;
> where they differ, follow this file.

---

## Table of contents

1. [Quick start (TL;DR)](#1-quick-start-tldr)
2. [Prerequisites](#2-prerequisites)
3. [Environment variables](#3-environment-variables)
4. [Conventions: headers, auth & token rotation](#4-conventions-headers-auth--token-rotation)
5. [Reference data: role & status ids](#5-reference-data-role--status-ids)
6. [Step-by-step: bootstrap → create → login → store token](#6-step-by-step-bootstrap--create--login--store-token)
7. [Endpoint reference](#7-endpoint-reference)
8. [Postman test scripts](#8-postman-test-scripts)
9. [Rate limits](#9-rate-limits)
10. [Error responses (exact shapes)](#10-error-responses-exact-shapes)
11. [Troubleshooting](#11-troubleshooting)
12. [Quick reference card](#12-quick-reference-card)

---

## 1. Quick start (TL;DR)

The `user` table starts **empty**, so you cannot log in yet. The order is:

```
1. node generate-token.mjs          → paste into env var  user_token
2. users/create   (role:10, status:13)  with Bearer {{user_token}}
3. auth/login     (steph@mail.com / pass1234) → copy `authentication`
4. store that value in env var  user_token
5. users/list-all  → 200 OK
```

Full walkthrough: [section 6](#6-step-by-step-bootstrap--create--login--store-token).

---

## 2. Prerequisites

- **API running:** `npm run dev` (the server listens on `http://<your-ip>:7799`).
- **Postman** installed and open.
- **Environment selected** in the top-right dropdown (otherwise `{{...}}`
  variables resolve to literal text and every request fails).
- `.env` present (created via `npm run env-var` if missing).

The API is mounted at `/api/v1`, so the base URL is:

```
http://<your-ip>:7799/api/v1
```

---

## 3. Environment variables

Create a Postman environment (e.g. `hotel-booking-api`) with:

| Variable      | Type    | Example value                                                      | Notes                                                   |
| ------------- | ------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| `api_address` | default | `http://192.168.0.20:7799/api/v1`                                  | Your machine's LAN IP + `:7799/api/v1`                  |
| `api_key`     | default | `2e9bc6c94a4cbdfe2a31d2df79103a5eb3702eaf5d7018d47a774e9540a8ec29` | Must equal `API_KEY` in `.env`                          |
| `user_token`  | default | _(empty)_                                                          | Holds the JWT; filled by login (or the bootstrap token) |

Notes:

- `api_key` must **exactly** match `API_KEY` in `.env` (64 hex chars). If it
  does not, every request returns `401 "Invalid API key"`.
- The token lives in **`user_token`**. (The committed `postman-collection.json`
  uses a variable called `token`; either rename it in the collection's
  `Authorization` headers to `{{user_token}}`, or keep both — see
  [section 8](#8-postman-test-scripts).)
- Find your LAN IP with `hostname -I` (Linux) if `192.168.0.20` is not yours.

---

## 4. Conventions: headers, auth & token rotation

### Required headers

| Header          | Value                   | Where                                         |
| --------------- | ----------------------- | --------------------------------------------- |
| `Content-Type`  | `application/json`      | All requests with a body                      |
| `apikey`        | `{{api_key}}`           | **Every** request (both public and protected) |
| `Authorization` | `Bearer {{user_token}}` | Protected `/users/*` routes only              |

`POST /auth/login` and `POST /auth/reset-password` are **public** — they need
`apikey` but **not** `Authorization`.

### Auth model

1. `checkAPIkey` verifies the `apikey` header on every route. Missing/wrong →
   `401 "Invalid API key"`.
2. `authAppVerifyToken` protects every `/users/*` route. It:
   - requires `Authorization: Bearer <jwt>`,
   - verifies the signature with `AUTH_API_JWT_SECRET_KEY`,
   - **rotates** the token: it signs a fresh JWT (2-minute window) and returns
     it in the response header `X-Access-Token`.

### Token lifetime & rotation

- Every JWT is valid for **2 minutes** (`expiresIn: '2m'`).
- Because tokens are stateless/rotating, an old token stays valid until it
  expires — but the collection is designed to keep grabbing the fresh
  `X-Access-Token`.
- If you store the JWT in `user_token`, either:
  - re-run **login** to refresh it, or
  - add a collection-level test that copies `X-Access-Token` into `user_token`
    (snippet in [section 8](#8-postman-test-scripts)).

---

## 5. Reference data: role & status ids

`user.role` and `user.status` are **foreign keys**. The numeric ids in your
database are:

### Roles — `user_role`

| id     | name          |
| ------ | ------------- |
| **10** | Administrator |
| 11     | Staff         |
| 12     | Guest         |

### Statuses — `user_status`

| id     | name      |
| ------ | --------- |
| **13** | Active    |
| 14     | Inactive  |
| 15     | Suspended |
| 16     | Deleted   |

> **Important:** the ids are **10-12 / 13-16**, not `1/2/3`. This is because the
> seed files ran more than once and advanced the Postgres sequences. Sending
> `"role": 1` or `"status": 1` violates the FK constraints
> (`user_role_fkey`, `user_status_fkey`) and the create/update fails.
>
> For a session to log in, the user's status must be **13 (Active)**.

If you ever need to confirm the ids yourself:

```bash
node --input-type=module -e "
import { Sequelize } from 'sequelize';
import { config } from './src/config/config.js';
const s = new Sequelize(config.dbName, config.dbUser, config.dbPassword, { host: config.dbHost, port: config.dbPort, dialect: config.dialect, logging: false });
const [r] = await s.query('SELECT id, name FROM user_role ORDER BY id');
const [st] = await s.query('SELECT id, name FROM user_status ORDER BY id');
console.log('roles   :', JSON.stringify(r));
console.log('statuses:', JSON.stringify(st));
await s.close();
"
```

---

## 6. Step-by-step: bootstrap → create → login → store token

### Why the bootstrap is needed

- `POST /users/create` requires a valid token (`authAppVerifyToken`).
- `POST /auth/login` requires an existing user.
- With zero users, neither can run first. `generate-token.mjs` breaks the
  deadlock by signing a throwaway JWT directly with the same secret.

### Step 0 — Start the server

```bash
npm run dev
```

### Step 1 — Generate a bootstrap token

```bash
node generate-token.mjs
```

It prints an `eyJ...` token. Copy it and paste it into the Postman
environment variable **`user_token`**.

> The bootstrap token is signature-only (id `1`, role `1`) — that is fine,
> because `authAppVerifyToken` only checks the signature. It is used once to
> create the first real user.

### Step 2 — Create the first user

- **Request:** `POST {{api_address}}/users/create`
- **Headers:** `Content-Type: application/json`, `apikey: {{api_key}}`,
  `Authorization: Bearer {{user_token}}`
- **Body** (note `role: 10`, `status: 13`):

```json
{
  "firstName": "Steph",
  "middleName": "Curry",
  "firstLastName": "Curry",
  "secondLastName": "",
  "email": "steph@mail.com",
  "password": "pass1234",
  "role": 10,
  "status": 13,
  "phones": ["4444444444", "5555555555"]
}
```

- **Expected:** `201 Created`

```json
{ "success": true, "message": "User created successfully" }
```

The response also carries an `X-Access-Token` header (the rotated token).

### Step 3 — Log in as the new user

- **Request:** `POST {{api_address}}/auth/login`
- **Headers:** `Content-Type: application/json`, `apikey: {{api_key}}`
  (no `Authorization`)
- **Body:**

```json
{ "email": "steph@mail.com", "password": "pass1234" }
```

- **Expected:** `200 OK`

```json
{
  "success": true,
  "message": "Login successful.",
  "authentication": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> The JWT is in the field **`authentication`** (not `token`).

### Step 4 — Store the new token in `user_token`

**Manually:** copy the `authentication` value → Postman environment →
set variable **`user_token`**.

**Automatically:** paste this into the login request's **Tests** tab:

```js
const body = pm.response.json();
if (body.authentication) {
  pm.environment.set("user_token", body.authentication);
}
```

From now on, every successful login writes the fresh JWT into `user_token`.

### Step 5 — Verify

Run **users → list-all** with `Authorization: Bearer {{user_token}}`.
Expected `200 OK` with your user in the `users` array.

After the first user exists, you can ignore `generate-token.mjs` and always
start from **login**.

---

## 7. Endpoint reference

All paths are relative to `{{api_address}}` = `.../api/v1`.

### 7.1 `POST /auth/login` — public

Authenticate and receive a JWT.

- **Headers:** `Content-Type`, `apikey`
- **Body:** `{ "email": "steph@mail.com", "password": "pass1234" }`
- **Success:** `200` → `{ "success": true, "message": "Login successful.", "authentication": "<jwt>" }`
- **Errors:** `401 INVALID_CREDENTIALS`, `403 USER_INACTIVE`,
  `400` missing fields, `401 "Invalid API key"`, `429 TOO_MANY_REQUESTS`

### 7.2 `POST /auth/reset-password` — public

Reset a forgotten password by verifying identity (no old password needed).

- **Headers:** `Content-Type`, `apikey`
- **Body:**

```json
{
  "email": "steph@mail.com",
  "firstName": "Steph",
  "firstLastName": "Curry",
  "newPassword": "newpass1234"
}
```

- **Success:** `200` → `{ "success": true, "message": "Password reset successfully. Please log in your new password." }`
- **Errors:** `400` missing fields or new password equals the old one;
  `404 "No user was found matching the provided data."`;
  `429 TOO_MANY_REQUESTS`

### 7.3 `POST /users/create` — protected

Insert a user (and optional phones).

- **Headers:** `Content-Type`, `apikey`, `Authorization: Bearer {{user_token}}`
- **Body:** see [Step 2](#step-2--create-the-first-user). `role`/`status` are
  numeric FKs. `middleName`, `secondLastName`, `lastLogin`, `phones` optional.
- **Success:** `201` → `{ "success": true, "message": "User created successfully" }`
- **Errors:** `409` duplicate email; `500` FK violation (wrong `role`/`status` id)

### 7.4 `POST /users/list-one` — protected

Fetch one user by id.

- **Body:** `{ "userId": 1 }`
- **Success:** `200` → `{ "success": true, "message": "User found successfully", "user": { ... } }`
  (password is stripped; `role`/`status` embedded as `{ id, name }`)
- **Errors:** `400 "No user identifier provided"`; `404` if not found

### 7.5 `POST /users/find-by-email` — protected

Fetch one user by email (great for grabbing the new `id`).

- **Body:** `{ "email": "steph@mail.com" }`
- **Success:** `200` → same shape as `list-one` (password stripped)
- **Errors:** `404` if not found

### 7.6 `GET /users/list-all` — protected

List every user.

- **Body:** none
- **Success:** `200` → `{ "success": true, "message": "Users found successfully", "total": <n>, "users": [ ... ] }`

### 7.7 `PUT /users/update` — protected

Update a user's profile fields (not password / lastLogin).

- **Body:**

```json
{
  "userId": 1,
  "firstName": "Michael",
  "middleName": "Junior",
  "firstLastName": "Jackson",
  "secondLastName": "Jackson",
  "email": "jackson@mail.com",
  "role": 11,
  "status": 14
}
```

- **Success:** `200` → `{ "success": true, "message": "User updated successfully" }`
- **Errors:** `400 "No user identifier provided"`; `409` duplicate email; `500` bad FK id

### 7.8 `PUT /users/update-phones` — protected

**Replace** the full phone list (not a merge). Empty array clears them.

- **Body:** `{ "userId": 1, "phones": ["5555555555", "8888888888"] }`
- **Success:** `200` → `{ "success": true, "message": "User phones updated successfully", "phones": [ ... ] }`
- **Errors:** `400 "No user identifier provided"` / `400 "No phones provided"`

### 7.9 `POST /users/update-last-login` — protected

Stamp `lastLogin` to now.

- **Body:** `{ "userId": 1 }`
- **Success:** `200` → `{ "success": true, "message": "Last login updated successfully" }`
- **Errors:** `400 "No user identifier provided"`

### 7.10 `DELETE /users/delete` — protected

Delete a user and their phones.

- **Body:** `{ "userId": 1 }`
- **Success:** `200` → `{ "success": true, "message": "User deleted successfully" }`
- **Errors:** `400 "No user identifier provided"`; `404` if not found

---

## 8. Postman test scripts

Each request has a **Tests** tab that runs after the response arrives.

### Login — save the JWT to `user_token`

```js
pm.test("Status is 200 OK", () => {
  pm.response.to.have.status(200);
});

pm.test("Returns a JWT in authentication", () => {
  const j = pm.response.json();
  pm.expect(j.success).to.eql(true);
  pm.expect(j.authentication).to.be.a("string");
  pm.expect(j.authentication.split(".")).to.have.length(3);
});

// Save the fresh token so later requests are authenticated.
const body = pm.response.json();
if (body.authentication) {
  pm.environment.set("user_token", body.authentication);
}
```

### Collection-level test — keep the token fresh on rotation

Put this on the **collection** (collection → Tests tab) so it runs after every
request. It captures the rotated token returned by `authAppVerifyToken`:

```js
// Protected endpoints rotate the JWT and return it in X-Access-Token.
// Save it so the next request uses a fresh, valid token.
// (login doesn't set this header, so the login token is left intact.)
if (pm.response.headers.has("X-Access-Token")) {
  const rotated = pm.response.headers.get("X-Access-Token");
  pm.environment.set("user_token", rotated);
  // Keep the collection's legacy variable in sync too, if present:
  pm.environment.set("token", rotated);
}
```

### Example protected-endpoint test (`update-phones`)

```js
pm.test("Status is 200 OK", () => {
  pm.response.to.have.status(200);
});

pm.test("Phones array is returned", () => {
  const j = pm.response.json();
  pm.expect(j.success).to.eql(true);
  pm.expect(j.message).to.eql("User phones updated successfully");
  pm.expect(j.phones).to.be.an("array");
});
```

---

## 9. Rate limits

Applied before the controller runs; exceeded → `429 TOO_MANY_REQUESTS`.

| Limiter                       | Applies to                  | Key        | Window | Limit | Counts      |
| ----------------------------- | --------------------------- | ---------- | ------ | ----- | ----------- |
| `loginIpLimiter`              | `POST /auth/login`          | IP         | 15 min | 30    | failed only |
| `loginAccountLimiter`         | `POST /auth/login`          | IP + email | 15 min | 5     | failed only |
| `resetPasswordIpLimiter`      | `POST /auth/reset-password` | IP         | 1 hour | 10    | all         |
| `resetPasswordAccountLimiter` | `POST /auth/reset-password` | IP + email | 1 hour | 3     | all         |

- Login limiters use `skipSuccessfulRequests: true`, so successful logins never
  count against the limit.
- Responses send `Retry-After` / `RateLimit-*` headers.
- The API trusts `X-Forwarded-For` only when `TRUST_PROXY_HOPS > 0`; locally
  (no proxy) the socket IP is used.

---

## 10. Error responses (exact shapes)

Middleware and controller responses use two different shapes:

- **Auth/token middleware & login controller** →
  `{ "success": false, "message": "...", "error": "CODE" }`
- **Boom errors (API key, validation)** → `{ "statusCode": 401, "error": "Unauthorized", "message": "Invalid API key" }`

| Status | `error` code              | `message`                                                          | Trigger                                           |
| ------ | ------------------------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| 401    | `Unauthorized` (Boom)     | `Invalid API key`                                                  | `apikey` header missing or wrong                  |
| 401    | `INVALID_CREDENTIALS`     | `Invalid credentials try again.`                                   | Wrong email/password OR user not found            |
| 403    | `USER_INACTIVE`           | `This account is inactive. Contact an administrator.`              | Valid password, status ≠ Active                   |
| 401    | `AUTHENTICATION_REQUIRED` | `Authentication required. Please sign in to access this resource.` | No `Authorization` header                         |
| 401    | `INVALID_TOKEN`           | `Invalid authentication credentials. Please sign in again.`        | Bad scheme / malformed / bad signature            |
| 401    | `TOKEN_EXPIRED`           | `Your session has expired. Please sign in again.`                  | JWT older than 2 minutes                          |
| 429    | `TOO_MANY_REQUESTS`       | `Too many login attempts. Please try again later.`                 | Login rate limit hit                              |
| 429    | `TOO_MANY_REQUESTS`       | `Too many password reset attempts. Please try again later.`        | Reset rate limit hit                              |
| 400    | `Bad Request` (Boom)      | `No user identifier provided` / `No phones provided`               | Missing body fields on `/users/*`                 |
| 404    | `Not Found` (Boom)        | `No user was found matching the provided data.`                    | reset-password identity mismatch                  |
| 404    | `Not Found` (Boom)        | `... not possible to find the user ...`                            | list-one / find-by-email / delete on missing user |
| 409    | `Conflict`                | `SequelizeUniqueConstraintError` + `errors`                        | Duplicate email                                   |
| 500    | —                         | `It is not possible to create/update ...`                          | FK violation (bad `role`/`status` id) or DB error |

---

## 11. Troubleshooting

| Symptom                                                            | Likely cause                                             | Fix                                                                                                                                                   |
| ------------------------------------------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `401` `The request is unauthenticated` / `AUTHENTICATION_REQUIRED` | `user_token` is empty — no token yet                     | Run **login** ([Step 3](#step-3--log-in-as-the-new-user)) or the bootstrap ([Step 1](#step-1--generate-a-bootstrap-token)); store it in `user_token`. |
| `401` `Invalid credentials try again.` (`INVALID_CREDENTIALS`)     | No such user, or wrong password                          | Create the user first ([Step 2](#step-2--create-the-first-user)); check email/password. Remember the DB starts **empty**.                             |
| `401` `Invalid API key`                                            | `apikey` header missing or ≠ `.env` `API_KEY`            | Set `api_key` to the 64-char value from `.env`; confirm the environment is selected.                                                                  |
| `403` `This account is inactive.` (`USER_INACTIVE`)                | User's `status` ≠ 13 (Active)                            | Update the user with `"status": 13`, or recreate with `status: 13`.                                                                                   |
| `401` `Your session has expired.` (`TOKEN_EXPIRED`)                | JWT older than 2 minutes                                 | Re-run **login**; or add the collection-level rotation script (§8).                                                                                   |
| `401` `Invalid authentication credentials.` (`INVALID_TOKEN`)      | Malformed token / wrong secret                           | Re-run **login** to get a fresh token.                                                                                                                |
| `500` FK error on create/update                                    | `role`/`status` id is `1/2/3` instead of `10-12 / 13-16` | Use `role: 10`, `status: 13` (see [section 5](#5-reference-data-role--status-ids)).                                                                   |
| `409 Conflict`                                                     | Duplicate email                                          | Use a different email, or delete the existing user.                                                                                                   |
| `429` `Too many login attempts.`                                   | Hit the login limiter (5 failed / IP+email / 15 min)     | Wait 15 minutes, or restart the API (in-memory store resets).                                                                                         |
| `400` `No user identifier provided`                                | Missing `userId` in body                                 | Add `userId` as a **number**, not a string.                                                                                                           |
| `404 Not Found` on `/users/...`                                    | Server down or wrong host/port                           | Start `npm run dev`; check `api_address`.                                                                                                             |
| Variables show as literal `{{api_address}}`                        | Environment not selected                                 | Pick your environment in the top-right dropdown.                                                                                                      |
| `ECONNREFUSED`                                                     | API not started                                          | Run `npm run dev`.                                                                                                                                    |

**Golden debugging order:** 1) server running? 2) environment selected? 3) is `apikey` filled and `Authorization` carrying a non-empty `user_token`? 4) if still stuck, **re-run login**.

---

## 12. Quick reference card

```
Environment : hotel-booking-api
api_address : http://192.168.0.20:7799/api/v1
api_key     : 2e9bc6c94a4cbdfe2a31d2df79103a5eb3702eaf5d7018d47a774e9540a8ec29
user_token  : (filled by auth/login, or by `node generate-token.mjs` for bootstrap)

DB reference:
  roles    → 10 Administrator | 11 Staff | 12 Guest
  statuses → 13 Active | 14 Inactive | 15 Suspended | 16 Deleted
  (must use status 13 to be able to log in)

Correct order (first run):
  1. node generate-token.mjs   → set user_token
  2. POST /users/create        → role:10, status:13   (201)
  3. POST /auth/login          → copy `authentication`  (200)
  4. set user_token = authentication
  5. GET  /users/list-all      → 200

Headers:
  Public endpoints    : Content-Type | apikey
  Protected /users/*  : Content-Type | apikey | Authorization: Bearer {{user_token}}

Endpoints:
  POST   /auth/login            (public)
  POST   /auth/reset-password   (public)
  POST   /users/create          (protected)
  POST   /users/list-one        (protected)
  POST   /users/find-by-email   (protected)
  GET    /users/list-all        (protected)
  PUT    /users/update          (protected)
  PUT    /users/update-phones   (protected)
  POST   /users/update-last-login (protected)
  DELETE /users/delete          (protected)
```
