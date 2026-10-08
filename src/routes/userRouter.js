import { Router } from "express";

// -------------------conrtollers------------------------
import { createOneUser } from "../controllers/user/index";

// create a new user Router instance dedicated to the user resource
const userRouter = Router();

// -------------------------------------------------------
// POST /create  → create a new user
// Body: New user data
// --------------------------------------------------------
userRouter.post("/create", createOneUser);

export default userRouter;
