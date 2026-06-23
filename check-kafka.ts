import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../socket-service/.env') });

const kafka = new Kafka({
    clientId: 'diagnostic-client',
    brokers: [process.env.KAFKA_BROKER!],
    sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME!,
        password: process.env.KAFKA_PASSWORD!,
    },
    ssl: {
        rejectUnauthorized: false,
    },
});

async function run() {
    const admin = kafka.admin();
    await admin.connect();
    console.log('Connected to admin');

    const topics = await admin.listTopics();
    console.log('Existing topics:', topics);

    const relevantTopics = ['EXCHANGE_SUBSCRIPTION', 'EXCHANGE_USER_DATA', 'TRADE_EVENTS'];

    for (const topic of relevantTopics) {
        if (topics.includes(topic)) {
            try {
                const metadata = await admin.fetchTopicMetadata({ topics: [topic] });
                console.log(`Metadata for ${topic}:`, JSON.stringify(metadata, null, 2));
            } catch (err) {
                console.error(`Error fetching metadata for ${topic}:`, err);
            }
        } else {
            console.log(`Topic ${topic} does not exist`);
        }
    }

    await admin.disconnect();
}

run().catch(console.error);
