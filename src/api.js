// Import necessary modules and dependencies
// Express framework for creating the api
import express from 'express';
// function to manage files and directories since the node.js api
import path from 'path';
// function to have access to the directory or file path
import { fileURLToPath } from 'url';
// Middleware to handle body request
import bodyParser from 'body-parser';
// Middleware to cross origins request
import cors from 'cors';
// Middleware for logging HTTP requests
import morgan from 'morgan';
// import the IP address and port from the network configuration.module
import { theIPAddress, port } from './libraries/netconfig.js';


// Create the API with Express.js
const api = express();

// -----------------------------------------------------------------------------
// Use Middlewares
// -----------------------------------------------------------------------------

// HTTP request logger middleware
api.use(morgan('dev'));

// Middleware to parse URL-encoded data
api.use(express.urlencoded({ extended: false }));
// Middleware to parse JSON data
api.use(express.json());
// Middleware for parsing JSON bodies
api.use(bodyParser.json());

// Static files path
// Store in the constant the project dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

api.get('/', (req, res) => {
  res.send("IP address and port working ")
});

// Immediately invoked Function Expression (IIFE) to run the server
(async () => {
  // wait the api to start listening on the specified IP address and port
  const createAPI = await api.listen(port, theIPAddress, (req, res) => {
    // log the server start listening message with the IP address and port
    console.log(`API is listening on ${theIPAddress}:${port}`);
  });
})();

// Export the API for the use in other files
export default api;
