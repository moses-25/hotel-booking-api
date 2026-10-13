/**
 * @module service/authenticationServices
 * @description Service layer for usher authentication.
 *
 *  Handles credentials-based login (returning a signed JWT) and unauthenticated
 * password reset. Password comparison and hashing are performed with bcrypt.
 */

// import the user data model
import { User } from "../db/models/user.js";
// import the related catalog models needed to embed FK data as nested objects
import { UserRole } from "../db/models/userRole.js";
// Import the authentication utility module to sign JWT token
import { signUserToken } from "../../utils/auth/tokenSign.js";
// Import bcrypt takes care of hashing the user's password
import bcrypt from "bcryptjs";
// import the promise to encrypt the user's password
import { hashPassword } from "../utils/auth/passwordHash.js";
// Import the centralized API configuration, which resolves all
// Environment variables
import { config } from "../../config/config.js";
// boom allows managing possible errors
import Boom from "@hapi/boom";
