'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "conversation" ALTER COLUMN "staff" DROP NOT NULL',
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "conversation" ALTER COLUMN "staff" SET NOT NULL',
    );
  },
};
