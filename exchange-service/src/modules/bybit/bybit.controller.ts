import { Request, Response } from "express";
import Bybit from "../../../models/bybit";
import { AuthRequest } from "../../middleware/auth.middleware";
import { ERROR_MESSAGES } from "../../constants/messages";
import { restClient } from "../../utils/bybitClient";
import { Op } from "sequelize";
import UserWallet from "../../models/userWallet";
import { KafkaProducer } from "../../kafka/producer";
import { INTERNAL_KAFKA_EVENTS } from "../../constants/socketEvents";
import { handleOrderRefund, handleTradeExecution } from "../../helpers/walletSettlement";

// ───────────────────────────────────────────────────────────────────
// Helper: find a user's wallet for a given coin name
// ───────────────────────────────────────────────────────────────────
async function getUserWallet(userId: string, coinName: string) {
  // The wallet-service DB stores the coin name joined via coinId/coins table.
  // We re-use walletDb (connected to wallet_db) through the UserWallet model.
  // We query through a raw join so we can filter by coin name without a Coins model.
  const { walletDb } = require("../../database/walletDb");
  const { QueryTypes } = require("sequelize");

  const [wallet]: any[] = await walletDb.query(
    `SELECT w.id, w.userId, w.balance, w.lockedBalance
       FROM user_wallets w
       JOIN coins c ON w.coinId = c.id
      WHERE w.userId = :userId AND c.name = :coinName
      LIMIT 1`,
    { replacements: { userId, coinName }, type: QueryTypes.SELECT }
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
      message: "Exchange service is running 🚀",
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
        message: "Pair name, quantity, and price (for Limit orders) are required",
      });
    }

    const orderSide = side === "Buy" ? "Buy" : "Sell";
    const orderType = type === "Limit" ? "Limit" : "Market";

    // 1. Determine coin and amount to lock
    const baseCoin = pair_name.replace("USDT", "");
    const quoteCoin = "USDT";

    let requiredCoinName = "";
    let requiredAmount = 0;

    if (orderSide === "Buy") {
      requiredCoinName = quoteCoin;
      requiredAmount =
        orderType === "Limit" ? Number(price) * Number(qty) : Number(qty);
    } else {
      requiredCoinName = baseCoin;
      requiredAmount = Number(qty);
    }

    // 2. Find wallet using join helper (coin name lookup)
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

    // 3. Lock balance using Sequelize model methods (atomic decrement/increment)
    await UserWallet.update(
      {
        balance: UserWallet.sequelize!.literal(`balance - ${requiredAmount}`),
        lockedBalance: UserWallet.sequelize!.literal(`lockedBalance + ${requiredAmount}`),
      },
      { where: { id: walletRow.id } }
    );

    // 4. Submit to exchange (Bybit)
    let exchangeResponse: any;
    try {
      exchangeResponse = await restClient.submitOrder({
        category: "spot",
        symbol: pair_name,
        side: orderSide,
        orderType: orderType,
        qty: qty.toString(),
        price: orderType === "Limit" ? price.toString() : undefined,
      });

      console.log("exchangeResponse", exchangeResponse);
      if (exchangeResponse.retCode !== 0) {
        throw new Error(exchangeResponse.retMsg || "Exchange order placement failed");
      }
    } catch (err: any) {
      // Revert balance on failure using Sequelize model methods
      await UserWallet.update(
        {
          balance: UserWallet.sequelize!.literal(`balance + ${requiredAmount}`),
          lockedBalance: UserWallet.sequelize!.literal(`lockedBalance - ${requiredAmount}`),
        },
        { where: { id: walletRow.id } }
      );

      return res.status(400).json({
        status: 400,
        message: err.message,
      });
    }

    const exchangeOrderId = exchangeResponse.result.orderId;

    // 5. Save to Local DB
    const order = await Bybit.create({
      pair_name,
      side: orderSide,
      type: orderType,
      qty,
      price: price || 0,
      executed_price: 0,
      filled_qty: 0,
      user_id: userId,
      status: "New",
      bybit_order_id: exchangeOrderId,
    });

    res.status(200).json({
      status: 200,
      message: "Order placed successfully",
      data: {
        ...order.toJSON(),
        symbol: order.pair_name,
        amount: order.qty,
        status: order.status,
        exchange_order_id: order.bybit_order_id,
      },
    });

    // Emit open-order update so the UI reflects the new order immediately,
    // before the private WebSocket stream delivers the exchange confirmation.
    try {
      const payload = {
        id: order.id,
        orderId: order.bybit_order_id,
        exchange_order_id: order.bybit_order_id,
        status: "New",
        symbol: order.pair_name,
        side: order.side,
        pair_name: order.pair_name,
        type: order.type,
        amount: order.qty,
        price: order.price,
        filled_qty: 0,
        created_at: order.created_at || new Date().toISOString(),
      };

      const userRoom = `user_${userId}`;
      KafkaProducer.send(
        "EXCHANGE_USER_DATA",
        INTERNAL_KAFKA_EVENTS.BYBIT_OPEN_ORDERS,
        userRoom,
        payload,
      );
    } catch (err) {
      console.error("FAILED TO EMIT BYBIT PLACE_ORDER SOCKET EVENT:", err);
    }
  } catch (error) {
    console.error("PLACE_ORDER_ERROR", error);
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

    const order = await Bybit.findOne({
      where: { id: orderId, user_id: req.user.id },
    });

    if (!order) {
      return res.status(404).json({
        status: 404,
        message: "Order not found",
      });
    }

    if (!order.bybit_order_id) {
      return res.status(400).json({
        status: 400,
        message: "Order has no exchange reference",
      });
    }

    // 1. Cancel on exchange (Bybit)
    const exchangeResponse = await restClient.cancelOrder({
      category: "spot",
      symbol: order.pair_name,
      orderId: order.bybit_order_id,
    });

    if (
      exchangeResponse.retCode !== 0 &&
      exchangeResponse.retMsg !== "Order already cancelled"
    ) {
      return res.status(400).json({
        status: 400,
        message: exchangeResponse.retMsg || "Exchange order cancellation failed",
      });
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
    order.status = "Cancelled";
    await order.save();

    res.status(200).json({
      status: 200,
      message: "Order cancelled successfully",
      data: order,
    });

    // Emit order history update so the UI moves the order to history
    // without waiting for the private WebSocket stream confirmation.
    try {
      const payload = {
        id: order.id,
        orderId: order.bybit_order_id,
        exchange_order_id: order.bybit_order_id,
        status: "Cancelled",
        symbol: order.pair_name,
        side: order.side,
        pair_name: order.pair_name,
        type: order.type,
        amount: order.qty,
        price: order.price,
        filled_qty: order.filled_qty || 0,
        created_at: order.created_at,
      };

      const userRoom = `user_${req.user.id}`;
      KafkaProducer.send(
        "EXCHANGE_USER_DATA",
        INTERNAL_KAFKA_EVENTS.BYBIT_ORDER_HISTORY,
        userRoom,
        payload,
      );
    } catch (err) {
      console.error("FAILED TO EMIT BYBIT CANCEL_ORDER SOCKET EVENT:", err);
    }
  } catch (error) {
    console.error("CANCEL_ORDER_ERROR", error);
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
    const { pair_name, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = { user_id: req.user.id };
    if (pair_name) where.pair_name = pair_name;
    if (status) where.status = status;

    const { count, rows } = await Bybit.findAndCountAll({
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
      exchange_order_id: order.bybit_order_id,
    }));

    res.status(200).json({
      status: 200,
      message: "Order history fetched successfully",
      data: {
        orders,
        total: count,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("GET_ORDER_HISTORY_ERROR", error);
    res.status(500).json({
      status: 500,
      message: ERROR_MESSAGES.SOMETHING_WENT_WRONG,
    });
  }
};
