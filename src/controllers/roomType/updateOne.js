import { RoomTypeService } from "../../services/roomTypeServices.js";
import Boom from "@hapi/boom";

/**
 * Updates the supplied fields for an existing room type.
 *
 * The validated request body contains `roomTypeId` and may include `name`,
 * `description`, `pricePerNight`, `maxOccupancy`, and/or `amenities`. The
 * service ignores fields that are not provided. On success, returns HTTP 200
 * with the updated room type and the rotated authentication token supplied by
 * authentication middleware.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Room-type identifier and fields to update.
 * @param {string|number} req.body.roomTypeId - ID of the room type to update.
 * @param {string} [req.body.name] - Updated room-type name.
 * @param {string} [req.body.description] - Updated room-type description.
 * @param {number} [req.body.pricePerNight] - Updated nightly price.
 * @param {number} [req.body.maxOccupancy] - Updated maximum occupancy.
 * @param {string[]} [req.body.amenities] - Updated amenity identifiers.
 * @param {Object} res - Express response object.
 * @param {string} res.locals.newUserToken - Rotated token set by authentication middleware.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} Sends the update response or forwards an error.
 */
export const updateOneRoomType = async (req, res, next) => {
  const roomTypeId = req.body.roomTypeId;

  const newRoomTypeData = {
    name: req.body.name,
    description: req.body.description,
    pricePerNight: req.body.pricePerNight,
    maxOccupancy: req.body.maxOccupancy,
    amenities: req.body.amenities,
  };

  if (!roomTypeId) {
    throw Boom.badRequest("No room type identifier provided");
  }

  const roomTypeManager = new RoomTypeService();

  try {
    const response = await roomTypeManager.updateOne(
      roomTypeId,
      newRoomTypeData,
    );

    if (response.status === "ROOM TYPE UPDATED SUCCESSFULLY") {
      return res.status(200).json({
        success: true,
        message: "Room type updated successfully",
        roomType: response.roomType,
        authentication: res.locals.newUserToken,
      });
    }
  } catch (err) {
    const boomError = Boom.boomify(err, {
      message: "It is not possible to update the room type in the database.",
    });
    next(boomError);
  }
};
