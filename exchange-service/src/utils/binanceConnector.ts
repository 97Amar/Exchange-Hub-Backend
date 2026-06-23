const Binance =
  require("binance-api-node").default || require("binance-api-node");
import logger from "./logger";
import { getPairInBinanceFormat } from "../helpers/binance.helper";

/**
 * Listen keys from REST must be consumed on the matching WebSocket host.
 * Demo Mode REST (`demo-api.binance.com`) requires Demo stream URLs — not
 * `testnet.binance.vision`. See:
 * https://developers.binance.com/docs/binance-spot-api-docs/demo-mode/general-info
 */
function defaultWsEndpointsForHttpBase(httpBase: string): {
  wsBase: string;
  wsApi: string;
} {
  const h = (httpBase || "").toLowerCase();
  if (h.includes("demo-api.binance.com")) {
    return {
      wsBase: "wss://demo-stream.binance.com/ws",
      wsApi: "wss://demo-ws-api.binance.com/ws-api/v3",
    };
  }
  return {
    wsBase: "wss://testnet.binance.vision/ws",
    wsApi: "wss://testnet.binance.vision/ws-api/v3",
  };
}


export class BinanceConnector {
  private BINANCE_API_KEY: string = process.env.BINANCE_API_KEY || "";
  private BINANCE_API_SECRET_KEY: string = process.env.BINANCE_SECRET_KEY || "";
  private client: any;
  private timeOffset: number = 0;
  private syncPromise: Promise<void> | null = null;

  constructor() {
    this.client = this.createBinanceConnection();
    console.log("this.client", this.client);
    this.syncPromise = this.syncServerTime();
  }

  private async ensureSynced() {
    if (this.syncPromise) {
      await this.syncPromise.catch((e) => {
        logger.error("Sync promise rejected, proceeding anyway", e);
      });
    }
  }

  private async syncServerTime() {
    try {
      const axios = require("axios");
      const httpBase = process.env.account === "testnet" 
        ? (process.env.HTTP_BASE || "https://testnet.binance.vision") 
        : "https://api.binance.com";
      
      const { data } = await axios.get(`${httpBase}/api/v3/time`);
      this.timeOffset = data.serverTime - Date.now();
      logger.info(`✅ Binance server time synced. Offset: ${this.timeOffset}ms`);
    } catch (e) {
      logger.error("Failed to sync Binance time", e);
    }
  }

  private createBinanceConnection(): any {
    try {
      const options: any = {
        apiKey: this.BINANCE_API_KEY,
        apiSecret: this.BINANCE_API_SECRET_KEY,
        getTime: () => Date.now() + this.timeOffset,
        recvWindow: 60000,
      };

      if (process.env.account === "testnet") {
        const httpBase =
          process.env.HTTP_BASE || "https://testnet.binance.vision";
        const defaults = defaultWsEndpointsForHttpBase(httpBase);
        console.log("Connecting to Binance (testnet account flag) via binance-api-node", {
          httpBase,
          wsBase: process.env.WS_BASE || defaults.wsBase,
          wsApi: process.env.WS_API || defaults.wsApi,
        });
        return Binance({
          ...options,
          httpBase,
          wsBase: process.env.WS_BASE || defaults.wsBase,
          wsApi: process.env.WS_API || defaults.wsApi,
        });
      } else {
        console.log("Connecting to Binance Mainnet using binance-api-node");
        return Binance(options);
      }
    } catch (error) {
      logger.error("Error in createBinanceConnection", { error });
      throw error;
    }
  }

  public getClient(): any {
    return this.client;
  }

  public async getAccountInfo() {
    await this.ensureSynced();
    return await this.client.accountInfo();
  }

  public async submitOrder(params: {
    symbol: string;
    side: "BUY" | "SELL";
    type: "LIMIT" | "MARKET";
    quantity: string;
    price?: string;
    timeInForce?: string;
  }) {
    const orderParams: any = {
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      quantity: params.quantity,
    };

    if (params.type === "LIMIT") {
      orderParams.price = params.price;
      orderParams.timeInForce = params.timeInForce || "GTC";
    }

    await this.ensureSynced();
    return await this.client.order(orderParams);
  }

  public async cancelOrder(symbol: string, orderId: number) {
    await this.ensureSynced();
    return await this.client.cancelOrder({
      symbol,
      orderId,
    });
  }

  public async getOrder(symbol: string, orderId: number) {
    await this.ensureSynced();
    return await this.client.getOrder({
      symbol,
      orderId,
    });
  }

  public async getMyTrades(symbol: string) {
    await this.ensureSynced();
    return await this.client.myTrades({
      symbol,
    });
  }

  public async openOrders(symbol?: string) {
    await this.ensureSynced();
    return await this.client.openOrders(symbol ? { symbol } : {});
  }

  public async getExchangeInfo(pair: string) {
    // const binancePair = getPairInBinanceFormat(pair);
    await this.ensureSynced();
    let exchangeData: any = await this.client.exchangeInfo({
      symbol: pair,
    });
    exchangeData = exchangeData.symbols[0];

    return exchangeData;
  }
}

export const binanceConnector = new BinanceConnector();
