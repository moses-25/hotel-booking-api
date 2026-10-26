import { Router } from "express";
import { checkAPIkey } from "../middlewares/apiAuthHandler.js";
import { authAppVerifyToken } from "../middlewares/tokenHandlers/authAppTokenHandler.js";
import { checkRole } from "../middlewares/checkRoleHandler.js";
import { validatorHandler } from "../middlewares/validatorHandler.js";
import { roomTypeSchema } from "../schema/roomTypeSchema.js";
import {
  createOneRoomType,
  deleteOneRoomType,
  listAllRoomTypes,
  listOneRoomType,
  updateOneRoomType,
} from "../controllers/roomType/index.js";

/**
 * Routes for managing the room-type catalog.
 *
 * Mounted at `/api/v1/room-types`. All endpoints require a valid API key,
 * an authenticated user token, and the Administrator role. Create and update
 * payloads are validated against their Joi schemas; lookup and delete
 * requests validate `roomTypeId` in the request body.
 *
 * Endpoints:
 * - `POST /create` — create a room type.
 * - `PUT /update` — update a room type.
 * - `POST /list-one` — retrieve a room type by ID.
 * - `GET /list-all` — retrieve all room types.
 * - `DELETE /delete` — delete a room type by ID.
 *
 * @module routes/roomTypeRouter
 */
const roomTypeRouter = Router();

// POST /create — create a room type from the validated room-type payload.
roomTypeRouter.post(
  "/create",
  checkAPIkey,
  authAppVerifyToken,
  checkRole(["Administrator"]),
  validatorHandler(roomTypeSchema.newRoomTypeData, "body"),
  createOneRoomType,
);

// PUT /update — update one or more room-type fields, identified by roomTypeId.
roomTypeRouter.put(
  "/update",
  checkAPIkey,
  authAppVerifyToken,
  checkRole(["Administrator"]),
  validatorHandler(roomTypeSchema.updateRoomTypeData, "body"),
  updateOneRoomType,
);

// POST /list-one — retrieve a room type using roomTypeId in the request body.
roomTypeRouter.post(
  "/list-one",
  checkAPIkey,
  authAppVerifyToken,
  checkRole(["Administrator"]),
  validatorHandler(roomTypeSchema.getRoomTypeById, "body"),
  listOneRoomType,
);

// GET /list-all — retrieve every room type.
roomTypeRouter.get(
  "/list-all",
  checkAPIkey,
  authAppVerifyToken,
  checkRole(["Administrator"]),
  listAllRoomTypes,
);

// DELETE /delete — delete a room type using roomTypeId in the request body.
roomTypeRouter.delete(
  "/delete",
  checkAPIkey,
  authAppVerifyToken,
  checkRole(["Administrator"]),
  validatorHandler(roomTypeSchema.getRoomTypeById, "body"),
  deleteOneRoomType,
);

export default roomTypeRouter;
