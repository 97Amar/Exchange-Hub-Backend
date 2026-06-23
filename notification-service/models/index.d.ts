import { Model, BuildOptions, Sequelize } from "sequelize";

export interface OtpAttributes {
  id?: number;
  username: string;
  otp: string;
  service: string;
  target?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OtpModel extends Model<OtpAttributes>, OtpAttributes {}
export type OtpStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): OtpModel;
};

export interface NotificationAttributes {
  id?: number;
  username: string;
  type: string;
  content: any;
  status: string;
  service: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OtpNotificationModel
  extends Model<NotificationAttributes>, NotificationAttributes {}
export type OtpNotificationStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): OtpNotificationModel;
};

export interface DbInterface {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  Otp: OtpStatic;
  OtpNotification: OtpNotificationStatic;
}

declare const db: DbInterface;
export default db;
