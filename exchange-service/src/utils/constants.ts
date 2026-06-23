export const NOTIFICATION_TYPE = {
  EMAIL: "EMAIL",
  SMS: "SMS",
  WHATSAPP: "WHATSAPP",
};
export const BINANCE_ORDER_TYPE = {
  LIMIT: "LIMIT",
  MARKET: "MARKET",
  STOP_LOSS_LIMIT: "STOP_LOSS_LIMIT",
  TAKE_PROFIT_LIMIT: "TAKE_PROFIT_LIMIT",
};
export const ORDER_STATUS = {
  OPEN: "open",
  CANCELLED: "cancelled",
  MATCHED: "matched",
  PARTIAL: "partial",
  IN_PROGRESS: "in_progress",
  ADMIN_CANCELLED: "admin_cancelled",
};
export const ORDER_SIDE = {
  BUY: 0,
  SELL: 1,
};
export const BINANCE_FILTERS = {
  PRICE_FILTER: "PRICE_FILTER",
  PERCENT_PRICE: "PERCENT_PRICE",
  PERCENT_PRICE_BY_SIDE: "PERCENT_PRICE_BY_SIDE",
  LOT_SIZE: "LOT_SIZE",
  MIN_NOTIONAL: "MIN_NOTIONAL",
  MARKET_LOT_SIZE: "MARKET_LOT_SIZE",
  MAX_NUM_ORDERS: "MAX_NUM_ORDERS",
  MAX_NUM_ALGO_ORDERS: "MAX_NUM_ALGO_ORDERS",
  MAX_NUM_ICEBERG_ORDERS: "MAX_NUM_ICEBERG_ORDERS",
  TRAILING_DELTA: "TRAILING_DELTA",
  NOTIONAL: "NOTIONAL",
};
export const BINANCE_ORDER_ERROR_MSG = {
  PRICE_FILTER_MIN: "Price should be less than {price}",
  PRICE_FILTER_MAX: "Price should be greater than {price}",
  LOT_SIZE_MIN: "Order quantity must be less than {quantity}",
  LOT_SIZE_MAX: "Order quantity must be greater than {quantity}",
  MIN_NOTATIONAL: "Order total must be greater than {total}",
  MIN_NOTATIONAL_MARKET: "Order qty must be greater than {quantity}",
  MARKET_LOT_SIZE_MIN: "Order quantity must be less than {quantity}",
  MARKET_LOT_SIZE_MAX: "Order quantity must be greater than {quantity}",
  MAX_NUM_ORDERS: "You already have maximum no. of open orders",
  MAX_NUM_ALGO_ORDERS: "You already have maximum no. of STOP_LIMIT open orders",
  ORDER_TYPE_NOT_ALLOWED: "Order of {type} not allowed for this pair",
  INSUFFICIENT_BALANCE:
    "Account has insufficient balance for requested action.",
};

export const BINANCE_API_URL = {
  GET_AVERAGE_PRICE: `${process.env.HTTP_BASE}/api/v3/avgPrice?symbol={symbol}`,
};
export const PAIRS = ["BTC_USDT", "ETH_USDT", "ETH_BTC", "LTC_BTC"];
