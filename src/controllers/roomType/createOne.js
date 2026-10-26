import { RoomTypeService } from "../../services/roomTypeServices.js";
import Boom from "@hapi/boom";

/**
 * Creates a room type using the validated request body.
 *
 * Expected fields are `name`, `description`, `pricePerNight`, `maxOccupancy`,
 * and `amenities`. On success, returns HTTP 201 with the created room type
 * and the rotated authentication token supplied by authentication middleware.
 * Errors are converted to Boom errors and passed to the next middleware.
 *
 * @param {Object} req - Express request containing the validated room-type body.
 * @param {Object} req.body - Room-type fields to persist.
 * @param {Object} res - Express response object.
 * @param {string} res.locals.newUserToken - Rotated token set by authentication middleware.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} Sends the creation response or forwards an error.
 */
export const createOneRoomType = async (req, res, next) => {
  const newRoomType = {
    name: req.body.name,
    description: req.body.description,
    pricePerNight: req.body.pricePerNight,
    maxOccupancy: req.body.maxOccupancy,
    amenities: req.body.amenities,
  };

  const roomTypeManager = new RoomTypeService();

  try {
    const response = await roomTypeManager.createOne(newRoomType);

    if (response.status === "ROOM TYPE CREATED SUCCESSFULLY") {
      return res.status(201).json({
        success: true,
        message: "Room type created successfully",
        roomType: response.roomType,
        authentication: res.locals.newUserToken,
      });
    }
  } catch (err) {
    const boomError = Boom.boomify(err, {
      message: "It is not possible to create the room type in the database.",
    });
    next(boomError);
  }
};
