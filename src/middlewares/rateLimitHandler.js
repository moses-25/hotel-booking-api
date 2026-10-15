<<<<<<< HEAD
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
=======
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
>>>>>>> upstream/main

// 429 in the same shape the auth middleware uses, so the frontend can
// branch on `error` like it does for INVALID_TOKEN / TOKEN_EXPIRED,
const tooManyRequests = (message) => (req, res) =>
  res.status(429).json({
    success: false,
    message,
<<<<<<< HEAD
    error: "TOO_MANY_REQUESTS",
  });

const normalize = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const baseOptions = {
  standardHeaders: "draft-7", // RateLimit-* headers (+ Retry-After on 429)
  legacyHeaders: false, // no X-RateLimit-* headers
=======
    error: 'TOO_MANY_REQUESTS',
  });

const normalize = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const baseOptions = {
  standardHeaders: 'draft-7', // RateLimit-* headers (+ Retry-After on 429)
  legacyHeaders: false,       // no X-RateLimit-* headers
>>>>>>> upstream/main
};

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

// ------------------------------- Login ---------------------------------------

// Broad limit per IP: stops one client from trying many emails.
// skipSuccessfulRequests: only failed attempts (401/403) count.
export const loginIpLimiter = rateLimit({
  ...baseOptions,
  windowMs: FIFTEEN_MINUTES,
  limit: 30,
  skipSuccessfulRequests: true,
<<<<<<< HEAD
  handler: tooManyRequests("Too many login attempts. Please try again later."),
=======
  handler: tooManyRequests('Too many login attempts. Please try again later.'),
>>>>>>> upstream/main
});

// Strict limit per IP + email: stop password guessing on one account.
// Keyed on IP too, as an attacker cannot lock a victim out from everywhere.
export const loginAccountLimiter = rateLimit({
  ...baseOptions,
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}|${normalize(req.body?.email)}`,
<<<<<<< HEAD
  handler: tooManyRequests("Too many login attempts. Please try again later."),
=======
  handler: tooManyRequests('Too many login attempts. Please try again later.'),
>>>>>>> upstream/main
});

// --------------------------- Reset password ----------------------------------

// Identify here is email + firstname + firstLastname. So this endpoint is the
// easier one to bruce-force. Every request counts, successful or not.

export const resetPasswordIpLimiter = rateLimit({
  ...baseOptions,
  windowMs: ONE_HOUR,
  limit: 10,
<<<<<<< HEAD
  handler: tooManyRequests(
    "Too many password reset attempts. Please try again later.",
  ),
=======
  handler: tooManyRequests('Too many password reset attempts. Please try again later.'),
>>>>>>> upstream/main
});

export const resetPasswordAccountLimiter = rateLimit({
  ...baseOptions,
  windowMs: ONE_HOUR,
  limit: 3,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}|${normalize(req.body?.email)}`,
<<<<<<< HEAD
  handler: tooManyRequests(
    "Too many password reset attempts. Please try again later.",
  ),
=======
  handler: tooManyRequests('Too many password reset attempts. Please try again later.'),
>>>>>>> upstream/main
});
