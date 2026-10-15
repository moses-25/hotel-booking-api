// import the sequelize constructor from the sequelize library
import { Sequelize } from 'sequelize';
// import the configuration settings
import { config } from '../config/config.js';

// create a new instance of sequelize with the provider credentials and options
export const sequelize = new Sequelize(
  config.dbName,
  config.dbUser,
  config.dbPassword,
  {
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

export const testconnection = testConnection;
