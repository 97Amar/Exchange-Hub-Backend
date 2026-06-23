import { DataTypes, Model, Sequelize } from "sequelize";

class Repository extends Model {
  public id!: string;
  public user_id!: string;
  public name!: string;
  public category!: string;
  public tech_stack!: string;
  public description!: string;
  public price!: string;
  public s3_url!: string;
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
          type: DataTypes.UUID,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        category: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        tech_stack: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        price: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        s3_url: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "repositories",
        underscored: true,
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
      }
    );
  }
}

export default Repository;
