# Postman Testing Guide — Hotel Booking API (Beginner Edition)

> Written for someone **completely new to Postman**. We start from zero: what Postman
> is, how to install it, every button you need, and then walk through testing all 8
> endpoints of the User API one by one.

---

## Table of contents

1. [What is Postman?](#1-what-is-postman)
2. [Install & open](#2-install--open)
3. [The 10 words you must know](#3-the-10-words-you-must-know)
4. [Import our collection](#4-import-our-collection)
5. [Create an environment & variables](#5-create-an-environment--variables)
6. [Get a token via login](#6-get-a-token-via-login)
7. [Send your first request](#7-send-your-first-request)
8. [The 8 endpoints, one by one](#8-the-8-endpoints-one-by-one)
9. [Reading responses like a pro](#9-reading-responses-like-a-pro)
10. [Test scripts explained](#10-test-scripts-explained)
11. [Run everything with Collection Runner](#11-run-everything-with-collection-runner)
12. [Troubleshooting](#12-troubleshooting)
13. [Good habits & next steps](#13-good-habits--next-steps)

---

## 1. What is Postman?

Postman is a desktop (or web) app for calling HTTP APIs **without writing code**.
Instead of typing `curl` commands, you click buttons, fill in fields, and hit
**Send**. It shows you the response in a pretty, readable format and lets you write
tiny test scripts to check that the API behaves correctly.

We will use it to test an **Auth + User API** built with Express.js + PostgreSQL:

```
POST   /api/v1/auth/login             → authenticate, get a JWT   (public)
POST   /api/v1/users/create           → create a user
PUT    /api/v1/users/update           → update a user
PUT    /api/v1/users/update-phones    → replace a user's phones
POST   /api/v1/users/update-last-login→ stamp the last login time
DELETE /api/v1/users/delete           → delete a user
POST   /api/v1/users/list-one         → get one user by id
POST   /api/v1/users/find-by-email    → get one user by email
GET    /api/v1/users/list-all         → get every user
```

The `auth/login` endpoint is the **only public one** — it's how you get the JWT that
every other endpoint requires.

---

## 2. Install & open

1. Download from https://www.postman.com/downloads/ (free "Lite" plan is plenty).
2. Open it. You can skip signing in for local work, or create a free account to sync.
3. You'll land in a **Workspace**. The default "My Workspace" is fine.

---

## 3. The 10 words you must know

| Term | Plain English |
| --- | --- |
| **Collection** | A folder of saved requests. We'll import one called `hotel-booking-api`. |
| **Request** | One API call: a method + URL + headers + body. |
| **Method** | The HTTP verb (GET, POST, PUT, DELETE). Says *what kind* of action. |
| **URL** | Where the request goes, e.g. `{{api_address}}/users/create`. |
| **Header** | Extra key/value info sent *with* the request (auth, content type). |
| **Body** | The JSON payload you send (the "data"). Only POST/PUT usually need one. |
| **Environment** | A named set of variables you can swap (dev, staging, prod). |
| **Variable** | A placeholder like `{{token}}` whose value lives in the environment. |
| **Response** | What the server sends back (status, body, headers). |
| **Test script** | Small JavaScript that runs after a response to assert things. |

---

## 4. Import our collection

We already prepared the collection for you: **`postman-collection.json`** (in the
project root).

1. In Postman, click **Collections** in the left sidebar.
2. Click the **Import** button (top-left, or the `…` menu → *Import*).
3. Choose **Files** → select `postman-collection.json` → **Open**.
4. You'll see a collection named **hotel-booking-api** with a `users` folder
   containing all 8 requests.

> Every request already has the 3 required headers (`Content-Type`, `apikey`,
> `Authorization`) and a **Tests** script pre-filled. You mostly just need to set
> up variables and hit Send.

---

## 5. Create an environment & variables

Variables let you avoid re-typing the URL and secrets. We'll put them in an
environment.

1. Top-right corner → the environment dropdown → **+ Create Environment**.
2. Name it `hotel-booking-api`.
3. Add these rows (click **Add** for each):

| Variable | Type | Initial value | Current value |
| --- | --- | --- | --- |
| `api_address` | default | `http://192.168.0.20:7799/api/v1` | same |
| `api_key` | default | `2e9bc6c94a4cbdfe2a31d2df79103a5eb3702eaf5d7018d47a774e9540a8ec29` | same |
| `token` | default | *(leave empty for now)* | *(same)* |

4. **Save** (Ctrl/Cmd + S).
5. Make sure this environment is **selected** in the top-right dropdown. If it
   isn't, the `{{...}}` placeholders won't resolve.

What these mean:
- `api_address` — your server's base URL. If your machine's IP changes, update it here.
- `api_key` — the secret the API expects in the `apikey` header.
- `token` — your JWT. We'll fill it next; the collection keeps it fresh after that.

> **Tip:** In any place you type `{{api_address}}`, Postman will show a tooltip with
> the resolved value. If it shows blank, your environment isn't selected.

---

## 6. Get a token via login

Almost every endpoint needs a **JWT**. You get one by calling the public
`POST /auth/login` endpoint with an email + password. The collection's **login**
request does this for you and automatically saves the token.

### The normal flow

1. Expand **hotel-booking-api → auth** and click **login**.
2. In the **Body** tab, set a real user's credentials:

   ```json
   { "email": "steph@mail.com", "password": "pass1234" }
   ```

3. Click **Send**. You should get:

   ```json
   { "success": true, "message": "Login successful.", "authentication": "eyJhbGci..." }
   ```

4. The **Tests** script already copied the `authentication` value into your
   `token` environment variable. Open your environment and you'll see `token`
   is now filled in. Every later request uses it automatically.

> That's it — you won't need to touch `token` again. The collection keeps it
> fresh on every request (see §10).

### The chicken-and-egg problem (first user only)

`/users/create` itself needs a valid token — so how do you create the *first*
user? Two options:

- **Option A (easy):** If you already have a user in the database (from earlier
  testing), just log in as them above.
- **Option B (bootstrap):** Sign a throwaway token by hand so you can call
  `create` once. From the project root:

  ```bash
  node generate-token.mjs
  ```

  Paste the printed `eyJ...` into the `token` variable, call **create**, and from
  then on use **login** for real work.

> After your first real user exists, you can ignore `generate-token.mjs` entirely.

---

## 7. Send your first request

Let's start with the simplest, safest one: **list-all** (you must have run
**login** at least once so `token` is filled in — see §6).

1. In the left sidebar, expand **hotel-booking-api → users**.
2. Click **list-all**, then click **Send** (blue button).
3. Watch the bottom pane fill in. You should get:

```json
{
  "success": true,
  "message": "Users found successfully",
  "total": 0,
  "users": []
}
```

🎉 If you see that, everything is wired correctly (server up, env selected, token valid).

If you got an error, jump to [Troubleshooting](#12-troubleshooting) first.

---

## 8. The user endpoints, one by one

> These are the 8 `/users` endpoints. **login** is already covered in §6 — run it
> first so you have a token. Then start with `create` so the others have data to
> work with.

**What you'll do each time:** click the request in the sidebar → check the Body tab
if it has one → click **Send** → read the response.

---

### 8.1 create — make a new user

- **What it does:** Inserts a user (and optionally their phones).
- **Method/URL:** `POST {{api_address}}/users/create`
- **Body** (already filled in the collection):

```json
{
  "firstName": "Steph",
  "middleName": "Curry",
  "firstLastName": "Curry",
  "secondLastName": "",
  "email": "steph@mail.com",
  "password": "pass1234",
  "role": 1,
  "status": 1,
  "phones": ["4444444444", "5555555555"]
}
```

- **Field meanings:**

| Field | Meaning |
| --- | --- |
| `role` | Numeric FK: `1` Administrator, `2` Staff, `3` Guest |
| `status` | Numeric FK: `1` Active, `2` Inactive, `3` Suspended, `4` Deleted |
| `phones` | Optional array of strings |
| `middleName`, `secondLastName`, `lastLogin` | Optional |

- **Expected:**
  - `201 Created` → `{"success": true, "message": "User created successfully"}`
  - `409 Conflict` → email already exists.
- **After it succeeds:** the user gets an `id`. Grab it in the next request
  (`find-by-email` will show you the id). Put that id into `{{userId}}`-style
  values in the other bodies.

---

### 8.2 find-by-email — confirm the user exists

- **What it does:** Finds a user by email. Great for grabbing the new `id`.
- **Body:**
  ```json
  { "email": "steph@mail.com" }
  ```
- **Expected:** `200 OK` with a `user` object (nested `role`, `status`, `phones`).
  Note there is **no `password` field** — the API strips it.
- **Tip:** Change the email to something wrong → you get `404 Not Found`. That's
  normal and proves the error path works.

---

### 8.3 list-one — fetch by id

- **What it does:** Same as above but by numeric id.
- **Body:**
  ```json
  { "userId": 1 }
  ```
- **Expected:** `200 OK` with the same `user` shape.

---

### 8.4 update — change user fields

- **What it does:** Updates name/email/role/status for a user.
- **Body:**
  ```json
  {
    "userId": 1,
    "firstName": "Michael",
    "middleName": "Junior",
    "firstLastName": "Jackson",
    "secondLastName": "Jackson",
    "email": "jackson@mail.com",
    "role": 2,
    "status": 2
  }
  ```
- **Important:** it does **not** change `password` or `lastLogin`.
- **Expected:** `200 OK` → `"User updated successfully"`. Verify with `list-one`.

---

### 8.5 update-phones — replace the phone list

- **What it does:** **Replaces** all phones for a user (not a merge).
- **Body:**
  ```json
  { "userId": 1, "phones": ["5555555555", "8888888888"] }
  ```
- **Expected:** `200 OK` and the response includes the saved `phones` array.
- **Try:** send `"phones": []` → it clears them.

---

### 8.6 update-last-login — stamp the login time

- **What it does:** Sets `lastLogin` to *now*.
- **Body:** `{ "userId": 1 }`
- **Expected:** `200 OK` → `"Last login updated successfully"`.

---

### 8.7 delete — remove a user

- **What it does:** Deletes the user and their phones.
- **Body:** `{ "userId": 1 }`
- **Expected:** `200 OK` → `"User deleted successfully"`.
- **Verify:** run `list-one` with the same id → you should now get `404`.

---

### 8.8 list-all — list every user

- **What it does:** Returns all users, ordered by id, with a `total` count.
- **Body:** none (GET requests don't need one).
- **Expected:**
  ```json
  { "success": true, "message": "Users found successfully", "total": 2, "users": [ ... ] }
  ```

---

## 9. Reading responses like a pro

After you hit **Send**, the bottom pane has several tabs:

| Tab | What it shows |
| --- | --- |
| **Body** | The server's JSON response (what we've been printing). Use *Pretty* view. |
| **Headers** | Response headers. Look for `X-Access-Token` — a fresh JWT each time. |
| **Test Results** | Pass/fail for each `pm.test(...)` in the Tests tab. All should say **PASS** in green. |
| **Timing / Size** | How long the call took, response size. |

Also always glance at the **status code** on the right of the Send button
(e.g. `200 OK`, `201 Created`, `404 Not Found`).

**Important:** the `X-Access-Token` header changes on every single request because
the auth middleware rotates it. That's why the collection has a test script that
automatically saves it back into `{{token}}` — you don't have to do anything.

---

## 10. Test scripts explained

Each request has a **Tests** tab (right side of the request builder). These are tiny
JavaScript snippets that run **after** the response arrives. Ours look like:

```js
pm.test('Status is 200 OK', () => {
  pm.response.to.have.status(200);
});

pm.test('Body says success', () => {
  const j = pm.response.json();
  pm.expect(j.success).to.eql(true);
  pm.expect(j.message).to.eql('User updated successfully');
});
```

- `pm.test(name, fn)` — registers a named check. It appears in the **Test Results** tab.
- `pm.response.to.have.status(200)` — asserts the HTTP status code.
- `pm.response.json()` — parses the response body as JSON.
- `pm.expect(...).to.eql(...)` — a Chai-style assertion (compare values).

At the **collection level** (see the collection's *Tests* tab, not an individual
request) there's this, which runs after **every** request:

```js
if (pm.response.headers.has('X-Access-Token')) {
  pm.environment.set('token', pm.response.headers.get('X-Access-Token'));
}
```

That's what keeps `{{token}}` alive automatically. You can open it to see it, but
you don't need to edit it.

---

## 11. Run everything with Collection Runner

Instead of clicking Send 8 times, let Postman run the whole collection:

1. Click the **…** next to the collection name → **Run collection**.
   (Or open the **Runner** from the left sidebar and drag the collection in.)
2. Keep the default order. Under **Run order**, confirm all requests are included.
3. Click **Run hotel-booking-api**.
4. Watch the live results — each request shows green for passing tests, red for failures.
5. When it finishes you get a summary: how many passed/failed and the total time.

This is the fastest way to regression-test after you change code.

---

## 12. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `401` "Authentication required…" | Missing/blank `token` | Run **auth → login** with valid credentials (§6). |
| `401` "Invalid authentication credentials…" | Token is malformed / wrong secret | Just call **login** again to get a fresh token. |
| `401` "Your session has expired…" (`TOKEN_EXPIRED`) | Token older than its 2-minute window | Just Send any request again — the collection refreshes it. Or re-run **login**. |
| `401` "Invalid credentials try again." (`INVALID_CREDENTIALS`) | Wrong email/password on **login** | Check the email/password against a user you created. |
| `403` "This account is inactive." (`USER_INACTIVE`) | The user's status isn't "Active" | Set that user's `status` to `1` (Active) via **update**. |
| `401` "Invalid API key" | `apikey` header missing or wrong | Confirm `api_key` variable is set and the environment is selected. |
| `404 Not Found` on a URL like `/users/list-all` | Server not running, or wrong host/port | Check the terminal running the API; confirm `api_address` = `http://192.168.0.20:7799/api/v1`. |
| `409 Conflict` | Duplicate email (or a validation error) | Use a different email in `create`, or check the `errors` array in the response. |
| `400 Bad Request` | Body missing `userId` / `email`, or wrong type | Make sure the body is valid JSON and ids are **numbers**, not `"strings"`. |
| Variables show literally as `{{api_address}}` | Environment not selected | Pick `hotel-booking-api` in the top-right dropdown. |
| `ECONNREFUSED` / can't connect | API not started | Run `npm run dev` in the project. |

**Golden debugging tip:** when something fails, check three things in order —
1) is the server running, 2) is the environment selected, 3) do the Headers show
`apikey` and `Authorization` filled in (not empty).

---

## 13. Good habits & next steps

- **Always use variables**, never hardcode URLs/secrets in requests.
- **Write a test for every happy path** so the Runner catches regressions.
- **Also test the unhappy paths** (wrong id, duplicate email, empty body) — that's
  where bugs hide.
- **Commit the collection** (`postman-collection.json`) so teammates import the
  same thing.
- The collection already **chains login → get token → call protected endpoints**. When
  you add more auth endpoints (register, refresh, password reset), give them their own
  requests in the `auth` folder and let their test scripts update `{{token}}` the same way.

---

### Quick reference card

```
Environment : hotel-booking-api
api_address : http://192.168.0.20:7799/api/v1
api_key     : 2e9bc6c94a4cbdfe2a31d2df79103a5eb3702eaf5d7018d47a774e9540a8ec29
token       : (auto-filled by the login request's test script)

New here? Run auth → login first, then the /users requests.

Headers on every request:
  Content-Type  : application/json
  apikey        : {{api_key}}
  Authorization : Bearer {{token}}
```
