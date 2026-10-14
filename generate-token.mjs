// Bootstrap helper: signs a JWT so you can make your FIRST Postman request.
//
// Usage:
//   node generate-token.mjs
//
// It reads the same secret the API uses (from .env) and prints a token you can
// paste into the Postman environment variable `token`. After that first request,
// the collection's test script keeps the token fresh automatically.

import "dotenv/config";
import jwt from "jsonwebtoken";

const userId = Number(process.env.TEST_USER_ID ?? 1);
const role = Number(process.env.TEST_ROLE ?? 1);

const token = jwt.sign(
  { id: userId, role },
  process.env.AUTH_API_JWT_SECRET_KEY,
  { algorithm: "HS256", expiresIn: "1h" },
);

console.log("\nPaste this into your Postman environment variable 'token':\n");
console.log(token);
console.log("");
