'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Otp extends Model {
    static associate(models) {
      // define association here
    }
  }
  Otp.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false
    },
    service: {
      type: DataTypes.STRING,
      allowNull: false
    },
    target: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Otp',
    tableName: 'Otps',
    underscored: true,
  });
  return Otp;
};
