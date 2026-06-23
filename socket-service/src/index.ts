import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { initKafkaConsumer } from "./kafka/consumer";
import { producer, initKafkaProducer } from "./kafka/producer";
import { ensureTopicsExist } from "../../shared/utils/kafka-config";


dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on(
    "joinRoom",
    async (payload: { room: string; exchange?: string }) => {
      const { room } = payload;
      const rawSymbol = room.replace(/_/g, ""); // ETH_USDT → ETHUSDT
      socket.join(rawSymbol);
      console.log(`👥 Client ${socket.id} joined room: ${rawSymbol}`);

      try {
        await producer.send({
          topic: "EXCHANGE_SUBSCRIPTION",
          messages: [
            {
              value: JSON.stringify({
                eventName: "SUBSCRIBE",
                room,
                data: payload,
              }),
            },
          ],
        });
      } catch (e) {
        console.error("Failed to publish SUBSCRIBE to Kafka", e);
      }
    },
  );

  socket.on("leave", async (payload: { room: string; exchange?: string }) => {
    const { room } = payload;
    const rawSymbol = room.replace(/_/g, "");
    socket.leave(rawSymbol);

    try {
      const roomObj = io.sockets.adapter.rooms.get(rawSymbol);
      if (!roomObj || roomObj.size === 0) {
        await producer.send({
          topic: "EXCHANGE_SUBSCRIPTION",
          messages: [
            {
              value: JSON.stringify({
                eventName: "UNSUBSCRIBE",
                room,
                data: payload,
              }),
            },
          ],
        });
        console.log(
          `📡 Requested exchange-service to unsubscribe from ${rawSymbol}`,
        );
      }
    } catch (e) {
      console.error("Failed to publish UNSUBSCRIBE to Kafka", e);
    }
  });

  // Each authenticated user joins a private room keyed by their user ID.
  // Backend services send user-specific events to this room so that only
  // the owner of an order receives updates for that order.
  socket.on("joinUserRoom", (payload: { userId: string }) => {
    if (!payload?.userId) return;
    const room = `user_${payload.userId}`;
    socket.join(room);
    console.log(`🔐 Client ${socket.id} joined private room: ${room}`);
  });

  socket.on("leaveUserRoom", (payload: { userId: string }) => {
    if (!payload?.userId) return;
    const room = `user_${payload.userId}`;
    socket.leave(room);
    console.log(`🔓 Client ${socket.id} left private room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = Number(process.env.PORT) || 4004;

async function bootstrap() {
  try {
    // Ensure Kafka topics exist
    await ensureTopicsExist("socket-service", ["EXCHANGE_SUBSCRIPTION", "EXCHANGE_USER_DATA", "EXCHANGE_MARKET_DATA"]);

    // Producer must be ready before the server accepts connections so that
    await initKafkaProducer();

    await initKafkaConsumer(io);
    console.log("✅ Kafka Services Connected Successfully");

    server.listen(PORT, () => {
      console.log(`🚀 Socket Service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to initialize Socket Service:", err);
    process.exit(1);
  }
}

bootstrap();
