import { Server } from "socket.io";

export function handleBinanceUserDataEvent(
  io: Server,
  eventName: string,
  room: string | undefined,
  data: any,
) {
  // Map internal Kafka events to web-facing events based on our approved architecture
  let webEventName = "";

  switch (eventName) {
    case "KAFKA_BINANCE_OPEN_ORDERS":
      webEventName = "WEB_BINANCE_OPEN_ORDERS";
      break;
    case "KAFKA_BINANCE_ORDER_HISTORY":
      webEventName = "WEB_BINANCE_ORDER_HISTORY";
      break;
    case "KAFKA_BINANCE_TRADE_HISTORY":
      webEventName = "WEB_BINANCE_TRADE_HISTORY";
      break;
    default:
      return false; // Not a binance user data event
  }

  // Broadcast out to Web Sockets safely under new explicit identifier
  if (room) io.to(room).emit(webEventName, data);
  else io.emit(webEventName, data);

  return true;
}
