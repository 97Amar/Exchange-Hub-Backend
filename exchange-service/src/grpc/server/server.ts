import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import logger from "../../utils/logger";

const grpcIp = "0.0.0.0";
const grpcPort = process.env.GRPC_PORT || "53002";
const URL = `${grpcIp}:${grpcPort}`;

const PROTO_PATH = path.resolve(__dirname, "..", "..", "shared", "proto", "bybit.proto");

const protoOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

const packageDefinition = protoLoader.loadSync(PROTO_PATH, protoOptions);
const proto: any = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();

/**
 * Function to start the server
 */
export function startServer() {
  const credentials = grpc.ServerCredentials.createInsecure();

  server.bindAsync(URL, credentials, (error, port) => {
    if (error) {
      console.error("❌ Failed to start gRPC server", error);
    } else {
      console.log(`✅ gRPC Server for Bybit is running at: ${URL}`);
    }
  });
}

export default server;
