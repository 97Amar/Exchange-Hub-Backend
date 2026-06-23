import { Kafka, SASLOptions, Partitioners } from 'kafkajs';
import dotenv from 'dotenv';
import { getKafkaConfig } from '../../../shared/utils/kafka-config';
dotenv.config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "socket-service",
  ...getKafkaConfig()
});


export const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
  allowAutoTopicCreation: false
});

export async function initKafkaProducer() {
  await producer.connect();
  console.log('✅ Kafka Producer connected in Socket Service');
}
