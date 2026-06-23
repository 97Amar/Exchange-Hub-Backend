import { Binance } from "../../models";
import { RESPONSE_CODES } from "../constants/statusCode";
import { binanceConnector } from "../utils/binanceConnector";
import * as GLOBAL_CONSTANTS from "../utils/constants";
import got from "got";

export const getOpenOrderCount = async (
  userId: string,
  pairName: string,
  type: any = undefined,
) => {
  try {
    type =
      type == undefined || !type
        ? [
            GLOBAL_CONSTANTS.ORDER_STATUS.OPEN,
            GLOBAL_CONSTANTS.ORDER_STATUS.PARTIAL,
            GLOBAL_CONSTANTS.ORDER_STATUS.ADMIN_CANCELLED,
            GLOBAL_CONSTANTS.ORDER_STATUS.CANCELLED,
            GLOBAL_CONSTANTS.ORDER_STATUS.MATCHED,
            GLOBAL_CONSTANTS.ORDER_STATUS.IN_PROGRESS,
          ]
        : [type];
    let openOrder = await Binance.count({
      where: {
        user_id: userId,
        status: [
          GLOBAL_CONSTANTS.ORDER_STATUS.OPEN,
          GLOBAL_CONSTANTS.ORDER_STATUS.PARTIAL,
        ],
        type: type,
        pair_name: pairName,
      },
    });
    return openOrder;
  } catch (error: any) {
    const message = error.message || error;
    console.error("Error in create Order thirdparty service", {
      metadata: { message, error },
    });
    return {
      statusCode: RESPONSE_CODES.BAD_REQUEST,
      message,
      data: {},
    };
  }
};

export const getAveragePrice = async (pairName: string) => {
  const getAveragePriceUrl =
    GLOBAL_CONSTANTS.BINANCE_API_URL.GET_AVERAGE_PRICE.replace(
      "{symbol}",
      pairName,
    );
  const data: any = await got.get(getAveragePriceUrl).json();
  const avgPrice = data.price;
  return avgPrice;
};

export const getPairInBinanceFormat = (pair: string) => {
  const pairInBinanceFormat = pair?.toUpperCase().split("_");
  return { pair: pairInBinanceFormat[0] + pairInBinanceFormat[1] };
};

const getQtyandPricePrecision = (value: any) => {
  let precision = value.split(".")[1];
  precision = precision.indexOf("1") + 1;
  return precision;
};

export const getLtp = async (pair: string) => {
  try {
    // const key =
    //   THIRDPARTY_EXCHANGE_REDIS_KEYS.LTP_PAIR +
    //   pair.toLowerCase().replace("{pair}", pair.toLowerCase());
    // let ltp = await Redis.getString(key);
    // ltp = JSON.parse(ltp);
    // return ltp?.price || 0;
  } catch (error: any) {
    throw new Error(error);
  }
};

const checkExchageInfo = async (pairNames: string) => {
  for (let pair of pairNames) {
    const pairData: any = { pair_name: pair };
    const exchangeData: any = await setExchangeInfo(pair);

    if (exchangeData?.filters?.length) {
      for (let filter of exchangeData.filters) {
        if (filter.filterType == GLOBAL_CONSTANTS.BINANCE_FILTERS.LOT_SIZE) {
          pairData.quantity_precision = getQtyandPricePrecision(
            filter.stepSize,
          );
        }
        if (
          filter.filterType == GLOBAL_CONSTANTS.BINANCE_FILTERS.PRICE_FILTER
        ) {
          pairData.price_precision = getQtyandPricePrecision(filter.tickSize);
        }
        if (
          filter.filterType == GLOBAL_CONSTANTS.BINANCE_FILTERS.MIN_NOTIONAL ||
          filter.filterType == GLOBAL_CONSTANTS.BINANCE_FILTERS.NOTIONAL
        ) {
          pairData.minimum_trade = Number(filter.minNotional);
        }
      }
      // await KafkaHelper.produceMessage(KAFKA_EVENTS_TYPES.PAIR_PRECISION, [pairData])
      // await setPairsWithPrecisionInRedis({ pairName: pair, quantity_precision: pairData.quantity_precision, minimum_trade: pairData.minimum_trade, price_precision: pairData.price_precision })
    }
  }
};

const setExchangeInfo = async (pairName: string) => {
  let exchangeData: any = [];
  //   let data: any = await checkExchageInfo(pairName);
  //   if (!data.exchangeData) {
  await binanceConnector
    .getExchangeInfo(pairName)
    .then((result) => {
      exchangeData = result;
      result.pairName = pairName;
      //   data.pairList.push(result);
    })
    .catch((error) => {
      console.error("error No such pair on binance", { error, pairName });
    });
  //   } else {
  //     exchangeData = data.exchangeData;
  //   }
  //   //   await Redis.setString(
  //   //     THIRDPARTY_EXCHANGE_REDIS_KEYS.EXCHANGE_INFO,
  //   //     JSON.stringify(data.pairList),
  //   //   );
  return exchangeData;
};

export const tradeRules = async (
  price: number,
  pair: string,
  quantity: number,
  type: string,
  stopPrice: number,
  userId: string,
  side: number,
) => {
  let allOpenOrders = await getOpenOrderCount(userId, pair);
  //   let binancePair: any = await getPairInBinanceFormat(pair);
  const avergaePrice = await getAveragePrice(pair);
  let stopLimitOpenOrders = await getOpenOrderCount(userId, pair, type);
  const exchangeData: any = await setExchangeInfo(pair);

  const checksPassed: any = [];
  if (exchangeData.orderTypes.includes(type)) {
    checksPassed.push({ checkPassed: true, filter: "ORDER_TYPE" });
  } else {
    const message =
      GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.ORDER_TYPE_NOT_ALLOWED.replace(
        "{type}",
        type,
      );
    checksPassed.push({ checkPassed: false, filter: "ORDER_TYPE", message });
  }
  for (let filter of exchangeData.filters) {
    let notaionalValue: any =
      type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.LIMIT
        ? quantity * price
        : stopPrice * quantity;
    switch (filter.filterType) {
      case GLOBAL_CONSTANTS.BINANCE_FILTERS.PRICE_FILTER:
        const { minPrice, maxPrice, tickSize } = filter;
        if (
          type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.LIMIT ||
          type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.STOP_LOSS_LIMIT ||
          type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.TAKE_PROFIT_LIMIT
        ) {
          const minPriceCheck = Number(price) >= Number(minPrice);
          const maxPriceCheck = Number(price) <= Number(maxPrice);
          //   var tickSizeCheck = price % Number(tickSize);
          //   let ltp = await getLtp(pair);
          //   ltp = Utilities.bigint_operations(
          //     ltp,
          //     smallestUnit,
          //     "convert_to_normal",
          //   );

          if (type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.STOP_LOSS_LIMIT) {
            if (!minPriceCheck || !maxPriceCheck) {
              const message = minPriceCheck
                ? GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.PRICE_FILTER_MAX.replace(
                    "{price}",
                    Number(minPrice).toFixed(2).toString(),
                  )
                : GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.PRICE_FILTER_MIN.replace(
                    "{price}",
                    Number(maxPrice).toFixed(2).toString(),
                  );
              checksPassed.push({
                checkPassed: false,
                filter: filter.filterType,
                message,
              });
            }
          }
          if (type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.TAKE_PROFIT_LIMIT) {
            if (!minPriceCheck || !maxPriceCheck) {
              const message = minPriceCheck
                ? GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.PRICE_FILTER_MAX.replace(
                    "{price}",
                    Number(minPrice).toFixed(2).toString(),
                  )
                : GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.PRICE_FILTER_MIN.replace(
                    "{price}",
                    Number(maxPrice).toFixed(2).toString(),
                  );
              checksPassed.push({
                checkPassed: false,
                filter: filter.filterType,
                message,
              });
            }
          }
        }
        break;
      case GLOBAL_CONSTANTS.BINANCE_FILTERS.PERCENT_PRICE_BY_SIDE:
        if (
          type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.LIMIT ||
          type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.STOP_LOSS_LIMIT ||
          type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.TAKE_PROFIT_LIMIT
        ) {
          const maxPrice =
            side == GLOBAL_CONSTANTS.ORDER_SIDE.BUY
              ? avergaePrice * filter.bidMultiplierUp
              : avergaePrice * filter.askMultiplierUp;
          const minPrice =
            side == GLOBAL_CONSTANTS.ORDER_SIDE.BUY
              ? avergaePrice * filter.bidMultiplierDown
              : avergaePrice * filter.askMultiplierDown;

          if (price <= maxPrice) {
            checksPassed.push({ checkPassed: true, filter: filter.filterType });
          }
          if (price >= minPrice) {
            checksPassed.push({ checkPassed: true, filter: filter.filterType });
          }
          if (!(price <= maxPrice) || !(price >= minPrice)) {
            const message =
              price > maxPrice
                ? GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.PRICE_FILTER_MIN.replace(
                    "{price}",
                    Number(maxPrice).toFixed(2).toString(),
                  )
                : GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.PRICE_FILTER_MAX.replace(
                    "{price}",
                    Number(minPrice).toFixed(2).toString(),
                  );
            checksPassed.push({
              checkPassed: false,
              filter: filter.filterType,
              message,
            });
          }
        }
        break;
      case GLOBAL_CONSTANTS.BINANCE_FILTERS.PERCENT_PRICE:
        if (
          type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.LIMIT ||
          type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.STOP_LOSS_LIMIT ||
          type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.TAKE_PROFIT_LIMIT
        ) {
          const maxPrice = avergaePrice * filter.multiplierUp;
          const minPrice = avergaePrice * filter.multiplierDown;
          if (price <= maxPrice) {
            checksPassed.push({ checkPassed: true, filter: filter.filterType });
          }
          if (price >= minPrice) {
            checksPassed.push({ checkPassed: true, filter: filter.filterType });
          }
          if (!(price <= maxPrice) || !(price >= minPrice)) {
            const message =
              price > maxPrice
                ? GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.PRICE_FILTER_MIN.replace(
                    "{price}",
                    Number(maxPrice).toFixed(2).toString(),
                  )
                : GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.PRICE_FILTER_MAX.replace(
                    "{price}",
                    Number(minPrice).toFixed(2).toString(),
                  );
            checksPassed.push({
              checkPassed: false,
              filter: filter.filterType,
              message,
            });
          }
        }
        break;
      case GLOBAL_CONSTANTS.BINANCE_FILTERS.LOT_SIZE:
        const minQty = filter.minQty;
        const maxQty = filter.maxQty;
        if (quantity >= minQty) {
          checksPassed.push({ checkPassed: true, filter: filter.filterType });
        }
        if (quantity <= maxQty) {
          checksPassed.push({ checkPassed: true, filter: filter.filterType });
        } else {
          const message =
            quantity > maxQty
              ? GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.LOT_SIZE_MIN.replace(
                  "{quantity}",
                  Number(maxQty).toFixed(2).toString(),
                )
              : quantity < minQty
                ? GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.LOT_SIZE_MAX.replace(
                    "{quantity}",
                    Number(minQty).toFixed(2).toString(),
                  )
                : "step size error";
          checksPassed.push({
            checkPassed: false,
            filter: filter.filterType,
            message,
          });
        }
        break;
      case GLOBAL_CONSTANTS.BINANCE_FILTERS.NOTIONAL ||
        GLOBAL_CONSTANTS.BINANCE_FILTERS.MIN_NOTIONAL:
        const precision = getQtyandPricePrecision(filter.minNotional);
        notaionalValue = notaionalValue.toFixed(precision);
        if (
          type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.LIMIT ||
          type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.STOP_LOSS_LIMIT ||
          type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.TAKE_PROFIT_LIMIT
        ) {
          if (Number(notaionalValue) >= Number(filter.minNotional)) {
            checksPassed.push({ checkPassed: true, filter: filter.filterType });
          } else {
            const message =
              GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.MIN_NOTATIONAL.replace(
                "{total}",
                Number(filter.minNotional).toFixed(2).toString(),
              );
            checksPassed.push({
              checkPassed: false,
              filter: filter.filterType,
              message,
            });
          }
        } else if (type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.MARKET) {
          const price = await getAveragePrice(pair);
          notaionalValue = quantity * price;
          if (notaionalValue >= filter.minNotional) {
            checksPassed.push({ checkPassed: true, filter: filter.filterType });
          } else {
            const minQty = filter.minNotional / price;
            const message =
              GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.MIN_NOTATIONAL_MARKET.replace(
                "{quantity}",
                Number(minQty).toFixed(6).toString(),
              );
            checksPassed.push({
              checkPassed: false,
              filter: filter.filterType,
              message,
            });
          }
        }
        break;
      case GLOBAL_CONSTANTS.BINANCE_FILTERS.MARKET_LOT_SIZE:
        const minQtyMarket = filter.minQty;
        const maxQtyMarket = filter.maxQty;
        if (type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.MARKET) {
          if (quantity >= minQtyMarket) {
            checksPassed.push({ checkPassed: true, filter: filter.filterType });
          }
          if (quantity <= maxQtyMarket) {
            checksPassed.push({ checkPassed: true, filter: filter.filterType });
          } else {
            const message =
              quantity <= maxQtyMarket
                ? GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.MARKET_LOT_SIZE_MIN.replace(
                    "{quantity}",
                    Number(maxQtyMarket).toFixed(2).toString(),
                  )
                : GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.MARKET_LOT_SIZE_MAX.replace(
                    "{quantity}",
                    Number(maxQtyMarket).toFixed(2).toString(),
                  );
            checksPassed.push({
              checkPassed: false,
              filter: filter.filterType,
              message,
            });
          }
        }
        break;
      case GLOBAL_CONSTANTS.BINANCE_FILTERS.MAX_NUM_ORDERS:
        if (allOpenOrders < filter.maxNumOrders) {
          checksPassed.push({ checkPassed: true, filter: filter.filterType });
        } else {
          const message =
            GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.MAX_NUM_ORDERS;
          checksPassed.push({
            checkPassed: false,
            filter: filter.filterType,
            message,
          });
        }
        break;
      case GLOBAL_CONSTANTS.BINANCE_FILTERS.MAX_NUM_ALGO_ORDERS:
        if (type == GLOBAL_CONSTANTS.BINANCE_ORDER_TYPE.STOP_LOSS_LIMIT) {
          if (stopLimitOpenOrders < filter.maxNumAlgoOrders) {
            checksPassed.push({ checkPassed: true, filter: filter.filterType });
          } else {
            const message =
              GLOBAL_CONSTANTS.BINANCE_ORDER_ERROR_MSG.MAX_NUM_ALGO_ORDERS;
            checksPassed.push({
              checkPassed: false,
              filter: filter.filterType,
              message,
            });
          }
        }
        break;
      case GLOBAL_CONSTANTS.BINANCE_FILTERS.MAX_NUM_ICEBERG_ORDERS:
        break;
      case GLOBAL_CONSTANTS.BINANCE_FILTERS.TRAILING_DELTA:
        break;
      default:
        break;
    }
  }
  return checksPassed;
};
