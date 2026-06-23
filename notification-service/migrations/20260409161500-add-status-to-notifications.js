'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Notifications', 'status', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'PENDING'
    });
    await queryInterface.addColumn('Notifications', 'service', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Notifications', 'status');
    await queryInterface.removeColumn('Notifications', 'service');
  }
};
