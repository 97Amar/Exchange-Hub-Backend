module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("bybit_orders", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pair_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      qty: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: false,
      },
      executed_price: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: true,
        defaultValue: 0,
      },
      filled_qty: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM("open", "partial", "matched", "cancelled", "partially_cancelled"),
        allowNull: false,
        defaultValue: "open",
      },
      bybit_order_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      side: {
        type: Sequelize.ENUM("Buy", "Sell"),
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM("Limit", "Market"),
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("bybit_orders");
  },
};
