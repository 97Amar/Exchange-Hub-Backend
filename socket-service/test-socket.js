const { Kafka } = require('kafkajs');
const { getKafkaConfig } = require('../shared/utils/kafka-config');
const dotenv = require('dotenv');
dotenv.config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "socket-service",
  ...getKafkaConfig()
});
const producer = kafka.producer();
async function main() {
  await producer.connect();
  const payload = {
    eventName: "KAFKA_BINANCE_OPEN_ORDERS",
    room: null,
    data: { orderId: 1, status: "open", symbol: "BTC_USDT", side: "BUY" }
  };
  await producer.send({
    topic: 'EXCHANGE_USER_DATA',
    messages: [{ value: JSON.stringify(payload) }]
  });
  console.log("Sent test message");
  await producer.disconnect();
}
main();
