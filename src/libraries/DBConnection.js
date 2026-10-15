<<<<<<< HEAD
// import the sequelize constructor from the sequelize library
import { Sequelize } from "sequelize";
// import the configuration settings
import { config } from "../config/config.js";

// create a new instance of sequelize with the provider credentials and options
=======
// Import the Sequelize constructor form the 'sequelize` library
import { Sequelize} from 'sequelize';
// Import the configuration settings
import { config } from '../config/config.js';

// Create a new instance of Sequelize with the provided credentials and options
>>>>>>> upstream/main
export const sequelize = new Sequelize(
  config.dbName,
  config.dbUser,
  config.dbPassword,
  {
<<<<<<< HEAD
    // specify the database host
    host: config.dbHost,
    // specify the database port
    port: config.dbPort,
    // specify the dialect as postgres
    dialect: config.dialect,
    // Enable logging of SQL queries to console
    logging: console.log,
    // set the timezone to (UTC+2)
    dialectOptions: {
      timezone: "+02:00",
    },
  },
);

/**
 * Tests the database connection
 */
export const testConnection = async () => {
  try {
    // attempt to authenticate the connection to the database
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    // log the error message if the connection fails
    console.error("Impossible to connect to the database:", error);
  }
};

export const testconnection = testConnection;
=======
    // Specify the database host
    host: config.dbHost,
    // Specify the database port
    port: config.dbPort,
    // Specify the dialect as PostgreSQL
    dialect: config.dialect,
    // Enable logging of SQL queries to console
    logging: console.log,
    // Set the timezone to (UTC+2)
    dialectOptions: {
      timezone: '+2:00'
    }
  }
);

/**
 * Function to test database connection
 * @param {Function} next
 * - Optional callback function to execute after the test
 */
export const testConnection = async (next) => {
  try {
    // attempt to authenticate the connection
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (err) {
    // Log an error message if the connections fails
    console.error('Impossible to connect the database:', err);
  }
};
>>>>>>> upstream/main
