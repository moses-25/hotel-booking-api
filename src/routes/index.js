// Import the Router class from Express
import { Router } from "express";

// Import the Services Routes for handle services related-routes
<<<<<<< HEAD
import userRouter from "./userRouter.js";
import authenticationRouter from "./authenticationRouter.js";

// Function to set up API routes
const routerAPI = (api) => {
=======
import userRouter from './userRouter.js';
import authenticationRouter from './authenticationRouter.js';

// Function to set up API routes
const routerAPI = (api) => {

>>>>>>> upstream/main
  // Create a new router instance
  const router = Router();

  // Use the router instance for the '/api/v1' path
<<<<<<< HEAD
  api.use("/api/v1", router);

  // Catalog of the sub-routes
  router.use("/auth", authenticationRouter);
  router.use("/users", userRouter);
=======
  api.use('/api/v1', router);

  // Catalog of the sub-routes
  router.use('/auth', authenticationRouter)
  router.use('/users', userRouter);
>>>>>>> upstream/main
};

// Export the routerAPI function for use in other API modules
export default routerAPI;
