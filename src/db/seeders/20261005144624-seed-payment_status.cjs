"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      INSERT INTO payment_status (name, created_at, updated_at) VALUES
        ('Pending'      NOW(), NOW()),
        ('paid'    NOW(), NOW()),
        ('Failed'   NOW(), NOW()),
        ('Refunded'  NOW(), NOW())
      ON CONFLICT (name) DO NOTHING;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("payment_status", {
      name: ["Pending", "paid", "Failed", "Refunded"],
    });
  },
};
