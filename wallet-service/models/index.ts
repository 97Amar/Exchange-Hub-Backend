import Coin from './coin';
import UserWallet from './userWallet';

const models = [Coin, UserWallet];

// Set up associations
UserWallet.belongsTo(Coin, { foreignKey: 'coinId', as: 'coin' });
Coin.hasMany(UserWallet, { foreignKey: 'coinId', as: 'wallets' });

export { Coin, UserWallet };
export default models;
