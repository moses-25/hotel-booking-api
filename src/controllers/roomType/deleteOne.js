import { RoomTypeService } from "../../services/roomTypeServices.js";
import Boom from "@hapi/boom";

/**
 * Deletes a room type by its identifier.
 *
 * The validated request body must include `roomTypeId`. On success, returns
 * HTTP 200 with a confirmation message and the rotated authentication token
 * supplied by authentication middleware. Errors are converted to Boom errors
 * and passed to the next middleware.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Request body containing the room-type identifier.
 * @param {string|number} req.body.roomTypeId - ID of the room type to delete.
 * @param {Object} res - Express response object.
 * @param {string} res.locals.newUserToken - Rotated token set by authentication middleware.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} Sends the delete confirmation or forwards an error.
 */
export const deleteOneRoomType = async (req, res, next) => {
  const roomTypeId = req.body.roomTypeId;

  if (!roomTypeId) {
    throw Boom.badRequest("No room type identifier provided");
  }

  const roomTypeManager = new RoomTypeService();

  try {
    const response = await roomTypeManager.deleteOne(roomTypeId);

    if (response.status === "ROOM TYPE DELETED SUCCESSFULLY") {
      return res.status(200).json({
        success: true,
        message: "Room type deleted successfully",
        authentication: res.locals.newUserToken,
      });
    }
  } catch (err) {
    const boomError = Boom.boomify(err, {
      message: "It is not possible to delete the room type in the database.",
    });
    next(boomError);
  }
};
