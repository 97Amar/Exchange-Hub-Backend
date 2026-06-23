import { BybitWS } from "./bybit";
import { getPrivateWsClient } from "../utils/bybitClient";
import Bybit from "../../models/bybit";
import { KafkaProducer } from "../kafka/producer";
import { INTERNAL_KAFKA_EVENTS } from "../constants/socketEvents";
import { handleTradeExecution, handleOrderRefund } from "../helpers/walletSettlement";

// ─── Constants & Types ──────────────────────────────────────────────────────
const EMIT_INTERVAL = 500; // 500ms throttle
const lastEmitTime: Map<string, number> = new Map();

// ─── Helpers ─────────────────────────────────────────────────────────────────
const normaliseSymbol = (raw: string) =>
  raw.replace(/([A-Z]+)(USDT|USDC|BTC|ETH)$/, "$1_$2");

// ══════════════════════════════════════════════════════════════════════════════
// BYBIT MODULE
// ══════════════════════════════════════════════════════════════════════════════

export function initBybitPublicStream() {
  const bybitWS = new BybitWS((data) => {
    const topic = data.topic || "";

    if (topic.startsWith("orderbook")) {
      const { symbol: rawSymbol } = data;
      const now = Date.now();
      const lastSend = lastEmitTime.get(`bybit_ob_${rawSymbol}`) || 0;

      if (data.type === "update" && now - lastSend > EMIT_INTERVAL) {
        const fullBook = bybitWS!.getOrderBook(rawSymbol, 50);
        const symbol = normaliseSymbol(rawSymbol);
        const eventName = `KAFKA_${symbol}_BYBIT_${INTERNAL_KAFKA_EVENTS.BYBIT_ORDERBOOK}`;

        const transform = (raw: string[][]) => {
          let total = 0;
          return raw.map(([price, quantity]) => {
            total += parseFloat(quantity);
            return {
              price: parseFloat(price),
              quantity: parseFloat(quantity),
              total,
            };
          });
        };

        KafkaProducer.send("EXCHANGE_MARKET_DATA", eventName, rawSymbol, {
          buyOrderBook: transform(fullBook.b),
          sellOrderBook: transform(fullBook.a),
        });
        lastEmitTime.set(`bybit_ob_${rawSymbol}`, now);
      }
    } else if (topic.startsWith("publicTrade") || data.type === "trade") {
      const { symbol: rawSymbol, data: trades } = data;
      const symbol = normaliseSymbol(rawSymbol);
      const eventName = `KAFKA_${symbol}_${INTERNAL_KAFKA_EVENTS.BYBIT_TRADE}`;

      const payload = trades.map((t: any) => ({
        filled_amount: t.v,
        price: t.p,
        side: t.S,
        created_at: t.T.toString(),
      }));

      KafkaProducer.send("EXCHANGE_MARKET_DATA", eventName, rawSymbol, payload);
    } else if (topic.startsWith("tickers") || data.type === "ticker") {
      const { symbol: rawSymbol, data: tickerInfo } = data;
      const symbol = normaliseSymbol(rawSymbol);
      const t = tickerInfo;
      if (t) {
        KafkaProducer.send(
          "EXCHANGE_MARKET_DATA",
          `KAFKA_${symbol}_${INTERNAL_KAFKA_EVENTS.BYBIT_TICKER}`,
          rawSymbol,
          {
            symbol: t.symbol || rawSymbol,
            lastPrice: t.lastPrice,
            highPrice24h: t.highPrice24h,
            lowPrice24h: t.lowPrice24h,
            volume24h: t.volume24h,
            prevPrice24h: t.prevPrice24h,
            price24hPcnt: t.price24hPcnt,
          },
        );
      }
    }
  });

  bybitWS.connect();
  return bybitWS;
}

export function initBybitPrivateStream() {
  const privateWs = getPrivateWsClient();
  (privateWs as any).subscribeV5(["order"], "spot");

  (privateWs as any).on("update", async (msg: any) => {
    if (msg.topic === "order") {
      const orders = msg.data;
      for (const bybitOrder of orders) {
        const { orderId, orderStatus } = bybitOrder;
        console.log("BybitOrderUpdate", bybitOrder);

        const localOrder = await Bybit.findOne({
          where: { bybit_order_id: orderId },
        });

        if (localOrder) {
          let newStatus = orderStatus;

          if (newStatus !== localOrder.status || bybitOrder.cumExecQty) {
            localOrder.status = newStatus;
            if (bybitOrder.cumExecQty) {
              localOrder.filled_qty = Number(bybitOrder.cumExecQty);
            }
            if (bybitOrder.avgPrice) {
              localOrder.executed_price = Number(bybitOrder.avgPrice);
            }
            await localOrder.save();

            const payload = {
              id: localOrder.id,
              orderId: orderId,
              exchange_order_id: orderId,
              status: newStatus,
              symbol: localOrder.pair_name,
              side: localOrder.side,
              pair_name: localOrder.pair_name,
              type: localOrder.type,
              amount: localOrder.qty,
              price: localOrder.price,
              filled_qty: localOrder.filled_qty || 0,
              created_at: localOrder.created_at,
            };

            // Deliver only to the user who owns the order.
            const userRoom = `user_${localOrder.user_id}`;

            KafkaProducer.send(
              "EXCHANGE_USER_DATA",
              INTERNAL_KAFKA_EVENTS.BYBIT_ORDER_STATUS_UPDATE,
              userRoom,
              payload,
            );

            if (newStatus === "Filled" || newStatus === "Cancelled" || newStatus === "Rejected") {
              KafkaProducer.send(
                "EXCHANGE_USER_DATA",
                INTERNAL_KAFKA_EVENTS.BYBIT_ORDER_HISTORY,
                userRoom,
                payload,
              );

              // If terminal and Cancelled/Rejected, refund remaining balance
              if (newStatus === "Cancelled" || newStatus === "Rejected") {
                const remainingQty = Number(localOrder.qty) - (localOrder.filled_qty || 0);
                if (remainingQty > 0) {
                  await handleOrderRefund(
                    localOrder.user_id,
                    localOrder.pair_name,
                    localOrder.side,
                    remainingQty,
                    Number(localOrder.price)
                  );
                }
              }
            }

            if (bybitOrder.execType === "Trade") {
              // Settle Wallet Balance for trade
              if (bybitOrder.lastQty && bybitOrder.lastPrice) {
                await handleTradeExecution(
                  localOrder.user_id,
                  localOrder.pair_name,
                  localOrder.side,
                  Number(bybitOrder.lastQty),
                  Number(bybitOrder.lastPrice),
                  bybitOrder.execId
                );
              }

              const tradePayload = {
                ...payload,
                id: bybitOrder.execId || payload.id,
                tradeId: bybitOrder.execId,
                order_id: orderId,
                price: bybitOrder.lastPrice || payload.price,
                executed: bybitOrder.lastQty || payload.filled_qty,
                amount: bybitOrder.lastQty || payload.amount,
                fee: bybitOrder.execFee || 0,
                fee_asset: "",
                total:
                  Number(bybitOrder.lastPrice || 0) *
                  Number(bybitOrder.lastQty || 0),
                created_at: new Date(
                  Number(bybitOrder.updatedTime) || Date.now(),
                ).toISOString(),
              };

              KafkaProducer.send(
                "EXCHANGE_USER_DATA",
                INTERNAL_KAFKA_EVENTS.BYBIT_TRADE_HISTORY,
                userRoom,
                tradePayload,
              );
            }
          }
        }
      }
    }
  });
}
