import { Sequelize, DataTypes } from 'sequelize';
import * as dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize('notifications', 'root', 'admin123', {
  host: '0.0.0.0',
  port: 3306,
  dialect: 'mysql',
  logging: false,
});

async function checkOtps() {
  try {
    const Otp = sequelize.define('Otp', {
      username: DataTypes.STRING,
      otp: DataTypes.STRING,
      service: DataTypes.STRING,
      target: DataTypes.STRING,
      createdAt: { type: DataTypes.DATE, field: 'created_at' },
      updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    }, {
      tableName: 'Otps',
      underscored: true,
    });

    const otps: any = await Otp.findAll();
    console.log('--- ALL OTPS ---');
    console.log(JSON.stringify(otps, null, 2));
    
    console.log('\n--- TIME CHECK ---');
    console.log('Node getTime():', new Date().getTime());
    console.log('Node toISOString():', new Date().toISOString());
    if (otps.length > 0) {
      const lastOtp = otps[otps.length - 1];
      console.log('Last OTP createdAt RAW:', lastOtp.createdAt);
      console.log('Last OTP createdAt getTime():', new Date(lastOtp.createdAt).getTime());
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOtps();
