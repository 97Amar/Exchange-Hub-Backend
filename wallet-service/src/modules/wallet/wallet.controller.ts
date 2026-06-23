import { Response } from "express";
import { ethService } from "../../services/eth.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { UserWallet, Coin } from "../../../models";

export const healthCheck = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    status: 200,
    message: "Wallet service is healthy",
  });
};

export const getBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    status: 200,
    message: "User wallet balance retrieved successfully",
    data: {
      balance: 0,
      currency: "usd"
    }
  });
};

export const getBalances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 401, message: "Unauthorized" });
      return;
    }

    const wallets = await UserWallet.findAll({
      where: { userId },
      include: [
        {
          model: Coin,
          as: "coin",
          attributes: ["name", "type"]
        }
      ]
    });

    res.status(200).json({
      status: 200,
      message: "Balances retrieved successfully",
      data: wallets
    });
  } catch (error) {
    console.error("GET_BALANCES_ERROR", error);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
};

export const generateWalletAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id; // Check both common patterns
    
    if (!userId) {
       res.status(401).json({
        status: 401,
        message: "User ID not found in token",
      });
      return;
    }

    // Check if ETH wallet already exists for this user (as a proxy for 'has wallets')
    // We can also check by just finding any wallet for this user
    const existingWallet = await UserWallet.findOne({
      where: { userId }
    });

    if (existingWallet) {
      res.status(200).json({
        status: 200,
        message: "Wallets already exist for this user",
        data: existingWallet
      });
      return;
    }


    const wallet = ethService.generateWallet();
    
    // Find coin records for ETH, BTC, and USDT
    const [ethCoin, btcCoin, usdtCoin] = await Promise.all([
      Coin.findOne({ where: { name: "ETH" } }),
      Coin.findOne({ where: { name: "BTC" } }),
      Coin.findOne({ where: { name: "USDT" } })
    ]);

    if (!ethCoin || !btcCoin || !usdtCoin) {
      res.status(404).json({
        status: 404,
        message: "Required coins (ETH, BTC, or USDT) not found in database",
      });
      return;
    }

    // Store in DB for ETH, BTC, and USDT
    console.log("DEBUG: Storing wallets for userId:", userId);
    const [storedEthWallet, storedBtcWallet, storedUsdtWallet] = await Promise.all([
      UserWallet.create({
        userId,
        address: wallet.address,
        coinId: ethCoin.id,
        balance: 1,
        lockedBalance: 0
      }),
      UserWallet.create({
        userId,
        address: wallet.address,
        coinId: btcCoin.id,
        balance: 1,
        lockedBalance: 0
      }),
      UserWallet.create({
        userId,
        address: wallet.address,
        coinId: usdtCoin.id,
        balance: 10000,
        lockedBalance: 0
      })
    ]);

    console.log("DEBUG: Stored wallets in DB for ETH, BTC, and USDT");

    res.status(200).json({
      status: 200,
      message: "Wallets generated and stored successfully for ETH, BTC, and USDT",
      data: storedEthWallet
    });
  } catch (error) {
    console.error("GENERATE_WALLET_ERROR", error);
    res.status(500).json({
      status: 500,
      message: "An error occurred while generating wallet",
    });
  }
};
