# RoomType — Work Summary

> A complete record of the `room_type` module: every file added or touched,
> the reasoning behind each layer, and the rules the team should follow when
> extending it (or copying the pattern to the next entity).

---

## 1. Overview

`room_type` is a reference/catalog entity used by `room` (each physical room
points to exactly one room type). It exposes **five operations** over **two
transport surfaces**:

| Operation | REST                          | GraphQL                         |
| --------- | ----------------------------- | ------------------------------- |
| Create    | `POST   /room-types/create`   | `newRoomType(dto: …)`           |
| Read one  | `POST   /room-types/list-one` | `roomType(dto: …)`              |
| Read all  | `GET    /room-types/list-all` | `allRoomTypes`                  |
| Update    | `PUT    /room-types/update`   | `updateRoomType(id: …, dto: …)` |
| Delete    | `DELETE /room-types/delete`   | `deleteRoomType(dto: …)`        |

**Access:** Administrator only — for all routes, all queries, all mutations.

**Source of truth:** `RoomTypeService` — REST controllers and GraphQL
resolvers are both **thin adapters** on top of it. No layer reaches Sequelize
directly except the service.

---

## 2. File inventory

### 2.1 Files created (new — no prior version existed)

| File                                        | Purpose                                                                                                                                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/RegEx/roomTypeRegEx.js`          | One regex per validated column: `roomTypeId`, `roomTypeName`, `roomTypeDescription`, `roomTypePrice_per_night`, `roomTypeMax_Occupancy`, `roomTypeAmenity`. Mirrors DB constraints. |
| `src/schema/roomTypeSchema.js`              | Joi primitives + three schemas: `getRoomTypeById`, `newRoomTypeData`, `updateRoomTypeData`. Used by REST **and** GraphQL.                                                           |
| `src/services/roomTypeServices.js`          | `RoomTypeService` class — `createOne`, `listOne`, `listAll`, `updateOne`, `deleteOne`, plus a static `_formatRoomType` that fixes the Sequelize DECIMAL→string quirk.               |
| `src/controllers/roomType/createOne.js`     | HTTP 201 with `{ success, message, roomType, authentication }`.                                                                                                                     |
| `src/controllers/roomType/updateOne.js`     | Partial update by `roomTypeId`, returns updated record + rotated token.                                                                                                             |
| `src/controllers/roomType/listOne.js`       | Fetch one by `roomTypeId`, returns formatted record + rotated token.                                                                                                                |
| `src/controllers/roomType/listAll.js`       | Returns `{ total, roomTypes[], authentication }`.                                                                                                                                   |
| `src/controllers/roomType/deleteOne.js`     | Returns `{ success, message, authentication }`; no record echo.                                                                                                                     |
| `src/controllers/roomType/index.js`         | Barrel re-export so routers import from one path.                                                                                                                                   |
| `src/routes/roomTypeRouter.js`              | Mounts the five REST endpoints, each guarded by `checkAPIkey → authAppVerifyToken → checkRole(['Administrator']) → validatorHandler`.                                               |
| `src/graphql/resolvers/roomTypeResolver.js` | Administrator-only queries and mutations. Reuses `RoomTypeService` + Joi schemas. Maps Boom → GraphQLError via `toGraphQLError`.                                                    |

### 2.2 Files updated (existed before, changed for this work)

| File                                  | Change                                                                                                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/index.js`                 | Added one line: `router.use('/room-types', roomTypeRouter)`. Nothing removed.                                                                                                                                             |
| `src/routes/userRouter.js`            | Removed a misplaced import/route that incorrectly pointed at room-type controllers from the user router.                                                                                                                  |
| `src/middlewares/validatorHandler.js` | Fixed the flow so an invalid payload is forwarded via `next(Boom.badRequest(error))` and **does not** continue to the controller.                                                                                         |
| `src/graphql/schema.graphql`          | Added RoomType output/input types, the `roomType` and `allRoomTypes` queries, and `newRoomType` / `updateRoomType` / `deleteRoomType` mutations. Also fixed pre-existing SDL syntax errors that prevented schema parsing. |
| `src/graphql/resolvers/index.js`      | Added `roomTypeResolver` to `mergeResolvers([…])`.                                                                                                                                                                        |

### 2.3 Pre-existing files used (unchanged — listed for completeness)

- `src/db/models/roomType.js` — Sequelize model.
- `src/utils/RegEx/roomTypeRegEx.js` — see note below.

> **Note:** The original RegEx and service files arrived before the doc was
> written and were reviewed/patched in place. They're listed above as
> _created_ because their first working version ships with this module.

---

## 3. Approach, layer by layer

The module follows the **same pattern as the user domain** — build bottom-up,
never let a caller exist before its callee.

### 3.1 RegEx (`src/utils/RegEx/roomTypeRegEx.js`)

- **One export per validated column** — no mega-regex.
- **Mirrors the DB contract** so a bad value dies in `validatorHandler`
  before Sequelize or Postgres ever see it.
- **Numeric ranges are not regex-enforced** — `price_per_night`
  (10–10000) and `max_occupancy` (1–10) use `Joi.number().min()/.max()`
  instead, because a regex can check _shape_ but not _range_ cleanly.

### 3.2 Joi schema (`src/schema/roomTypeSchema.js`)

- **Shared** by REST (`validatorHandler`) and GraphQL (`validate` helper in
  `graphql/helpers.js`). One definition, two transports.
- **Three schemas**:
  - `getRoomTypeById` → `{ roomTypeId: required }` (used by list-one and delete).
  - `newRoomTypeData` → `roomTypeId` **absent** (DB auto-assigns); all other fields required.
  - `updateRoomTypeData` → `roomTypeId` **required**, all other fields optional (partial update).
- **Field names are camelCase** (`pricePerNight`, `maxOccupancy`, `amenities`) —
  the same convention as the model. Snake_case never crosses the service boundary.

### 3.3 Service (`src/services/roomTypeServices.js`)

The **only** file that talks to Sequelize. Two non-obvious decisions:

1. **`_formatRoomType(roomType)` static helper.** Sequelize returns
   `DECIMAL` columns as **strings** (`"180.00"`) to preserve precision. The
   helper converts `pricePerNight` to `Number(...)` so every API response
   carries `180`, not `"180.00"`. This is the only behavior that diverges
   from `userServices.js`.
2. **`SequelizeForeignKeyConstraintError → Boom.conflict`** in `deleteOne`.
   A `room` referencing this type triggers the DB's `onDelete: 'RESTRICT'`.
   Without this mapping the client would get an opaque 500; with it they get
   a **409 Conflict** with a human-readable message.

All other calls follow the user-domain pattern:

- Guard `!id` → `Boom.badRequest`.
- `SequelizeUniqueConstraintError` → `Boom.conflict('… already exists')`.
- `Boom.isBoom(err) → rethrow` so Boom errors aren't double-wrapped.
- Return `{ status: '…', … }` — controllers branch on the string.

### 3.4 Controllers (`src/controllers/roomType/*.js`)

- **One file per action** — matches `controllers/user/`.
- Each controller follows the same **6-step recipe**:
  1. Read `req.body` fields (camelCase).
  2. Guard missing `roomTypeId` (throws `Boom.badRequest` **outside** the try).
  3. `new RoomTypeService()`.
  4. `try { service → check response.status → res.json({...}) }`.
  5. `catch { next(Boom.boomify(err, { message: '…' })) }`.
  6. Echo `res.locals.newUserToken` as `authentication` — the middleware
     rotated the JWT upstream, so every response hands the client the fresh
     one.
- **HTTP codes:** `201` on create, `200` everywhere else.
- **No DB logic, no validation** — pure translation between HTTP and service.

### 3.5 REST router (`src/routes/roomTypeRouter.js`)

Every route is a 5-step middleware pipeline, identical to `userRouter.js`:

```
checkAPIkey → authAppVerifyToken → checkRole(['Administrator'])
           → validatorHandler(roomTypeSchema.X, 'body')
           → controller
```

Guardrails:

- **API key** first → reject anonymous callers immediately.
- **JWT** second → rotates the token, so every response carries a fresh one.
- **Role** third → Administrator-only for every endpoint.
- **Joi** fourth → shape/format enforced **before** the controller.

### 3.6 Mount (`src/routes/index.js`)

Single line addition:

```js
router.use("/room-types", roomTypeRouter);
```

### 3.7 GraphQL resolver (`src/graphql/resolvers/roomTypeResolver.js`)

- **Mirrors the REST authorization** exactly: `requireRole(context, ['Administrator'])` on every field.
- **Reuses** `RoomTypeService` and the Joi schemas — no logic duplication.
- **Errors**: `toGraphQLError(err)` normalizes Boom → `GraphQLError` with a
  stable `extensions.code` (`NOT_FOUND`, `CONFLICT`, `BAD_USER_INPUT`, …),
  so the frontend can branch on the same codes across both transports.
- **Registered** via `mergeResolvers([authResolver, userResolver, roomTypeResolver])`.

### 3.8 GraphQL schema (`src/graphql/schema.graphql`)

Types added:

- Output: `RoomType { id, name, description, pricePerNight, maxOccupancy, amenities, createdAt, updatedAt }`.
- Inputs: `RoomTypeIdDto`, `CreateRoomTypeDto`, `UpdateRoomTypeDto`.
- Queries: `roomType(dto)`, `allRoomTypes`.
- Mutations: `newRoomType(dto)`, `updateRoomType(id, dto)`, `deleteRoomType(dto)`.

Also **fixed pre-existing SDL parse errors** (missing closing quotes,
duplicate `input` blocks) that had been silently blocking the whole schema
from loading.

### 3.9 Validation helper fix (`src/middlewares/validatorHandler.js`)

The previous version had a subtle bug: on validation failure it called
`next(Boom.badRequest(error))` but **did not `return`** — so the controller
still ran with invalid input. Now it returns the error and execution stops.
This affects every resource, not just room types, and is a team-wide win.

---

## 4. Data flow

```
REST request
  POST /api/v1/room-types/create
    │
    ├─ checkAPIkey                 → validates `apikey` header
    ├─ authAppVerifyToken          → verifies JWT, rotates → res.locals.newUserToken
    ├─ checkRole(['Administrator'])→ role gate
    ├─ validatorHandler(schema)    → Joi: reject before controller
    └─ createOneRoomType
         └─ RoomTypeService.createOne(payload)
              └─ RoomType.create(...)
                   └─ Postgres  `room_type` table

GraphQL request
  mutation { newRoomType(dto: {...}) { id name } }
    │
    ├─ buildContext                → verifies JWT, rotates → X-Access-Token header
    ├─ requireRole(['Administrator'])
    ├─ validate(Joi, dto)          → same schema as REST
    └─ roomTypeResolver.newRoomType
         └─ RoomTypeService.createOne(payload)
              └─ RoomType.create(...)
```

**Invariant:** controllers and resolvers **never** touch `RoomType` directly.
Only `RoomTypeService` does.

---

## 5. Key decisions and why

| Decision                                                                      | Why                                                                                                                                                                          |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`roomTypeId` absent from the create schema**                                | The DB auto-increments. Requiring it would force clients to invent an id and collide on real rows.                                                                           |
| **`updateRoomTypeData` requires the id but makes every other field optional** | Partial updates become natural — the service whitelists which fields it accepts (`name`, `description`, `pricePerNight`, `maxOccupancy`, `amenities`) and skips `undefined`. |
| **`amenities` is a `Joi.array().items(joiAmenity)`, not a string**            | The column is `JSONB`. Sending a single string would store a JSON string, not a JSON array.                                                                                  |
| **Numeric fields use `Joi.number()`**                                         | `Joi.string().pattern()` cannot validate numeric range (10–10000 / 1–10). Range checks belong in Joi, not regex.                                                             |
| **`_formatRoomType` converts DECIMAL → `Number`**                             | Sequelize serializes `DECIMAL(10,2)` as a string on purpose (precision). The API contract wants a number.                                                                    |
| **FK delete → 409 Conflict**                                                  | `room.type → room_type.id` is `onDelete: 'RESTRICT'`. A raw Sequelize FK error is a 500; wrapping it as `Boom.conflict` gives the client an actionable message.              |
| **Rotated JWT echoed as `authentication` in every REST response**             | Consistent with the existing user domain — clients read the fresh token on every call instead of tracking rotation separately.                                               |
| **Administrator-only on every route / field**                                 | Matches the problem statement: room types are system-level catalog data; Staff view `room` rows, not the catalog definitions.                                                |
| **GraphQL reuses REST's Joi schemas and `RoomTypeService`**                   | One rule set, one persistence path. If a validation rule changes, both transports change together — no drift.                                                                |

---

## 6. How to test (quick reference)

All requests need:

```
Content-Type: application/json
apikey:       {{api_key}}
Authorization: Bearer {{token}}
```

### 6.1 REST

```http
### Create
POST /api/v1/room-types/create
{
  "name": "Deluxe Suite",
  "description": "Premium room with city view.",
  "pricePerNight": 180.00,
  "maxOccupancy": 2,
  "amenities": ["wifi", "tv", "ac", "city_view"]
}
→ 201 { success, message, roomType: { id, pricePerNight: 180, ... }, authentication }

### List one
POST /api/v1/room-types/list-one
{ "roomTypeId": 1 }

### List all
GET /api/v1/room-types/list-all
→ 200 { success, total, roomTypes: [...], authentication }

### Update (partial)
PUT /api/v1/room-types/update
{ "roomTypeId": 1, "pricePerNight": 195.50 }

### Delete
DELETE /api/v1/room-types/delete
{ "roomTypeId": 1 }
→ 409 if a `room` row still references it
```

### 6.2 GraphQL

```graphql
mutation {
  newRoomType(
    dto: {
      name: "Family Suite"
      description: "Large room for families."
      pricePerNight: 220
      maxOccupancy: 6
      amenities: ["wifi", "tv", "kids_area"]
    }
  ) {
    id
    name
    pricePerNight
  }
}

query {
  allRoomTypes {
    id
    name
    pricePerNight
    maxOccupancy
  }
}
```

Expected GraphQL error codes: `BAD_USER_INPUT`, `FORBIDDEN`,
`NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR`.

---

## 7. Reuse rules — for the next entity

The next domains (`room`, `booking`, `payment`, `conversation`) should copy
this **exact layering**. Practical checklist:

1. **RegEx file first** — one export per constrained column.
2. **Joi schema second** — primitive types + `getById` / `newData` /
   `updateData`. Reused by REST and GraphQL.
3. **Service third** — the only DB boundary. Add `_formatX` if any column
   is `DECIMAL`, `JSONB` needing reshaping, or has FK children to embed.
   Map `SequelizeUniqueConstraintError → Boom.conflict` and
   `SequelizeForeignKeyConstraintError → Boom.conflict`.
4. **Controllers fourth** — 6-step recipe. **Echo `res.locals.newUserToken`**.
5. **Router fifth** — 5-step pipeline. State access matrix explicitly.
6. **Mount last** — one line in `src/routes/index.js`.
7. **GraphQL mirror sixth** (optional but recommended) — `requireRole`,
   `validate`, `toGraphQLError`. No logic duplication.
8. **Update this doc** — one section per entity, referencing this one's
   structure.

**Do not:**

- Import `RoomTypeService` from a `user/*` controller or vice versa.
- Add entity-specific logic to `validatorHandler`, `errorHandler`, or any
  shared middleware.
- Bypass `RoomTypeService` from a controller or resolver.
- Store camelCase ↔ snake_case conversions in controllers — keep them in
  the schema and model only.

---

## 8. Changelog

| Date | Author | Change                                                                                                                  |
| ---- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| —    | —      | Initial `room_type` module: RegEx, Joi schema, service, five REST controllers, router mount, GraphQL schema + resolver. |
| —    | —      | Fixed `validatorHandler` to stop execution on validation failure.                                                       |
| —    | —      | Removed misplaced room-type import from `userRouter.js`.                                                                |
| —    | —      | Fixed pre-existing SDL syntax errors in `schema.graphql`.                                                               |

---

## 9. Quick navigation

| Concern                     | Where to look                                                          |
| --------------------------- | ---------------------------------------------------------------------- |
| Column regexes              | `src/utils/RegEx/roomTypeRegEx.js`                                     |
| Validation rules            | `src/schema/roomTypeSchema.js`                                         |
| Business logic + DB access  | `src/services/roomTypeServices.js`                                     |
| HTTP handlers               | `src/controllers/roomType/*.js`                                        |
| REST routes + access matrix | `src/routes/roomTypeRouter.js`                                         |
| GraphQL types/inputs        | `src/graphql/schema.graphql` (search `RoomType`)                       |
| GraphQL handlers            | `src/graphql/resolvers/roomTypeResolver.js`                            |
| Shared error mapping        | `src/graphql/helpers.js` (`toGraphQLError`, `validate`, `requireRole`) |
