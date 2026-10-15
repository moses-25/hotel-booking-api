// Import the Sequelize instance from the database connection library
<<<<<<< HEAD
import { sequelize } from "../../libraries/DBConnection.js";
// Import DataTypes from sequelize to define column types
import { DataTypes } from "sequelize";

// Define the name of the room table
export const ROOM_TABLE = "room";

// Define the room model
export const Room = sequelize.define(
  // Table name
  ROOM_TABLE,
  // Table columns
=======
import { sequelize } from '../../libraries/DBConnection.js';
// Import DataTypes from sequelize to define column types
import { DataTypes } from 'sequelize';

// Define the name of the room table
export const ROOM_TABLE = 'room';

// Define the room model
export const Room = sequelize.define(
  ROOM_TABLE,
>>>>>>> upstream/main
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
    },
<<<<<<< HEAD
    name: {
=======
    number: {
>>>>>>> upstream/main
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
<<<<<<< HEAD
        model: "room_type",
        key: "id",
=======
        model: 'room_type',
        key: 'id',
>>>>>>> upstream/main
      },
    },
    floor: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
<<<<<<< HEAD
        model: "room_status",
        key: "id",
=======
        model: 'room_status',
        key: 'id',
>>>>>>> upstream/main
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
<<<<<<< HEAD
      field: "created_at",
=======
      field: 'created_at',
>>>>>>> upstream/main
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
<<<<<<< HEAD
      field: "updated_at",
=======
      field: 'updated_at',
>>>>>>> upstream/main
    },
  },
  {
    sequelize,
    tableName: ROOM_TABLE,
<<<<<<< HEAD
    modelName: "room",
    timestamps: true,
  },
=======
    modelName: 'room',
    timestamps: true,
  }
>>>>>>> upstream/main
);
