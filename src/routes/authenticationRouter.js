import { Router } from "express";

// ----------------------------- Middlewares -----------------------------------

// Middleware that verifies the API key sent by the client app
<<<<<<< HEAD
import { checkAPIkey } from "../middlewares/apiAuthHandler.js";
=======
import { checkAPIkey } from '../middlewares/apiAuthHandler.js';
>>>>>>> upstream/main
// Middleware that count the /login and /reset-password attempts quantity
import {
  loginIpLimiter,
  loginAccountLimiter,
  resetPasswordIpLimiter,
<<<<<<< HEAD
  resetPasswordAccountLimiter,
} from "../middlewares/rateLimitHandler.js";
=======
  resetPasswordAccountLimiter
} from '../middlewares/rateLimitHandler.js';
>>>>>>> upstream/main

// -------------------------- Validator Schema ---------------------------------

// ----------------------------- Controllers -----------------------------------
<<<<<<< HEAD
import { login, resetPassword } from "../controllers/authentication/index.js";
=======
import {
  login,
  resetPassword
} from '../controllers/authentication/index.js';
>>>>>>> upstream/main

// Create a new Router instance dedicated to the authentication resource
const authenticationRouter = Router();

// -----------------------------------------------------------------------------
// POST /login → Authenticate a user and start a session
// Body: User credentials: email, password
// -----------------------------------------------------------------------------
authenticationRouter.post(
<<<<<<< HEAD
  "/login",
=======
  '/login',
>>>>>>> upstream/main
  // Step 1: Verify the API key
  checkAPIkey,
  // Step 2: Supervise the attempts quantity
  loginIpLimiter,
  loginAccountLimiter,
  // Step 3: Delegate to the controller
<<<<<<< HEAD
  login,
=======
  login
>>>>>>> upstream/main
);

// -----------------------------------------------------------------------------
// POST /reset-password → Reset a user's password without an active session
// Body: User credentials: email, firstName, firstLastName, and the new password
// -----------------------------------------------------------------------------
authenticationRouter.post(
<<<<<<< HEAD
  "/reset-password",
=======
  '/reset-password',
>>>>>>> upstream/main
  // Step 1: Verify the API key
  checkAPIkey,
  // Step 2: Supervise the attempts quantity
  resetPasswordIpLimiter,
  resetPasswordAccountLimiter,
  // Step 3: Delegate to the controller
<<<<<<< HEAD
  resetPassword,
=======
  resetPassword
>>>>>>> upstream/main
);

export default authenticationRouter;
