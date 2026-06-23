'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_wallets', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false
      },
      privateKey: {
        type: Sequelize.STRING,
        allowNull: true
      },
      coinId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'coins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      balance: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: false,
        defaultValue: 0
      },
      lockedBalance: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add index for faster lookups
    await queryInterface.addIndex('user_wallets', ['userId', 'coinId']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_wallets');
  }
};
