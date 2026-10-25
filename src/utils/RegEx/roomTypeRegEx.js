// ─────────────────────────────────────────────────────────────────────────────
// ROOM TYPE REGEX — Entity: RoomType | Table: room_type
// ─────────────────────────────────────────────────────────────────────────────
//
// These patterns describe string inputs for room-type fields and reflect the
// model/migration constraints where a regular expression is appropriate.
// They can be combined with Joi in a request schema; they do not validate
// database uniqueness, JSONB structure, or numeric types by themselves.
//
// Column → model → validation:
//   id                INTEGER PK                  → roomTypeId
//   name              VARCHAR(50) NOT NULL UNIQUE → roomTypeName
//   description       TEXT NOT NULL               → roomTypeDescription
//   price_per_night   DECIMAL(10,2), 10–10000     → roomTypePricePerNight
//   max_occupancy     SMALLINT, 1–10               → roomTypeMaxOccupancy
//   amenities         JSONB NOT NULL              → validate as an array in Joi;
//                                                   roomTypeAmenity checks one item
// ─────────────────────────────────────────────────────────────────────────────

// IDs arrive as digit strings in request payloads; the database uses integers.
export const roomTypeId = /^\d{1,10}$/;

// Room-type names allow Unicode letters/numbers and single spaces, apostrophes,
// or hyphens between words. The length matches VARCHAR(50).
export const roomTypeName =
  /^(?=.{1,50}$)[\p{L}\p{N}]+(?:[ '-][\p{L}\p{N}]+)*$/u;

// TEXT has no database length limit. Require non-whitespace content while
// allowing normal prose, punctuation, and line breaks.
export const roomTypeDescription = /^(?=.*\S)[\s\S]*$/;

// Price is supplied as a decimal string. Allow up to two fractional digits
// and enforce the migration's inclusive 10–10000 range.
export const roomTypePricePerNight =
  /^(?:10(?:\.\d{1,2})?|(?:1[1-9]|[2-9]\d|[1-9]\d{2,3})(?:\.\d{1,2})?|10000(?:\.0{1,2})?)$/;

// Occupancy is stored as SMALLINT and constrained by the migration to 1–10.
export const roomTypeMaxOccupancy = /^(?:[1-9]|10)$/;

// The seeded amenities are lowercase identifier strings in a JSONB array.
// Apply this to each array item; validate the array itself with Joi.
export const roomTypeAmenity = /^[a-z][a-z0-9_]{0,49}$/;
