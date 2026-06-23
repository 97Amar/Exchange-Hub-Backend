import { Server as HTTPServer } from "http";
import { KafkaProducer } from "../kafka/producer";
import { Kafka, SASLOptions } from "kafkajs";
import { BybitWS } from "./bybit";
import { BinanceWS } from "./binance";
import {
  initBybitPublicStream,
  initBybitPrivateStream,
} from "./bybitServer";
import {
  initBinancePublicStream,
  initBinancePrivateStream,
} from "./binanceServer";
import { getKafkaConfig } from "../../../shared/utils/kafka-config";
import dotenv from 'dotenv';
dotenv.config();

// ══════════════════════════════════════════════════════════════════════════════
// KAFKA SUBSCRIPTION MODULE
// ══════════════════════════════════════════════════════════════════════════════

async function initKafkaSubscriptionConsumer(
  bybitWS: BybitWS | null,
  binanceWS: BinanceWS | null,
) {
  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || "exchange-service",
    ...getKafkaConfig()
  });
  const consumer = kafka.consumer({ groupId: "exchange-service-group" });

  await consumer.connect();
  await consumer.subscribe({
    topic: "EXCHANGE_SUBSCRIPTION",
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      try {
        const payload = JSON.parse(message.value.toString());
        const { eventName, room, data } = payload;
        const exchange = data?.exchange || "both";
        const rawSymbol = room.replace(/_/g, "");

        if (eventName === "SUBSCRIBE") {
          if ((exchange === "bybit" || exchange === "both") && bybitWS) {
            bybitWS.subscribe(rawSymbol);
          }
          if ((exchange === "binance" || exchange === "both") && binanceWS) {
            binanceWS.subscribe(rawSymbol);
          }
        } else if (eventName === "UNSUBSCRIBE") {
          if ((exchange === "bybit" || exchange === "both") && bybitWS) {
            bybitWS.unsubscribe(rawSymbol);
          }
          if ((exchange === "binance" || exchange === "both") && binanceWS) {
            binanceWS.unsubscribe(rawSymbol);
          }
        }
      } catch (err) {
        console.error("Error processing subscription message:", err);
      }
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN INITIALIZATION
// ══════════════════════════════════════════════════════════════════════════════

export async function initExchangeStreams(httpServer: HTTPServer) {
  await KafkaProducer.connect();

  const EXCHANGE_TYPE = (process.env.EXCHANGE_TYPE || "bybit").toLowerCase();
  console.log(`📡 Starting Exchange Service in ${EXCHANGE_TYPE} mode`);

  let bybitWS: BybitWS | null = null;
  let binanceWS: BinanceWS | null = null;

  if (EXCHANGE_TYPE === "bybit" || EXCHANGE_TYPE === "both") {
    bybitWS = initBybitPublicStream();
    initBybitPrivateStream();
  }

  if (EXCHANGE_TYPE === "binance" || EXCHANGE_TYPE === "both") {
    binanceWS = initBinancePublicStream();
    await initBinancePrivateStream();
  }

  await initKafkaSubscriptionConsumer(bybitWS, binanceWS);

  console.log("✅ Exchange Streams initialized");
}
