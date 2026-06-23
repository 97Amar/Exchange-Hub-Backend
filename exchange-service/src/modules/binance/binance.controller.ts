import { Request, Response } from "express";
import Binance from "../../../models/binance";
import { AuthRequest } from "../../middleware/auth.middleware";
import { ERROR_MESSAGES } from "../../constants/messages";
import { binanceConnector } from "../../utils/binanceConnector";
import UserWallet from "../../models/userWallet";
import logger from "../../utils/logger";
import { Op } from "sequelize";
import { tradeRules } from "../../helpers/binance.helper";
import { ORDER_SIDE } from "../../utils/constants";
import { KafkaProducer } from "../../kafka/producer";
import { handleOrderRefund, handleTradeExecution } from "../../helpers/walletSettlement";

// ───────────────────────────────────────────────────────────────────
// Helper: find a user's wallet for a given coin name
// ───────────────────────────────────────────────────────────────────
async function getUserWallet(userId: string, coinName: string) {
  const { walletDb } = require("../../database/walletDb");
  const { QueryTypes } = require("sequelize");

  const [wallet]: any[] = await walletDb.query(
    `SELECT w.id, w.userId, w.balance, w.lockedBalance
       FROM user_wallets w
       JOIN coins c ON w.coinId = c.id
      WHERE w.userId = :userId AND c.name = :coinName
       LIMIT 1`,
    { replacements: { userId, coinName }, type: QueryTypes.SELECT },
  );
  return wallet ?? null;
}

// ───────────────────────────────────────────────────────────────────
// Health Check Controller
// ───────────────────────────────────────────────────────────────────
export const healthCheck = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      status: "OPERATIONAL",
      service: "exchange-service",
      message: "Binance service is running 🚀",
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Internal Server Error",
    });
  }
};

// ───────────────────────────────────────────────────────────────────
// Place Order Controller
// ───────────────────────────────────────────────────────────────────
export const placeOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { pair_name, qty, price, side, type } = req.body;

    if (!pair_name || !qty || (type === "Limit" && !price)) {
      return res.status(400).json({
        status: 400,
        message:
          "Pair name, quantity, and price (for Limit orders) are required",
      });
    }

    const orderSide = side === "Buy" ? "BUY" : "SELL";
    const orderType = type === "Limit" ? "LIMIT" : "MARKET";

    // 1. Determine coin and amount to lock
    const baseCoin = pair_name.replace("USDT", "");
    const quoteCoin = "USDT";

    let requiredCoinName = "";
    let requiredAmount = 0;

    if (side === "Buy") {
      requiredCoinName = quoteCoin;
      requiredAmount =
        type === "Limit" ? Number(price) * Number(qty) : Number(qty);
    } else {
      requiredCoinName = baseCoin;
      requiredAmount = Number(qty);
    }

    // 2. Find wallet
    const userId = req.user.id;
    const walletRow = await getUserWallet(userId, requiredCoinName);

    if (!walletRow) {
      return res.status(404).json({
        status: 404,
        message: `Wallet not found for ${requiredCoinName}`,
      });
    }

    if (Number(walletRow.balance) < requiredAmount) {
      return res
        .status(400)
        .json({ status: 400, message: "Insufficient balance" });
    }

    // 2.5. Trade Rules Validation
    try {
      const validationResults = await tradeRules(
        Number(price || 0),
        pair_name,
        Number(qty),
        orderType,
        0, // stopPrice
        userId,
        side === "Buy" ? ORDER_SIDE.BUY : ORDER_SIDE.SELL,
      );
      console.log("validationResults", validationResults);
      const failedCheck = validationResults.find((c: any) => !c.checkPassed);
      if (failedCheck) {
        return res.status(400).json({
          status: 400,
          message: failedCheck.message || "Trade rules validation failed",
          filter: failedCheck.filter,
        });
      }
    } catch (err: any) {
      logger.error("TRADE_RULES_VALIDATION_ERROR", err);
      // Optional: continue if tradeRules fails for non-validation reasons,
      // or block it. Usually safer to block.
      return res.status(500).json({
        status: 500,
        message: "Error validating trade rules",
        error: err.message,
      });
    }

    // 3. Lock balance
    await UserWallet.update(
      {
        balance: UserWallet.sequelize!.literal(`balance - ${requiredAmount}`),
        lockedBalance: UserWallet.sequelize!.literal(
          `lockedBalance + ${requiredAmount}`,
        ),
      },
      { where: { id: walletRow.id } },
    );

    // 4. Submit to Binance
    let exchangeResponse: any;
    try {
      exchangeResponse = await binanceConnector.submitOrder({
        symbol: pair_name,
        side: orderSide,
        type: orderType,
        quantity: qty.toString(),
        price: type === "Limit" ? price.toString() : undefined,
      });

      console.log("Binance Order Response:", exchangeResponse);
    } catch (err: any) {
      // Revert balance on failure
      await UserWallet.update(
        {
          balance: UserWallet.sequelize!.literal(`balance + ${requiredAmount}`),
          lockedBalance: UserWallet.sequelize!.literal(
            `lockedBalance - ${requiredAmount}`,
          ),
        },
        { where: { id: walletRow.id } },
      );
      logger.error("BINANCE_ORDER_PLACEMENT_FAILED", err);
      let customMessage = err.message || "Binance order placement failed";

      // Map Binance specific errors to clearer messages
      if (err.message?.includes("PERCENT_PRICE")) {
        customMessage =
          "Order price is too far from the current market price (Binance protection)";
      } else if (err.message?.includes("MIN_NOTIONAL")) {
        customMessage = "Order total value is too small (Minimum ~10 USDT)";
      } else if (err.message?.includes("LOT_SIZE")) {
        customMessage = "Order quantity is invalid or too small for this pair";
      } else if (err.message?.includes("Insufficient balance")) {
        customMessage = "Insufficient balance in your Binance account";
      }

      return res.status(400).json({
        status: 400,
        message: customMessage,
        originalError: err.message,
        code: err.code,
      });
    }

    const exchangeOrderId = exchangeResponse.orderId.toString();

    const order = await Binance.create({
      pair_name,
      side: side === "Buy" ? "Buy" : "Sell",
      type: type === "Limit" ? "Limit" : "Market",
      qty,
      price: price || 0,
      executed_price: exchangeResponse.fills?.length > 0 ? Number(exchangeResponse.fills[0].price) : 0,
      filled_qty: exchangeResponse.executedQty ? Number(exchangeResponse.executedQty) : 0,
      user_id: userId,
      status: exchangeResponse.status || "NEW",
      binance_order_id: exchangeOrderId,
    });

    // --- Settlement for Immediate Fills ---
    if (exchangeResponse.status === "FILLED" || (exchangeResponse.fills && exchangeResponse.fills.length > 0)) {
      for (const fill of exchangeResponse.fills || []) {
        await handleTradeExecution(
          userId,
          pair_name,
          side === "Buy" ? "Buy" : "Sell",
          Number(fill.qty),
          Number(fill.price),
          fill.tradeId.toString()
        );
      }
    }

    res.status(200).json({
      status: 200,
      message: "Order placed successfully",
      data: {
        ...order.toJSON(),
        symbol: order.pair_name,
        amount: order.qty,
        status: exchangeResponse.status || order.status,
        exchange_order_id: order.binance_order_id,
      },
    });

    // --- Emit Socket Event ---
    try {
      const payload = {
        id: order.id,
        orderId: order.binance_order_id,
        exchange_order_id: order.binance_order_id,
        status: exchangeResponse.status || order.status,
        symbol: order.pair_name,
        side: order.side,
        pair_name: order.pair_name,
        type: order.type,
        amount: order.qty,
        price: order.price,
        filled_qty: 0,
        created_at: order.created_at || new Date().toISOString(),
      };

      // Deliver only to the user who placed the order.
      const userRoom = `user_${userId}`;

      // Open Orders: new order appears immediately
      KafkaProducer.send(
        "EXCHANGE_USER_DATA",
        "KAFKA_BINANCE_OPEN_ORDERS",
        userRoom,
        payload
      );

      // Order History: also add immediately as 'pending' so the tab shows it
      KafkaProducer.send(
        "EXCHANGE_USER_DATA",
        "KAFKA_BINANCE_ORDER_HISTORY",
        userRoom,
        payload
      );
    } catch (err) {
      console.error("FAILED TO EMIT PLACE_ORDER SOCKET EVENT:", err);
    }
  } catch (error) {
    console.error("BINANCE_PLACE_ORDER_ERROR", error);
    logger.error("BINANCE_PLACE_ORDER_ERROR", error);
    res.status(500).json({
      status: 500,
      message: ERROR_MESSAGES.SOMETHING_WENT_WRONG,
    });
  }
};

// ───────────────────────────────────────────────────────────────────
// Cancel Order Controller
// ───────────────────────────────────────────────────────────────────
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await Binance.findOne({
      where: { id: orderId, user_id: req.user.id },
    });

    if (!order) {
      return res.status(404).json({
        status: 404,
        message: "Order not found",
      });
    }

    if (!order.binance_order_id) {
      return res.status(400).json({
        status: 400,
        message: "Order has no exchange reference",
      });
    }

    // 1. Cancel on Binance
    try {
      await binanceConnector.cancelOrder(
        order.pair_name,
        Number(order.binance_order_id),
      );
    } catch (err: any) {
      const errMsg = err.message;
      if (errMsg !== "UNKNOWN_ORDER" && !errMsg.includes("already cancelled")) {
        return res.status(400).json({
          status: 400,
          message: errMsg || "Binance order cancellation failed",
          code: err.code,
        });
      }
    }

    // 2. Refund remaining balance
    const remainingQty = Number(order.qty) - (order.filled_qty || 0);
    if (remainingQty > 0) {
      await handleOrderRefund(
        order.user_id,
        order.pair_name,
        order.side as "Buy" | "Sell",
        remainingQty,
        Number(order.price)
      );
    }

    // 3. Update Local DB
    order.status = "CANCELED";
    await order.save();

    res.status(200).json({
      status: 200,
      message: "Order cancelled successfully",
      data: {
        ...order.toJSON(),
        status: "CANCELED"
      },
    });

    // --- Emit Socket Events ---
    try {
      const payload = {
        id: order.id,
        orderId: order.binance_order_id,
        exchange_order_id: order.binance_order_id,
        status: "CANCELED",
        symbol: order.pair_name,
        side: order.side,
        pair_name: order.pair_name,
        type: order.type,
        amount: order.qty,
        price: order.price,
        filled_qty: order.filled_qty || 0,
        created_at: order.created_at,
      };

      // Deliver only to the user who owns the order.
      // Only push to order history — the addOrUpdateOrderHistory reducer
      // automatically removes the entry from openOrders when status is
      // "cancelled", so sending KAFKA_BINANCE_OPEN_ORDERS here would race and
      // add the order back after it has already been removed.
      const userRoom = `user_${req.user.id}`;
      KafkaProducer.send(
        "EXCHANGE_USER_DATA",
        "KAFKA_BINANCE_ORDER_HISTORY",
        userRoom,
        payload
      );
    } catch (err) {
      console.error("FAILED TO EMIT CANCEL_ORDER SOCKET EVENT:", err);
    }
  } catch (error) {
    console.error("BINANCE_CANCEL_ORDER_ERROR", error);
    res.status(500).json({
      status: 500,
      message: ERROR_MESSAGES.SOMETHING_WENT_WRONG,
    });
  }
};

// ───────────────────────────────────────────────────────────────────
// Get Order History Controller
// ───────────────────────────────────────────────────────────────────
export const getOrderHistory = async (req: AuthRequest, res: Response) => {
  try {
    const {
      pair_name,
      status,
      side,
      type,
      startTime,
      endTime,
      page = 1,
      limit = 20,
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = { user_id: req.user.id };
    if (pair_name) where.pair_name = (pair_name as string).replace("/", "");
    if (status) where.status = status;
    if (side) where.side = side;
    if (type) where.type = type;

    if (startTime || endTime) {
      where.created_at = {};
      if (startTime) where.created_at[Op.gte] = new Date(Number(startTime));
      if (endTime) where.created_at[Op.lte] = new Date(Number(endTime));
    }

    const { count, rows } = await Binance.findAndCountAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [["created_at", "DESC"]],
    });

    const orders = rows.map((order: any) => ({
      ...order.toJSON(),
      symbol: order.pair_name,
      amount: order.qty,
      status: order.status,
      exchange_order_id: order.binance_order_id,
    }));

    res.status(200).json({
      status: 200,
      message: "Binance order history fetched successfully",
      data: {
        orders,
        total: count,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("BINANCE_GET_ORDER_HISTORY_ERROR", error);
    res.status(500).json({
      status: 500,
      message: ERROR_MESSAGES.SOMETHING_WENT_WRONG,
    });
  }
};

// ───────────────────────────────────────────────────────────────────
// Get Trade History Controller
// ───────────────────────────────────────────────────────────────────
export const getTradeHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { pair_name, startTime, endTime, limit = 50 } = req.query;

    if (!pair_name) {
      return res.status(400).json({
        status: 400,
        message: "Pair name is required for trade history",
      });
    }

    const params: any = {
      symbol: (pair_name as string).replace("/", ""),
      limit: Number(limit),
    };

    if (startTime) params.startTime = Number(startTime);
    if (endTime) params.endTime = Number(endTime);

    const trades = await binanceConnector.getMyTrades(params.symbol);
    // Note: binance-api-node myTrades doesn't easily support startTime/endTime in the base call if not passed in right structure,
    // but the library supports it if passed as part of the object.
    // Let's re-check binanceConnector... it just passes symbol.

    // Mapping trades to frontend requirements
    const mappedTrades = trades.map((trade: any) => ({
      id: trade.id,
      order_id: trade.orderId,
      pair: pair_name,
      side: trade.isBuyer ? "Buy" : "Sell",
      price: trade.price,
      executed: trade.qty,
      fee: trade.commission,
      fee_asset: trade.commissionAsset,
      role: trade.isMaker ? "Maker" : "Taker",
      total: Number(trade.price) * Number(trade.qty),
      created_at: new Date(trade.time).toISOString(),
    }));

    // Filter by time if params were provided (if library didn't handle it)
    let filteredTrades = mappedTrades;
    if (startTime) {
      filteredTrades = filteredTrades.filter(
        (t: any) => new Date(t.created_at).getTime() >= Number(startTime),
      );
    }
    if (endTime) {
      filteredTrades = filteredTrades.filter(
        (t: any) => new Date(t.created_at).getTime() <= Number(endTime),
      );
    }

    res.status(200).json({
      status: 200,
      message: "Binance trade history fetched successfully",
      data: {
        trades: filteredTrades,
        total: filteredTrades.length,
      },
    });
  } catch (error: any) {
    console.error("BINANCE_GET_TRADE_HISTORY_ERROR", error);
    res.status(500).json({
      status: 500,
      message: error.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG,
    });
  }
};

// ───────────────────────────────────────────────────────────────────
// Get Open Orders Controller
// ───────────────────────────────────────────────────────────────────
export const getOpenOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { pair_name } = req.query;

    const symbol = pair_name
      ? (pair_name as string).replace("/", "")
      : undefined;

    const openOrders = await binanceConnector.openOrders(symbol);

    const mappedOrders = openOrders.map((order: any) => ({
      id: order.orderId.toString(),
      exchange_order_id: order.orderId.toString(),
      symbol: order.symbol,
      side: order.side === "BUY" ? "Buy" : "Sell",
      type: order.type.charAt(0) + order.type.slice(1).toLowerCase(),
      amount: order.origQty,
      price: order.price,
      filled_qty: order.executedQty,
      status: order.status, // On Binance open orders are pending/partial
      total: Number(order.price) * Number(order.origQty),
      created_at: new Date(order.time).toISOString(),
      stopPrice: order.stopPrice,
      icebergQty: order.icebergQty,
      timeInForce: order.timeInForce,
    }));

    res.status(200).json({
      status: 200,
      message: "Binance open orders fetched successfully",
      data: {
        orders: mappedOrders,
        total: mappedOrders.length,
      },
    });
  } catch (error: any) {
    console.error("BINANCE_GET_OPEN_ORDERS_ERROR", error);
    res.status(500).json({
      status: 500,
      message: error.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG,
    });
  }
};
