import express, { Router } from "express";
import * as walletController from "./wallet/wallet.controller";
import { authenticate } from "../middleware/auth.middleware";

interface Route {
  router: Router;
}

class WalletRouter implements Route {
  public router = Router();
  private basePath = "/v1/wallet";

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * /v1/wallet/health:
     *   get:
     *     summary: Health check for Wallet service
     *     tags: [Wallet]
     *     responses:
     *       200:
     *         description: Service is operational
     */
    this.router.get(
      "/health",
      walletController.healthCheck
    );

    /**
     * @swagger
     * /v1/wallet/balance:
     *   get:
     *     summary: Get user wallet balance
     *     tags: [Wallet]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Balance retrieved
     */
    this.router.get(
      "/balance",
      authenticate,
      walletController.getBalance
    );

    /**
     * @swagger
     * /v1/wallet/balances:
     *   get:
     *     summary: Get all user wallet balances
     *     tags: [Wallet]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Balances retrieved
     */
    this.router.get(
      "/balances",
      authenticate,
      walletController.getBalances
    );

    /**
     * @swagger
     * /v1/wallet/generate:
     *   post:
     *     summary: Generate a new user wallet address
     *     tags: [Wallet]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Wallet address generated
     *       500:
     *         description: Wallet generation failed
     */
    this.router.post(
      "/generate",
      authenticate,
      walletController.generateWalletAddress
    );
  }
}

export default WalletRouter;
