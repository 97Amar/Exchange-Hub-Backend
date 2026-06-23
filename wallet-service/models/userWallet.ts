import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../src/database/database';

class UserWallet extends Model {
  public id!: string;
  public userId!: string;
  public address!: string;
  public privateKey?: string;
  public coinId!: string;
  public balance!: number;
  public lockedBalance!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserWallet.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    privateKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    coinId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
      defaultValue: 0,
    },
    lockedBalance: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'user_wallets',
    indexes: [
      {
        fields: ['userId', 'coinId'],
      },
    ],
  }
);

export default UserWallet;
