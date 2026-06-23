import { DataTypes, Model, Sequelize } from "sequelize";

class Binance extends Model {
  public id!: string;
  public user_id!: string;
  public pair_name!: string;
  public qty!: number;
  public price!: number;
  public executed_price!: number;
  public filled_qty!: number;
  public status!: string;
  public binance_order_id!: string;
  public side!: "Buy" | "Sell";
  public type!: "Limit" | "Market";
  public created_at!: Date;
  public updated_at!: Date;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        pair_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        qty: {
          type: DataTypes.DECIMAL(20, 8),
          allowNull: false,
        },
        price: {
          type: DataTypes.DECIMAL(20, 8),
          allowNull: false,
        },
        executed_price: {
          type: DataTypes.DECIMAL(20, 8),
          allowNull: true,
          defaultValue: 0,
        },
        filled_qty: {
          type: DataTypes.DECIMAL(20, 8),
          allowNull: true,
          defaultValue: 0,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "NEW",
        },
        binance_order_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        side: {
          type: DataTypes.ENUM("Buy", "Sell"),
          allowNull: true,
        },
        type: {
          type: DataTypes.ENUM("Limit", "Market"),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "binance_orders",
        underscored: true,
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    );
  }
}

export default Binance;
