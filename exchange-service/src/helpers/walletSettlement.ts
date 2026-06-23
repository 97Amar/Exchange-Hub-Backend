
import UserWallet from "../models/userWallet";
import { walletDb } from "../database/walletDb";
import { sequelize } from "../database/database"; // exchange_db
import { QueryTypes } from "sequelize";
import logger from "../utils/logger";

/**
 * Helper: find a user's wallet for a given coin name
 */
async function getUserWallet(userId: string, coinName: string) {
  logger.info(`🔍 Searching wallet for User: ${userId}, Coin: ${coinName}`);
  const [wallet]: any[] = await walletDb.query(
    `SELECT w.id, w.userId, w.balance, w.lockedBalance
       FROM user_wallets w
       JOIN coins c ON w.coinId = c.id
      WHERE w.userId = :userId AND c.name = :coinName
       LIMIT 1`,
    { replacements: { userId, coinName }, type: QueryTypes.SELECT },
  );
  if (!wallet) {
    logger.warn(`⚠️ Wallet NOT FOUND for User: ${userId}, Coin: ${coinName}`);
  } else {
    logger.info(`✅ Found wallet for ${coinName}: ${wallet.id}, Balance: ${wallet.balance}`);
  }
  return wallet ?? null;
}

/**
 * Handle balance updates when a trade is executed (partially or fully filled)
 */
export async function handleTradeExecution(
  userId: string,
  pairName: string,
  side: "Buy" | "Sell",
  tradeAmount: number,
  tradePrice: number,
  tradeId?: string // Optional for idempotency
) {
  logger.info(`🔥 handleTradeExecution: User=${userId}, Pair=${pairName}, Side=${side}, Qty=${tradeAmount}, Price=${tradePrice}, TradeId=${tradeId || 'N/A'}`);
  try {
    // 0. Ensure table exists (Self-healing)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS trade_settlements (
        trade_id VARCHAR(255) PRIMARY KEY,
        order_id VARCHAR(255),
        created_at DATETIME NOT NULL
      )
    `);

    // 1. Idempotency Check
    if (tradeId) {
      const [existing]: any[] = await sequelize.query(
        "SELECT trade_id FROM trade_settlements WHERE trade_id = :tradeId LIMIT 1",
        { replacements: { tradeId }, type: QueryTypes.SELECT }
      );
      if (existing) {
        logger.info(`⏭️ Trade ${tradeId} already settled. Skipping.`);
        return;
      }
    }

    const baseCoin = pairName.replace("USDT", "");
    const quoteCoin = "USDT";

    const baseWallet = await getUserWallet(userId, baseCoin);
    const quoteWallet = await getUserWallet(userId, quoteCoin);

    if (!baseWallet || !quoteWallet) {
      logger.error(`❌ Wallets not found for settlement: User ${userId}, Pair ${pairName}`);
      return;
    }

    const normalizedSide = side.toLowerCase() === "buy" ? "Buy" : "Sell";
    logger.info(`⚖️ Settling ${normalizedSide} order...`);

    if (normalizedSide === "Buy") {
      // 1. Deduct from locked quote balance (USDT)
      const cost = tradeAmount * tradePrice;
      logger.info(`💰 Deducting ${cost} USDT from locked balance of wallet ${quoteWallet.id}`);
      await UserWallet.update(
        {
          lockedBalance: UserWallet.sequelize!.literal(`lockedBalance - ${cost}`),
        },
        { where: { id: quoteWallet.id } }
      );

      // 2. Add to base balance (BTC/ETH etc)
      logger.info(`💰 Adding ${tradeAmount} ${baseCoin} to available balance of wallet ${baseWallet.id}`);
      await UserWallet.update(
        {
          balance: UserWallet.sequelize!.literal(`balance + ${tradeAmount}`),
        },
        { where: { id: baseWallet.id } }
      );
    } else {
      // side === "Sell" or "SELL"
      // 1. Deduct from locked base balance (BTC/ETH etc)
      logger.info(`💰 Deducting ${tradeAmount} ${baseCoin} from locked balance of wallet ${baseWallet.id}`);
      await UserWallet.update(
        {
          lockedBalance: UserWallet.sequelize!.literal(`lockedBalance - ${tradeAmount}`),
        },
        { where: { id: baseWallet.id } }
      );

      // 2. Add to quote balance (USDT)
      const proceeds = tradeAmount * tradePrice;
      logger.info(`💰 Adding ${proceeds} USDT to available balance of wallet ${quoteWallet.id}`);
      await UserWallet.update(
        {
          balance: UserWallet.sequelize!.literal(`balance + ${proceeds}`),
        },
        { where: { id: quoteWallet.id } }
      );
    }

    // 3. Mark as settled
    if (tradeId) {
      await sequelize.query(
        "INSERT INTO trade_settlements (trade_id, created_at) VALUES (:tradeId, :now)",
        { replacements: { tradeId, now: new Date() }, type: QueryTypes.INSERT }
      );
    }

    logger.info(`✅ Wallet successfully settled: User ${userId}, ${side} ${tradeAmount} ${baseCoin} @ ${tradePrice}`);
  } catch (error) {
    logger.error("❌ WALLET_SETTLEMENT_ERROR", error);
  }
}

/**
 * Handle balance refunds when an order is cancelled or expires
 */
export async function handleOrderRefund(
  userId: string,
  pairName: string,
  side: "Buy" | "Sell",
  remainingAmount: number,
  originalPrice: number
) {
  logger.info(`🔄 handleOrderRefund: User=${userId}, Pair=${pairName}, Side=${side}, Qty=${remainingAmount}, Price=${originalPrice}`);
  try {
    const baseCoin = pairName.replace("USDT", "");
    const quoteCoin = "USDT";

    const normalizedSide = (side as string).toLowerCase() === "buy" ? "Buy" : "Sell";
    const refundCoin = normalizedSide === "Buy" ? quoteCoin : baseCoin;
    const refundAmount = normalizedSide === "Buy" ? remainingAmount * originalPrice : remainingAmount;

    const wallet = await getUserWallet(userId, refundCoin);
    if (!wallet) {
      logger.error(`❌ Wallet not found for refund: User ${userId}, Coin ${refundCoin}`);
      return;
    }

    logger.info(`💰 Refunding ${refundAmount} ${refundCoin} to wallet ${wallet.id}`);
    await UserWallet.update(
      {
        balance: UserWallet.sequelize!.literal(`balance + ${refundAmount}`),
        lockedBalance: UserWallet.sequelize!.literal(`lockedBalance - ${refundAmount}`),
      },
      { where: { id: wallet.id } }
    );

    logger.info(`✅ Wallet successfully refunded: User ${userId}, Refund ${refundAmount} ${refundCoin}`);
  } catch (error) {
    logger.error("❌ WALLET_REFUND_ERROR", error);
  }
}
