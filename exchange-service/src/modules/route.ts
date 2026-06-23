import express, { Router } from "express";
import * as bybitController from "./bybit/bybit.controller";
import * as binanceController from "./binance/binance.controller";

import { authenticate } from "../middleware/auth.middleware";

interface Route {
  router: Router;
}

class BybitRouter implements Route {
  public router = Router();
  private basePath = "/v1/bybit";

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * /v1/bybit/health:
     *   get:
     *     summary: Health check for Bybit service
     *     tags: [Bybit]
     *     responses:
     *       200:
     *         description: Service is operational
     */
    this.router.get(
      "/health",
      bybitController.healthCheck
    );

    /**
     * @swagger
     * /v1/bybit/place-order:
     *   post:
     *     summary: Place a new marketplace order
     *     tags: [Bybit]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               symbol:
     *                 type: string
     *               amount:
     *                 type: number
     *               price:
     *                 type: number
     *     responses:
     *       200:
     *         description: Order placed successfully
     */
    this.router.get(
      "/order-history",
      authenticate,
      bybitController.getOrderHistory
    );

    this.router.post(
      "/place-order",
      authenticate,
      bybitController.placeOrder
    );

    /**
     * @swagger
     * /v1/bybit/cancel-order/{orderId}:
     *   delete:
     *     summary: Cancel an existing order
     *     tags: [Bybit]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orderId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Order cancelled successfully
     */
    this.router.delete(
      "/cancel-order/:orderId",
      authenticate,
      bybitController.cancelOrder
    );
  }
}

class BinanceRouter implements Route {
  public router = Router();
  private basePath = "/v1/binance";

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * /v1/binance/health:
     *   get:
     *     summary: Health check for Binance service
     *     tags: [Binance]
     *     responses:
     *       200:
     *         description: Service is operational
     */
    this.router.get("/health", binanceController.healthCheck);

    /**
     * @swagger
     * /v1/binance/order-history:
     *   get:
     *     summary: Get Binance order history
     *     tags: [Binance]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Order history fetched successfully
     */
    this.router.get(
      "/order-history",
      authenticate,
      binanceController.getOrderHistory
    );

    /**
     * @swagger
     * /v1/binance/trade-history:
     *   get:
     *     summary: Get Binance trade history
     *     tags: [Binance]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Trade history fetched successfully
     */
    this.router.get(
      "/trade-history",
      authenticate,
      binanceController.getTradeHistory
    );

    /**
     * @swagger
     * /v1/binance/open-orders:
     *   get:
     *     summary: Get Binance open orders
     *     tags: [Binance]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Open orders fetched successfully
     */
    this.router.get(
      "/open-orders",
      authenticate,
      binanceController.getOpenOrders
    );

    /**
     * @swagger
     * /v1/binance/place-order:
     *   post:
     *     summary: Place a new Binance order
     *     tags: [Binance]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               pair_name:
     *                 type: string
     *               qty:
     *                 type: number
     *               price:
     *                 type: number
     *               side:
     *                 type: string
     *               type:
     *                 type: string
     *     responses:
     *       200:
     *         description: Order placed successfully
     */
    this.router.post("/place-order", authenticate, binanceController.placeOrder);

    /**
     * @swagger
     * /v1/binance/cancel-order/{orderId}:
     *   delete:
     *     summary: Cancel an existing Binance order
     *     tags: [Binance]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orderId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Order cancelled successfully
     */
    this.router.delete(
      "/cancel-order/:orderId",
      authenticate,
      binanceController.cancelOrder
    );
  }
}

export { BybitRouter, BinanceRouter };
