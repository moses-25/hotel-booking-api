import { RoomTypeService } from "../../services/roomTypeServices.js";
import Boom from "@hapi/boom";

/**
 * Retrieves all room types.
 *
 * On success, returns HTTP 200 with the total count, formatted room types,
 * and the rotated authentication token supplied by authentication middleware.
 * Errors are converted to Boom errors and passed to the next middleware.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {string} res.locals.newUserToken - Rotated token set by authentication middleware.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} Sends the room-type collection or forwards an error.
 */
export const listAllRoomTypes = async (req, res, next) => {
  const roomTypeManager = new RoomTypeService();

  try {
    const response = await roomTypeManager.listAll();

    if (response.status === "ROOM TYPES FOUND SUCCESSFULLY") {
      return res.status(200).json({
        success: true,
        message: "Room types found successfully",
        total: response.total,
        roomTypes: response.roomTypes,
        authentication: res.locals.newUserToken,
      });
    }
  } catch (err) {
    const boomError = Boom.boomify(err, {
      message: "It is not possible to find all the room types in the database.",
    });
    next(boomError);
  }
};
