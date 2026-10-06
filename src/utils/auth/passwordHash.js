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
    }
  });
};
