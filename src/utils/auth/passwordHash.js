<<<<<<< HEAD
// import the bycrypt library for hashing passwords
import bycrypt from "bcryptjs";

/**
 * Hashes a password using bcrypt
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - A promise resolving to the hashed password
 */
export const hashPassword = async (password) => {
  return new Promise((resolve, reject) => {
    try {
      // define the number of salt rounds to use for hashing
      const saltRounds = 11;
      // generate a salt with the defined number of rounds
      bycrypt
        .genSalt(saltRounds)
        // hash the password with the defined number of roundes
        .then((salt) => bycrypt.hash(password, salt))
        // resolve the promise with the hashed password
        .then((hashedPassword) => resolve(hashedPassword))
        // catch and reject any errors that occur during the hashing process
        .catch((error) => reject(`Error in the encryption: ${error.message}`));
    } catch (error) {
      // catch and reject any errors that occur during salt generation or hashing
      reject(
        `Error when generating salt or hashing password: ${error.message}`,
      );
=======
// Import the bcryptjs library for handling password hashing
import bcrypt from 'bcryptjs';

/**
 * Hashes a given password using bcrypt.
 *
 * @param {string} userPassword
 * - The plain text password to be hashed.
 * @returns {Promise<string>}
 * - A promise that resolves to the hashed password.
 */
export const hashPassword = async (userPassword) => {
  return new Promise((resolve, reject) => {
    try {
      // Define the number of salt rounds to use
      const saltRounds = 11;
      // Generate a salt with the defined number of rounds
      bcrypt.genSalt(saltRounds)
        // Hash the password with the generated salt
        .then((salt) => bcrypt.hash(userPassword, salt))
        // Resolve the promise with the hashed password
        .then((hashedPass) => resolve(hashedPass))
        // Catch and reject any error during hashing
        .catch((err) => reject(`Error in the encryption: ${err.message}`));
    } catch (err) {
      // Catch and reject any error during salt generation
      reject(`Error when generating the salt: ${err.message}`);
>>>>>>> upstream/main
    }
  });
};
