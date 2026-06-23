/**
 * BINANCE NATIVE EVENTS
 * These names match the 'e' (Event Type) field in the Binance Testnet WebSocket payloads.
 * Use these for Binance-related Kafka events to align with native standards.
 */
export const BINANCE_NATIVE_EVENTS = {
  DEPTH_UPDATE: "depthUpdate",
  TRADE: "trade",
  KLINE: "kline",
  EXECUTION_REPORT: "executionReport",
  OUTBOUND_ACCOUNT_POSITION: "outboundAccountPosition",
  BALANCE_UPDATE: "balanceUpdate",
  LIST_STATUS: "listStatus",
  EVENT_STREAM_TERMINATED: "eventStreamTerminated",
  TICKER: "24hrTicker",
  BOOK_TICKER: "bookTicker",
};

/**
 * INTERNAL KAFKA EVENTS
 * These are custom event names created for our internal pipeline.
 * They are primarily used for Bybit or other services where we define our own schema.
 */
export const INTERNAL_KAFKA_EVENTS = {
  // Market Data (Custom prefixed)
  BYBIT_ORDERBOOK: "BYBIT_ORDERBOOK",
  BYBIT_TRADE: "BYBIT_TRADE",
  BYBIT_TICKER: "BYBIT_TICKER",

  // User Data (Custom)
  // These are delivered to "user_<userId>" private rooms.
  // Kafka consumer strips "KAFKA_" and prepends "WEB_" before emitting to the client.
  BYBIT_OPEN_ORDERS: "KAFKA_BYBIT_OPEN_ORDERS",
  BYBIT_ORDER_STATUS_UPDATE: "KAFKA_BYBIT_ORDER_STATUS_UPDATE",
  BYBIT_ORDER_HISTORY: "KAFKA_BYBIT_ORDER_HISTORY",
  BYBIT_TRADE_HISTORY: "KAFKA_BYBIT_TRADE_HISTORY",
};
