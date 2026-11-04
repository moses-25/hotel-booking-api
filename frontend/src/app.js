// Import necessary modules and dependencies
// Express framework for creating the api
import express from "express";
// Middleware to handle body request
import bodyParser from "body-parser";
// Middleware to cross origins request
import cors from "cors";
// Middleware for logging HTTP requests
import morgan from "morgan";
// Main router for the API
import routerAPI from "./routes/index.js";
// Import the GraphQL with the Apollo server instance
import { useGraphql } from "./graphql/index.js";
// Import the configuration module
import { config } from "./config/config.js";
// Custom error handling middlewares
import {
  logError,
  errorHandler,
  boomErrorHandler,
  ORMErrorHandler,
} from "./middlewares/errorHandler.js";
// Import the setup of the database entities associations
import { setAssociations } from "./db/models/index.js";

/**
 * Builds and configures the Express application without starting a server.
 *
 * Keeping the construction separated from `listen` allows the app to be
 * imported by the tests (Supertest) without opening ports, reading the
 * network interfaces or connecting to the database.
 *
 * @async
 * @returns {Promise<import('express').Express>} The configured Express app.
 */
export const createApp = async () => {
  // Create the API with Express.js
  const api = express();

  // Trust proxy: number of proxy hops in front of the API (e.g. the Next.js
  // server = 1). Express then derives req.ip from X-Forwarded-For, which the
  // rate limiters use as their key. Only enabled when TRUST_PROXY_HOPS is set,
  // so local development (API called directly) keeps req.ip as the socket IP.
  // Never use `true`: clients could then spoof X-Forwarded-For and dodge the
  // limiters. This must be set BEFORE any middleware that reads req.ip.
  if (config.trustProxyHops > 0) {
    api.set("trust proxy", config.trustProxyHops);
  }

  // ---------------------------------------------------------------------------
  // Use Middlewares
  // ---------------------------------------------------------------------------

  // HTTP request logger middleware (disabled in tests to keep the output clean)
  if (config.env !== "test") {
    api.use(morgan("dev"));
  }

  // Configure CORS to allow requests from the configured frontend origin.
  // Mounted before the body parsers and the routers so preflight OPTIONS
  // requests (which carry no apikey/Authorization headers) are answered here
  // and never reach checkAPIkey.
  const allowedOrigins = [
    config.corsOrigin,
    ...(config.env === "development"
      ? [
          "https://sandbox.embed.apollographql.com",
          "https://studio.apollographql.com",
        ]
      : []),
  ];

  api.use(
    cors({
      origin: allowedOrigins,
      allowedHeaders: ["Content-Type", "Authorization", "apikey"],
      // Headers the browser is allowed to read from the response:
      // - X-Access-Token: the rotated JWT
      // - Retry-After / RateLimit: rate-limit info on 429 responses
      exposedHeaders: ["X-Access-Token", "Retry-After", "RateLimit"],
    }),
  );

  // Middleware for parsing JSON bodies
  api.use(bodyParser.json());

  // GraphQL - Layer - mounted BEFORE body parsers because Apollo Server
  // parses the request stream itself. CORS stays above so preflights are
  // answered at the edge.
  await useGraphql(api);

  // Middleware to parse URL-encoded data
  api.use(express.urlencoded({ extended: false }));

  // Middleware to parse JSON data
  api.use(express.json());

  // Set up all Sequelize models associations before any database query is made
  // This is a memory-only operation and does not require an active DB connection
  setAssociations();

  // Initialize the main router
  // Set up API routes
  routerAPI(api);

  // Use custom error handling middlewares
  // Middleware for logging errors
  api.use(logError);
  // Middleware for handling ORM errors
  api.use(ORMErrorHandler);
  // Middleware for handling Boom errors
  api.use(boomErrorHandler);
  // General error handling middleware
  api.use(errorHandler);

  // Return the configured app so it can be started or tested
  return api;
};
