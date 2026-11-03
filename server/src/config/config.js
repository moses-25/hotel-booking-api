// Import dotenv package to load environment variables from a .env file
import dotenv from 'dotenv';

// Load environment variables from .env file into process.env
dotenv.config();

const databaseEnvPrefix =
  process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV';
const databaseEnv = (name) =>
  process.env[`${databaseEnvPrefix}_DB_${name}`] ?? process.env[`DB_${name}`];

// Export the configuration object containing various API settings
export const config = {
  // Set the environment
  env: process.env.NODE_ENV,
  // Database dialect
  dialect: process.env.DIALECT,
  // API port
  apiPort: process.env.API_PORT,
  // Database user name
  dbUser: databaseEnv('USER'),
  // Database user password
  dbPassword: databaseEnv('PASSWORD'),
  // Database Host
  dbHost: databaseEnv('HOST'),
  // Database name
  dbName: databaseEnv('NAME'),
  // Database port
  dbPort: databaseEnv('PORT'),
  // API key for the authentication application
  APIKey: process.env.API_KEY,
  // JWT secret key for the user authentication
  authAppJwtKey: process.env.AUTH_API_JWT_SECRET_KEY,
  // Symmetric key (hex, 32 bytes) for message body encryption at rest.
  messageEncryptionKey: process.env.MESSAGE_ENCRYPTION_KEY,
  // Allowed front-end origin for CORS request
  corsOrigin: process.env.CORS_ORIGIN,
  // Proxy hops in front of the API
  trustProxyHops: parseInt(process.env.TRUST_PROXY_HOPS ?? '0') || 0,
};
