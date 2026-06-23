# Exchange Hub - Backend

This directory contains the microservices that power the Exchange Hub backend. The architecture is built as a monorepo using **npm workspaces**, with various services communicating via Kafka and gRPC.

## Architecture & Services

The backend consists of the following microservices:

- **`exchange-service`**: Handles core exchange logic, order processing, and integration with external exchanges (Binance, Bybit).
- **`user-service`**: Manages user accounts, authentication, and profiles.
- **`wallet-service`**: Handles user wallets, balances, and transactions.
- **`notification-service`**: Sends notifications (OTP, email) to users.
- **`socket-service`**: Manages real-time data streaming via WebSockets.
- **`shared`**: A shared library containing common utilities, types, gRPC proto files, and Sequelize models.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL (with Sequelize ORM)
- **Messaging**: Kafka (via KafkaJS)
- **Communication**: gRPC
- **Caching**: Redis
- **Real-time**: Socket.io

## Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL
- Kafka
- Redis

### Installation

1. Install dependencies from the root `backend` directory:
   ```bash
   npm install
   ```

2. Configure environment variables for each service by creating a `.env` file in their respective directories (use `.env.example` if available).

### Running the Services

You can run each service individually from its directory:

```bash
cd <service-name>
npm run start
```

For development with automatic migrations:
```bash
npm run development
```

## Database Management
We use **Sequelize** for database migrations and modeling.
Migrations, models, and seeders are defined within each service or in the `shared` module as applicable.

## Monitoring & Logs
Services log their activities to `.log` files in their respective directories for easy debugging and monitoring.
