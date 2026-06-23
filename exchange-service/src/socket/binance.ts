import WebSocket from "ws";

// Binance Spot public WebSocket combined stream URL
const BINANCE_WS_BASE = "wss://stream.testnet.binance.vision/stream?streams=";
// const BINANCE_WS_BASE = "wss://stream.binance.com:9443/stream?streams=";

/**
 * BinanceWS — subscribes to Binance public order-book (depth) and trade streams.
 *
 * Binance stream naming convention:
 *  - Depth (order book): <symbol>@depth<levels>   e.g. btcusdt@depth20
 *  - Trade:              <symbol>@trade            e.g. btcusdt@trade
 *
 * Unlike Bybit, Binance sends full snapshots at each depth interval, so
 * there is no need for a local in-memory merge.
 */
export class BinanceWS {
  private ws: WebSocket | null = null;
  private onDataCallback: (data: any) => void;
  private subscriptions: Set<string> = new Set(); // raw stream names
  private reconnecting = false;

  constructor(onData: (data: any) => void) {
    this.onDataCallback = onData;
  }

  // ─── Connect ─────────────────────────────────────────────────────────────
  private buildUrl(): string {
    return `${BINANCE_WS_BASE}${[...this.subscriptions].join("/")}`;
  }

  public connect(streams?: string[]) {
    if (streams) streams.forEach((s) => this.subscriptions.add(s));

    if (this.subscriptions.size === 0) {
      console.log("⏳ No streams to subscribe; delaying Binance WS connection");
      return;
    }

    const url = this.buildUrl();
    this.ws = new WebSocket(url);

    this.ws.on("open", () => {
      console.log("✅ Connected to Binance Public WebSocket");
    });

    this.ws.on("message", (raw) => {
      try {
        const envelope = JSON.parse(raw.toString()) as {
          stream: string;
          data: any;
        };
        this.handleMessage(envelope.stream, envelope.data);
      } catch (e) {
        console.error("Binance WS parse error:", e);
      }
    });

    this.ws.on("error", (err) => {
      console.error("❌ Binance WS Error:", err);
    });

    this.ws.on("close", () => {
      if (!this.reconnecting) {
        console.log("⚠️ Binance WS Connection closed, retrying in 5s…");
        this.reconnecting = true;
        setTimeout(() => {
          this.reconnecting = false;
          this.connect();
        }, 5000);
      }
    });
  }

  // ─── Message handling ────────────────────────────────────────────────────
  private handleMessage(stream: string, data: any) {
    if (!stream) return;
    if (stream.endsWith("@depth20") || stream.includes("@depth")) {
      this.handleDepthMessage(stream, data);
    } else if (stream.endsWith("@trade")) {
      this.handleTradeMessage(stream, data);
    } else if (stream.includes("@kline_")) {
      this.handleKlineMessage(stream, data);
    } else if (stream.endsWith("@ticker")) {
      this.handleTickerMessage(stream, data);
    } else if (stream.endsWith("@bookTicker")) {
      this.handleBookTickerMessage(stream, data);
    }
  }

  /**
   * Binance @depth20 payload:
   * { lastUpdateId, bids: [[price, qty], ...], asks: [[price, qty], ...] }
   */
  private handleDepthMessage(stream: string, data: any) {
    // stream format: "btcusdt@depth20"  → symbol = "BTCUSDT"
    const symbol = stream.split("@")[0].toUpperCase();

    this.onDataCallback({
      exchange: "BINANCE",
      type: "depthUpdate", // Use Binance socket event name
      symbol,
      data: {
        bids: data.bids ?? [], // [[price, qty]]
        asks: data.asks ?? [], // [[price, qty]]
        lastUpdateId: data.lastUpdateId,
      },
    });
  }

  /**
   * Binance @trade payload:
   * { e, E, s, t, p, q, T, m, M }
   *  e = event type, s = symbol, p = price, q = quantity,
   *  m = buyer is market maker (true = SELL, false = BUY), T = trade time
   */
  private handleTradeMessage(stream: string, data: any) {
    const symbol = (data.s as string) || stream.split("@")[0].toUpperCase();

    this.onDataCallback({
      exchange: "BINANCE",
      type: data.e || "trade", // Use Binance socket event name (e field)
      symbol,
      data: {
        price: data.p,
        quantity: data.q,
        side: data.m ? "Sell" : "Buy", // m = true means seller was market maker
        tradeId: data.t,
        tradeTime: data.T,
      },
    });
  }

  /**
   * Binance @kline_<interval> payload:
   * { e, E, s, k: { t, T, o, h, l, c, v, x, ... } }
   *  t = kline open time, T = kline close time
   *  o/h/l/c = OHLC prices (strings), v = volume, x = is this kline closed?
   */
  private handleKlineMessage(stream: string, data: any) {
    const symbol = (data.s as string) || stream.split("@")[0].toUpperCase();
    const k = data.k;
    if (!k) return;

    this.onDataCallback({
      exchange: "BINANCE",
      type: "kline",
      symbol,
      data: {
        openTime: k.t,
        open: k.o,
        high: k.h,
        low: k.l,
        close: k.c,
        volume: k.v,
        closeTime: k.T,
        isClosed: k.x,
        interval: k.i,
      },
    });
  }

  /**
   * Binance @ticker payload:
   * 24hr rolling window ticker statistics
   */
  private handleTickerMessage(stream: string, data: any) {
    const symbol = (data.s as string) || stream.split("@")[0].toUpperCase();
    this.onDataCallback({
      exchange: "BINANCE",
      type: "24hrTicker",
      symbol,
      data: {
        symbol: data.s,
        lastPrice: data.c,
        highPrice24h: data.h,
        lowPrice24h: data.l,
        volume24h: data.v,
        prevPrice24h: data.o,
        price24hPcnt: data.P,
      },
    });
  }

  /**
   * Binance @bookTicker payload:
   * Best bid/ask price and quantity
   */
  private handleBookTickerMessage(stream: string, data: any) {
    const symbol = (data.s as string) || stream.split("@")[0].toUpperCase();
    this.onDataCallback({
      exchange: "BINANCE",
      type: "bookTicker",
      symbol,
      data: {
        symbol: data.s,
        bestBid: data.b,
        bestBidQty: data.B,
        bestAsk: data.a,
        bestAskQty: data.A,
      },
    });
  }

  // ─── Subscribe / Unsubscribe ─────────────────────────────────────────────
  /**
   * Subscribe to order-book and trade streams for a given symbol.
   * Symbol should be in the format BTCUSDT (upper or lower case).
   */
  public subscribe(symbol: string, interval = "1m") {
    const sym = symbol.toLowerCase();
    const depthStream = `${sym}@depth20@100ms`;
    const tradeStream = `${sym}@trade`;
    const klineStream = `${sym}@kline_${interval}`;
    const tickerStream = `${sym}@ticker`;
    const bookTickerStream = `${sym}@bookTicker`;

    const newStreams = [
      depthStream,
      tradeStream,
      klineStream,
      tickerStream,
      bookTickerStream,
    ];
    let needsSubscription = false;

    newStreams.forEach((s) => {
      if (!this.subscriptions.has(s)) {
        this.subscriptions.add(s);
        needsSubscription = true;
      }
    });

    if (!needsSubscription) return; // already subscribed to all

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const subscribeMsg = {
        method: "SUBSCRIBE",
        params: newStreams,
        id: Date.now(),
      };
      this.ws.send(JSON.stringify(subscribeMsg));
      console.log(
        `📡 Binance subscribed to ${symbol} (depth + trade + kline_${interval} + ticker + bookTicker)`,
      );
    } else if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      console.log(
        `⏳ Binance WS is connecting; ${symbol} will be included in the initial batch`,
      );
      // No need to do anything else, buildUrl() will include these new streams
      // when the WebSocket actually starts the connection process if it hasn't yet,
      // or if it HAS started, it might be too late for the URL but the 'open' event
      // doesn't currently handle missed subscriptions.
      // However, if it's CONNECTING, it means it started with the streams that were in this.subscriptions
      // at that time.
    } else {
      // No active connection or it's closed/closing — start a new one
      console.log(`🚀 Starting new Binance WS connection for ${symbol}`);
      this.ws?.terminate();
      this.connect();
    }
  }

  public unsubscribe(symbol: string, interval = "1m") {
    const sym = symbol.toLowerCase();
    const depthStream = `${sym}@depth20@100ms`;
    const tradeStream = `${sym}@trade`;
    const klineStream = `${sym}@kline_${interval}`;

    this.subscriptions.delete(depthStream);
    this.subscriptions.delete(tradeStream);
    this.subscriptions.delete(klineStream);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const unsubscribeMsg = {
        method: "UNSUBSCRIBE",
        params: [depthStream, tradeStream, klineStream],
        id: Date.now(),
      };
      this.ws.send(JSON.stringify(unsubscribeMsg));
      console.log(
        `🔕 Binance unsubscribed from ${symbol} (depth + trade + kline_${interval})`,
      );
    }
  }
}
