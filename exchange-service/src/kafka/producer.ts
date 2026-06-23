import { Kafka, SASLOptions, Partitioners } from 'kafkajs';
import { getKafkaConfig } from '../../../shared/utils/kafka-config';
import dotenv from 'dotenv';
dotenv.config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "exchange-service",
  ...getKafkaConfig()
});


const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
  allowAutoTopicCreation: false
});
let isConnected = false;

export const KafkaProducer = {
  connect: async () => {
    if (!isConnected) {
      await producer.connect();
      isConnected = true;
      console.log('✅ Kafka Producer connected (Exchange Service)');
    }
  },

  disconnect: async () => {
    if (isConnected) {
      await producer.disconnect();
      isConnected = false;
    }
  },

  send: (topic: string, eventName: string, room: string | null, data: any) => {
    const payload = {
      eventName,
      room,
      data
    };

    const run = async () => {
      try {
        if (!isConnected) {
          await KafkaProducer.connect();
        }
        await producer.send({
          topic,
          messages: [
            { value: JSON.stringify(payload) }
          ]
        });
      } catch (err) {
        console.error('Error producing message to Kafka:', err);
      }
    };

    // Non-blocking fire-and-forget
    run().catch(console.error);
  }
};
