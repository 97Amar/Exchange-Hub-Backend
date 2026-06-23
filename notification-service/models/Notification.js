"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OtpNotification extends Model {
    static associate(models) {
      // define association here
    }
  }
  OtpNotification.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "PENDING",
      },
      service: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "OtpNotification",
      tableName: "Notifications",
      underscored: true,
    },
  );
  return OtpNotification;
};
