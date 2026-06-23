import WebSocket from "ws";

const BYBIT_WS_URL = "wss://stream-testnet.bybit.com/v5/public/spot";

export class BybitWS {
  private ws: WebSocket | null = null;
  private onDataCallback: (data: any) => void;
  // State: symbol -> { bids: Map<price, size>, asks: Map<price, size> }
  private orderBooks: Map<string, { 
    bids: Map<string, string>, 
    asks: Map<string, string> 
  }> = new Map();

  constructor(onData: (data: any) => void) {
    this.onDataCallback = onData;
  }

  public connect() {
    this.ws = new WebSocket(BYBIT_WS_URL);

    this.ws.on("open", () => {
      console.log("✅ Connected to Bybit Public WebSocket");
    });

    this.ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      
      const topic = message.topic || "";
      
      if (topic.startsWith("orderbook")) {
        this.handleOrderBookMessage(message);
      } else if (topic.startsWith("publicTrade")) {
        this.handleTradeMessage(message);
      } else if (topic.startsWith("tickers")) {
        this.handleTickerMessage(message);
      } else {
        this.onDataCallback(message);
      }
    });

    this.ws.on("error", (err) => {
      console.error("❌ Bybit WS Error:", err);
    });

    this.ws.on("close", () => {
      console.log("⚠️ Bybit WS Connection closed, retrying...");
      setTimeout(() => this.connect(), 5000);
    });
  }

  private handleOrderBookMessage(msg: any) {
    const symbol = msg.topic.split(".")[2];
    const type = msg.type; // snapshot or delta
    const data = msg.data;

    if (!this.orderBooks.has(symbol)) {
      this.orderBooks.set(symbol, { bids: new Map(), asks: new Map() });
    }

    const book = this.orderBooks.get(symbol)!;

    if (type === "snapshot") {
      book.bids.clear();
      book.asks.clear();
    }

    // Update Bids
    data.b?.forEach(([price, size]: [string, string]) => {
      if (size === "0") book.bids.delete(price);
      else book.bids.set(price, size);
    });

    // Update Asks
    data.a?.forEach(([price, size]: [string, string]) => {
      if (size === "0") book.asks.delete(price);
      else book.asks.set(price, size);
    });

    // Notify callback that state changed
    this.onDataCallback({ topic: msg.topic, symbol, type: "update" });
  }

  private handleTradeMessage(msg: any) {
    // Forward trades directly or with minor transformation
    this.onDataCallback({ 
      topic: msg.topic, 
      symbol: msg.topic.split(".")[1], 
      type: "trade", 
      data: msg.data 
    });
  }

  private handleTickerMessage(msg: any) {
    this.onDataCallback({
      topic: msg.topic,
      symbol: msg.topic.split(".")[1],
      type: "ticker",
      data: msg.data
    });
  }

  public getOrderBook(symbol: string, limit: number = 25) {
    const book = this.orderBooks.get(symbol);
    if (!book) return { b: [], a: [] };

    const sortBids = Array.from(book.bids.entries())
      .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
      .slice(0, limit);

    const sortAsks = Array.from(book.asks.entries())
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .slice(0, limit);

    return {
      b: sortBids,
      a: sortAsks
    };
  }

  public subscribe(symbol: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Subscribe to Orderbook
      const subOrderbook = {
        op: "subscribe",
        args: [`orderbook.50.${symbol}`],
      };
      this.ws.send(JSON.stringify(subOrderbook));

      // Subscribe to Public Trades
      const subTrades = {
        op: "subscribe",
        args: [`publicTrade.${symbol}`],
      };
      this.ws.send(JSON.stringify(subTrades));

      // Subscribe to Tickers
      const subTickers = {
        op: "subscribe",
        args: [`tickers.${symbol}`],
      };
      this.ws.send(JSON.stringify(subTickers));
    }
  }

  public unsubscribe(symbol: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const unsubOrderbook = {
        op: "unsubscribe",
        args: [`orderbook.50.${symbol}`],
      };
      this.ws.send(JSON.stringify(unsubOrderbook));

      const unsubTrades = {
        op: "unsubscribe",
        args: [`publicTrade.${symbol}`],
      };
      this.ws.send(JSON.stringify(unsubTrades));

      const unsubTickers = {
        op: "unsubscribe",
        args: [`tickers.${symbol}`],
      };
      this.ws.send(JSON.stringify(unsubTickers));

      this.orderBooks.delete(symbol);
    }
  }
}
