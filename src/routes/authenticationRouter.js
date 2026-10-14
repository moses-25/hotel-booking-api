import { Router } from "express";

// ----------------------------- Middlewares -----------------------------------

// Middleware that verifies the API key sent by the client app
import { checkAPIkey } from "../middlewares/apiAuthHandler.js";
// Middleware that verifies the user JWT
import { authAppVerifyToken } from "../middlewares/tokenHandlers/authAppTokenHandler.js";

// -------------------------- Validator Schema ---------------------------------

// ----------------------------- Controllers -----------------------------------
import { login } from "../controllers/authentication/index.js";

// Create a new Router instance dedicated to the authentication resource
const authenticationRouter = Router();

// -----------------------------------------------------------------------------
// POST /login → Authenticate a user and start a session
// Body: User credentials: email, password
// -----------------------------------------------------------------------------
authenticationRouter.post(
  "/login",
  // Step 1: Verify the API key
  checkAPIkey,
  // Step 2: Delegate to the controller
  login,
);

export default authenticationRouter;
