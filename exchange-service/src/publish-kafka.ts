import { Kafka, SASLOptions } from "kafkajs";
import { getKafkaConfig, ensureTopicsExist } from "../../shared/utils/kafka-config";
import dotenv from 'dotenv';
dotenv.config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "exchange-service",
  ...getKafkaConfig()
});



const producer = kafka.producer();

async function run() {
  await producer.connect();
  await producer.send({
    topic: "EXCHANGE_SUBSCRIPTION",
    messages: [
      {
        value: JSON.stringify({
          eventName: "SUBSCRIBE",
          room: "BTCUSDT",
          data: { exchange: "binance" },
        }),
      },
    ],
  });
  console.log("✅ Subscription message sent to Kafka");
  await producer.disconnect();
}

run().catch(console.error);
