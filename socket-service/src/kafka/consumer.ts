import { Kafka, SASLOptions } from 'kafkajs';
import { Server } from 'socket.io';
import { handleBinanceUserDataEvent } from '../events/binance.events';
import { getKafkaConfig } from '../shared/utils/kafka-config';
import dotenv from 'dotenv';
dotenv.config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "socket-service",
  ...getKafkaConfig()
});


const consumer = kafka.consumer({ groupId: 'socket-service-group' });

export async function initKafkaConsumer(io: Server) {
  await consumer.connect();

  await consumer.subscribe({ topic: 'EXCHANGE_MARKET_DATA', fromBeginning: false });
  await consumer.subscribe({ topic: 'EXCHANGE_USER_DATA', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;

      try {
        const payload = JSON.parse(message.value.toString());
        const { eventName, room, data } = payload;

        // Dynamic prefix translation for ALL events as requested
        const webEventName = eventName.startsWith("KAFKA_")
          ? eventName.replace("KAFKA_", "WEB_")
          : `WEB_${eventName}`;

        if (room) {
          console.log(`📡 Emitting to room [${room}]: ${webEventName}`);
          io.to(room).emit(webEventName, data);
        } else {
          console.log(`📡 Broadcasting globally: ${webEventName}`);
          io.emit(webEventName, data);
        }
      } catch (err) {
        console.error('Error processing Kafka message:', err);
      }
    },
  });

  console.log('✅ Kafka Consumer connected in Socket Service');
}
