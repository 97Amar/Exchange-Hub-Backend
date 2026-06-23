"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../src/utils/constants");
/**
 * gRPC Test Script for NotificationService
 *
 * Run this with: npx ts-node scripts/test-grpc.ts
 */
const PROTO_PATH = path_1.default.resolve(__dirname, "../src/grpc/proto/mail.proto");
const GRPC_HOST = process.env.NOTIFICATION_SERVICE_GRPC_HOST;
const SERVER_URL = GRPC_HOST;
// 1. Load the proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDefinition);
const NotificationService = proto.notification.NotificationService;
// 2. Create the client
const client = new NotificationService(SERVER_URL, grpc.credentials.createInsecure());
// 3. Define the request
const mailData = {
    to: "test@example.com",
    subject: "gRPC Test Email",
    body: "This is a test email sent via gRPC test script.",
    type: "TEST",
    username: "test_user",
    service: constants_1.NOTIFICATION_TYPE.EMAIL,
};
console.log("🚀 Sending gRPC SendMail request...");
// 4. Make the call
client.SendMail(mailData, (error, response) => {
    if (error) {
        console.error("❌ gRPC Request Failed:", error.message);
        process.exit(1);
    }
    else {
        console.log("✅ gRPC notification side Response Received:");
        console.log(JSON.stringify(response, null, 2));
        // Simple assertion for freshers to understand
        if (response.status === "0" || response.status === 0) {
            console.log("🎉 Test Passed!");
        }
        else {
            console.warn("⚠️ Service returned non-success status.");
        }
    }
});
//# sourceMappingURL=test-grpc.js.map