/**
 * @module graphql/resolvers/roomTypeResolver
 * @description Resolvers for the RoomType catalog.
 *
 * All room-type operations are Administrator-only. Input validation reuses
 * the same Joi schemas as the REST API, and service errors are normalized to
 * GraphQL errors with stable extension codes.
 */

import { GraphQLError } from "graphql";
import { RoomTypeService } from "../../services/roomTypeServices.js";
import { roomTypeSchema } from "../../schema/roomTypeSchema.js";
import { requireRole, toGraphQLError, validate } from "../helpers.js";

const roomTypeManager = new RoomTypeService();

const idAsString = (roomTypeId) => String(roomTypeId);

const assertStatus = (response, expectedStatus, operation) => {
  if (response.status !== expectedStatus) {
    throw new GraphQLError(`Unexpected ${operation} status.`, {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

export const roomTypeResolver = {
  Query: {
    async roomType(_, { dto }, context) {
      requireRole(context, ["Administrator"]);
      const roomTypeId = idAsString(dto.roomTypeId);
      validate(roomTypeSchema.getRoomTypeById, { roomTypeId });

      try {
        const response = await roomTypeManager.listOne(roomTypeId);
        assertStatus(response, "ROOM TYPE FOUND SUCCESSFULLY", "listOne");
        return response.roomType;
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    async allRoomTypes(_, __, context) {
      requireRole(context, ["Administrator"]);

      try {
        const response = await roomTypeManager.listAll();
        assertStatus(response, "ROOM TYPES FOUND SUCCESSFULLY", "listAll");
        return response.roomTypes;
      } catch (err) {
        throw toGraphQLError(err);
      }
    },
  },

  Mutation: {
    async newRoomType(_, { dto }, context) {
      requireRole(context, ["Administrator"]);
      validate(roomTypeSchema.newRoomTypeData, dto);

      try {
        const response = await roomTypeManager.createOne(dto);
        assertStatus(response, "ROOM TYPE CREATED SUCCESSFULLY", "createOne");
        return response.roomType;
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    async updateRoomType(_, { dto }, context) {
      requireRole(context, ["Administrator"]);
      const roomTypeId = idAsString(dto.roomTypeId);
      const { roomTypeId: _id, ...roomTypeData } = dto;
      validate(roomTypeSchema.updateRoomTypeData, {
        roomTypeId,
        ...roomTypeData,
      });

      try {
        const response = await roomTypeManager.updateOne(
          roomTypeId,
          roomTypeData,
        );
        assertStatus(response, "ROOM TYPE UPDATED SUCCESSFULLY", "updateOne");
        return response.roomType;
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    async deleteRoomType(_, { dto }, context) {
      requireRole(context, ["Administrator"]);
      const roomTypeId = idAsString(dto.roomTypeId);
      validate(roomTypeSchema.getRoomTypeById, { roomTypeId });

      try {
        const response = await roomTypeManager.deleteOne(roomTypeId);
        assertStatus(response, "ROOM TYPE DELETED SUCCESSFULLY", "deleteOne");
        return true;
      } catch (err) {
        throw toGraphQLError(err);
      }
    },
  },
};
