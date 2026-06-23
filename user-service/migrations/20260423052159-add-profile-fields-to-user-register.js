'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_register', 'profile_pic', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('user_register', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('user_register', 'city', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('user_register', 'state', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('user_register', 'country', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_register', 'profile_pic');
    await queryInterface.removeColumn('user_register', 'phone');
    await queryInterface.removeColumn('user_register', 'city');
    await queryInterface.removeColumn('user_register', 'state');
    await queryInterface.removeColumn('user_register', 'country');
  }
};
