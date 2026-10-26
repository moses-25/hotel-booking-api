import { RoomTypeService } from "../../services/roomTypeServices.js";
import Boom from "@hapi/boom";

/**
 * Retrieves a room type by its identifier.
 *
 * The validated request body must include `roomTypeId`. On success, returns
 * HTTP 200 with the formatted room type and the rotated authentication token
 * supplied by authentication middleware. Errors are converted to Boom errors
 * and passed to the next middleware.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Request body containing the lookup identifier.
 * @param {string|number} req.body.roomTypeId - ID of the room type to retrieve.
 * @param {Object} res - Express response object.
 * @param {string} res.locals.newUserToken - Rotated token set by authentication middleware.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} Sends the room type response or forwards an error.
 */
export const listOneRoomType = async (req, res, next) => {
  const roomTypeId = req.body.roomTypeId;

  if (!roomTypeId) {
    throw Boom.badRequest("No room type identifier provided");
  }

  const roomTypeManager = new RoomTypeService();

  try {
    const response = await roomTypeManager.listOne(roomTypeId);

    if (response.status === "ROOM TYPE FOUND SUCCESSFULLY") {
      return res.status(200).json({
        success: true,
        message: "Room type found successfully",
        roomType: response.roomType,
        authentication: res.locals.newUserToken,
      });
    }
  } catch (err) {
    const boomError = Boom.boomify(err, {
      message: "It is not possible to find the room type in the database.",
    });
    next(boomError);
  }
};
