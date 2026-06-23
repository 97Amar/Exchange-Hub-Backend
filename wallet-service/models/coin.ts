import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../src/database/database';

class Coin extends Model {
  public id!: string;
  public name!: string;
  public type!: number; // 0 for coin, 1 for token
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Coin.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'coins',
  }
);

export default Coin;
