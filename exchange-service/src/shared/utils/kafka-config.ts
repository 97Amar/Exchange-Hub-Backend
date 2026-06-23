import { Kafka, SASLOptions } from "kafkajs";

export const getKafkaConfig = () => ({
    brokers: [process.env.KAFKA_BROKER!],
    sasl: {
        mechanism: 'plain' as const,
        username: process.env.KAFKA_USERNAME!,
        password: process.env.KAFKA_PASSWORD!,
    },
    ssl: {
        rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    retry: {
        initialRetryTime: 300,
        retries: 10
    }
});


export const ensureTopicsExist = async (clientId: string, topics: string[]) => {
    const kafka = new Kafka({
        clientId,
        ...getKafkaConfig()
    });
    const admin = kafka.admin();
    try {
        console.log(`📡 Connecting to Kafka Admin for ${clientId}...`);
        await admin.connect();
        const existingTopics = await admin.listTopics();
        const topicsToCreate = topics.filter(t => !existingTopics.includes(t));

        if (topicsToCreate.length > 0) {
            console.log(`📡 Attempting to create missing topics: ${topicsToCreate.join(", ")}`);
            await admin.createTopics({
                topics: topicsToCreate.map(t => ({
                    topic: t,
                    numPartitions: 1, // Explicitly set partitions
                    replicationFactor: 1 // Adjust if needed for production
                })),
                waitForLeaders: true
            });
            console.log(`✅ Created missing topics: ${topicsToCreate.join(", ")}`);
            console.log("⏳ Waiting 10 seconds for Kafka cluster to stabilize and propagate metadata...");
            await new Promise(resolve => setTimeout(resolve, 10000));
        } else {
            console.log("✅ All required Kafka topics already exist");
            // Still check metadata to ensure they are "hosted"
            console.log("🔍 Verifying topic metadata hospitality...");
            const metadata = await admin.fetchTopicMetadata({ topics });
            for (const topicMetadata of metadata.topics) {
                // In KafkaJS, top-level topic metadata might have an error code
                if ((topicMetadata as any).errorCode) {
                    console.warn(`⚠️ Topic ${topicMetadata.name} has error code: ${(topicMetadata as any).errorCode}`);
                }
                for (const partition of topicMetadata.partitions) {
                    if ((partition as any).errorCode) {
                        console.warn(`⚠️ Topic ${topicMetadata.name} Partition ${partition.partitionId} has error code: ${(partition as any).errorCode}`);
                    }
                }
            }
            console.log("⏳ Waiting 3 seconds for metadata consistency...");
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    } catch (error: any) {
        console.error("❌ Error ensuring Kafka topics exist:", error.message || error);
        throw error;
    } finally {
        await admin.disconnect();
    }
};



