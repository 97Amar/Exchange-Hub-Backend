import { DataTypes, Model, Sequelize } from "sequelize";

class UserRegister extends Model {
  public user_id!: string;
  public first_name!: string;
  public last_name!: string;
  public email!: string;
  public password!: string;
  public user_type!: string;
  public status!: "active" | "inactive";
  public profile_pic!: string;
  public phone!: string;
  public city!: string;
  public state!: string;
  public country!: string;
  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at!: Date;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        user_id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        first_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        last_name: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        password: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        user_type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM("active", "inactive"),
          allowNull: false,
          defaultValue: "active",
        },
        profile_pic: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        state: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        country: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "user_register",
        underscored: true,
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        paranoid: true,
      },
    );
  }
}

export default UserRegister;
