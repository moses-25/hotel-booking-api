import { Router } from "express";

// ----------------------------- Middlewares -----------------------------------

// Middleware that verifies the API key sent by the client app
<<<<<<< HEAD
import { checkAPIkey } from "../middlewares/apiAuthHandler.js";
// Middleware that verifies the user JWT
import { authAppVerifyToken } from "../middlewares/tokenHandlers/authAppTokenHandler.js";
=======
import { checkAPIkey } from '../middlewares/apiAuthHandler.js';
// Middleware that verifies the user JWT
import { authAppVerifyToken} from '../middlewares/tokenHandlers/authAppTokenHandler.js';
>>>>>>> upstream/main

// -------------------------- Validator Schema ---------------------------------

// ----------------------------- Controllers -----------------------------------
import {
  createOneUser,
  updateOneUser,
  updateUserPhones,
  updateLastLoginUser,
  deleteOneUser,
  listOneUser,
  findByEmailUser,
<<<<<<< HEAD
  listAllUsers,
} from "../controllers/user/index.js";
=======
  listAllUsers
} from '../controllers/user/index.js';
>>>>>>> upstream/main

// Create a new Router instance dedicated to the user resource
const userRouter = Router();

// -----------------------------------------------------------------------------
// POST /create → Create a new user
// Body: New user data
// -----------------------------------------------------------------------------
userRouter.post(
<<<<<<< HEAD
  "/create",
  // Step 1: Verify the API key
  checkAPIkey,
  // Step 2: Verify the session token
  //authAppVerifyToken,
  // Step 3: Delegate to the controller
  createOneUser,
=======
  '/create',
  // Step 1: Verify the API key
  checkAPIkey,
  // Step 2: Verify the session token
  authAppVerifyToken,
  // Step 3: Delegate to the controller
  createOneUser
>>>>>>> upstream/main
);

// -----------------------------------------------------------------------------
// PUT /update → Update a user
// Body: User identifier and new user data
// -----------------------------------------------------------------------------
userRouter.put(
<<<<<<< HEAD
  "/update",
=======
  '/update',
>>>>>>> upstream/main
  // Step 1: Verify the API key
  checkAPIkey,
  // Step 2: Verify the session token
  authAppVerifyToken,
  // Step 3: Delegate to the controller
<<<<<<< HEAD
  updateOneUser,
=======
  updateOneUser
>>>>>>> upstream/main
);

// -----------------------------------------------------------------------------
// PUT /update-phones → Update a user's phone numbers
// Body: User identifier and the full list of phone numbers
// -----------------------------------------------------------------------------
userRouter.put(
<<<<<<< HEAD
  "/update-phones",
=======
  '/update-phones',
>>>>>>> upstream/main
  // Step 1: Verify the API key
  checkAPIkey,
  // Step 2: Verify the session token
  authAppVerifyToken,
  // Step 3: Delegate to the controller
<<<<<<< HEAD
  updateUserPhones,
=======
  updateUserPhones
>>>>>>> upstream/main
);

// -----------------------------------------------------------------------------
// POST /update-last-login → Update a user's session last login
// Body: User identifier
// -----------------------------------------------------------------------------
userRouter.post(
<<<<<<< HEAD
  "/update-last-login",
=======
  '/update-last-login',
>>>>>>> upstream/main
  // Step 1: Verify the API key
  checkAPIkey,
  // Step 2: Verify the session token
  authAppVerifyToken,
  // Step 3: Delegate to the controller
<<<<<<< HEAD
  updateLastLoginUser,
=======
  updateLastLoginUser
>>>>>>> upstream/main
);

// -----------------------------------------------------------------------------
// DELETE /delete → Delete a user by their identifier
// Body: User identifier
// -----------------------------------------------------------------------------
userRouter.delete(
<<<<<<< HEAD
  "/delete",
=======
  '/delete',
>>>>>>> upstream/main
  // Step 1: Verify the API key
  checkAPIkey,
  // Step 2: Verify the session token
  authAppVerifyToken,
  // Step 3: Delegate to the controller
<<<<<<< HEAD
  deleteOneUser,
=======
  deleteOneUser
>>>>>>> upstream/main
);

// -----------------------------------------------------------------------------
// POST /list-one → List a user by their identifier
// Body: User identifier
// -----------------------------------------------------------------------------
userRouter.post(
<<<<<<< HEAD
  "/list-one",
=======
  '/list-one',
>>>>>>> upstream/main
  // Step 1: Verify the API key
  checkAPIkey,
  // Step 2: Verify the session token
  authAppVerifyToken,
  // Step 3: Delegate to the controller
<<<<<<< HEAD
  listOneUser,
=======
  listOneUser
>>>>>>> upstream/main
);

// -----------------------------------------------------------------------------
// POST /find-by-email → List a user by their email
// Body: User email
// -----------------------------------------------------------------------------
userRouter.post(
<<<<<<< HEAD
  "/find-by-email",
=======
  '/find-by-email',
>>>>>>> upstream/main
  // Step 1: Verify the API key
  checkAPIkey,
  // Step 2: Verify the session token
  authAppVerifyToken,
  // Step 3: Delegate to the controller
<<<<<<< HEAD
  findByEmailUser,
=======
  findByEmailUser
>>>>>>> upstream/main
);

// -----------------------------------------------------------------------------
// GET /list-all → List al users
// Body:
// -----------------------------------------------------------------------------
userRouter.get(
<<<<<<< HEAD
  "/list-all",
=======
  '/list-all',
>>>>>>> upstream/main
  // Step 1: Verify the API key
  checkAPIkey,
  // Step 2: Verify the session token
  authAppVerifyToken,
  // Step 3: Delegate to the controller
<<<<<<< HEAD
  listAllUsers,
=======
  listAllUsers
>>>>>>> upstream/main
);

export default userRouter;
