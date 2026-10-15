// Import the jsonwebtoken library to handling JWT operations
<<<<<<< HEAD
import jwt from "jsonwebtoken";

/**
 * Signs a JSON web Token (JWT) for a user.
=======
import jwt from 'jsonwebtoken';

/**
 * Signs a JSON Web Token (JWT) for a user.
>>>>>>> upstream/main
 *
 * @param {object} payload
 * - The payload to be included in the token. Typically includes user information.
 * @param {string} secret
 * - The secret or private key to sign the token.
 * @param {string|number} timer
 * - The expiration time fot the token. This can be a string
 * - (e.g, '1h' for 1 hour) or a number of seconds.
 * @returns {string}
<<<<<<< HEAD
 * - The signed JWT.
=======
 * - THe signed JWT.
>>>>>>> upstream/main
 */
export const signUserToken = (payload, secret, timer) => {
  return jwt.sign(payload, secret, { expiresIn: timer });
};
