# 🛒 E-Commerce Microservices Backend

A production-ready e-commerce backend built with **Node.js**, **TypeScript**, **Kafka**, **MongoDB**, and **Docker**. The system is split into independent microservices that communicate via Kafka events and REST APIs, all accessible through a single **API Gateway**.

---

## 📐 Architecture Overview

```
                        ┌─────────────────────────────────────────┐
                        │            Docker Network               │
                        │                                         │
  Client (Postman /  ──►│  api-gateway      :5000  (entry point)  │
  Next.js Frontend)     │    ├── user-service     :5001           │
                        │    ├── product-service  :5002           │
                        │    ├── order-service    :5003           │
                        │    └── payment-service  :5004           │
                        │                                         │
                        │  email-service    (internal only)       │
                        │  kafka + zookeeper (event bus)          │
                        │  mongodb           (databases)          │
                        └─────────────────────────────────────────┘
```

### Service Communication

- **API Gateway** — single entry point for all frontend/client requests, proxies to the correct microservice
- **HTTP (sync)** — order-service calls payment-service directly to get `approveUrl` / `clientSecret` back immediately
- **Kafka (async)** — all notifications, status updates, emails, and refunds go through Kafka topics

---

## 🧩 Services

### 🌐 API Gateway (port 5000)

Single entry point for all client requests.

- Routes requests to the correct microservice
- Forwards JWT cookies as Authorization headers
- Rate limiting and CORS
- Request logging with Pino

### 👤 User Service (port 5001)

Handles authentication and user management.

- Register / Login with JWT
- Cookie-based auth + Bearer token support
- Password hashing with bcrypt

### 📦 Product Service (port 5002)

Handles product catalog.

- CRUD for products
- Image upload via **Cloudinary**
- Zod validation with `z.coerce` for form-data fields
- Fires Kafka events: `product-created`, `product-deleted`, `product-out-of-stock`

### 🧾 Order Service (port 5003)

Handles order lifecycle.

- Create orders (COD / Stripe / PayPal)
- Calls payment-service via HTTP to get payment URL/secret immediately
- Listens to `payment-success` / `payment-failed` Kafka events to update order status
- Cancel order triggers refund via Kafka

### 💳 Payment Service (port 5004)

Handles all payment processing.

- **Stripe** — PaymentIntent with webhook verification
- **PayPal** — OAuth2 + order capture flow
- **Cash on Delivery** — confirmed immediately
- Listens to `refund-requested` Kafka event to process refunds
- Fires `payment-success` / `payment-failed` / `refund-processed` events

### 📧 Email Service (internal)

Listens to `email-topic` Kafka messages and sends emails via **Gmail SMTP / Nodemailer**.

- Order placed confirmation
- Payment success / failed
- Refund processed
- Out of stock alerts

---

## 🔄 Kafka Topics

| Topic                  | Producer        | Consumer        |
| ---------------------- | --------------- | --------------- |
| `payment-success`      | payment-service | order-service   |
| `payment-failed`       | payment-service | order-service   |
| `refund-requested`     | order-service   | payment-service |
| `refund-processed`     | payment-service | -               |
| `order-placed`         | order-service   | -               |
| `order-status-updated` | order-service   | -               |
| `product-created`      | product-service | -               |
| `product-deleted`      | product-service | -               |
| `product-out-of-stock` | product-service | -               |
| `email-topic`          | all services    | email-service   |
| `user-created`         | user-service    | email-service   |

---

## 💰 Payment Flow

### Stripe

```
POST /api/orders (paymentMethod: "stripe")
  → gateway → order-service
  → order-service calls payment-service /initiate via HTTP
  → payment-service creates Stripe PaymentIntent
  → returns { clientSecret, paymentIntentId }
  → frontend confirms payment using Stripe.js
  → Stripe CLI forwards webhook to payment-service
  → payment-service fires Kafka: payment-success
  → order-service updates order to "confirmed" ✅
```

### PayPal

```
POST /api/orders (paymentMethod: "paypal")
  → gateway → order-service
  → order-service calls payment-service /initiate via HTTP
  → payment-service creates PayPal order
  → returns { approveUrl, paypalOrderId }
  → user opens approveUrl and logs in to PayPal sandbox
  → user approves payment
  → POST /api/payments/paypal/capture
  → payment-service captures payment
  → fires Kafka: payment-success
  → order-service updates order to "confirmed" ✅
```

### Cash on Delivery

```
POST /api/orders (paymentMethod: "cash_on_delivery")
  → order created with status "confirmed" immediately ✅
  → no payment processing needed
```

### Refund

```
DELETE /api/orders/:id
  → order-service fires Kafka: refund-requested
  → payment-service processes Stripe/PayPal refund
  → fires Kafka: refund-processed
  → email sent to user ✅
```

---

## 🗂️ Project Structure

```
MicroService/
├── docker-compose.yml
├── gateway/                  ← API Gateway
│   ├── src/
│   │   ├── index.ts          (middleware setup)
│   │   ├── proxy.ts          (proxy)
│   │   ├── config/env.ts
│   │   ├── middleware/
│   │   │   ├── logger.middleware.ts
│   │   │   └── error.middleware.ts
│   │   └── utils/logger.ts
│   ├── Dockerfile
│   └── .env.example
├── user/
│   ├── src/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── model/
│   │   ├── middleware/
│   │   ├── kafka/
│   │   ├── router/
│   │   ├── validation/
│   │   ├── db/
│   │   └── utils/
│   ├── Dockerfile
│   └── .env.example
├── product/          (same structure)
├── order/            (same structure)
├── payment/          (same structure)
└── email/
    ├── src/
    │   └── index.ts  (Kafka consumer + Nodemailer)
    ├── Dockerfile
    └── .env.example
```

---

## 🚀 Getting Started

### Prerequisites

- Docker Desktop
- Node.js 20+
- Stripe account (test mode)
- PayPal Developer account (sandbox)
- Gmail account with App Password

### 1. Clone and setup environment files

```bash
git clone  https://github.com/HazemGhannem/MicroservicesBackend.git
cd MicroService
```

Copy and fill in each service's env file:

```bash
cp gateway/.env.example  gateway/.env
cp user/.env.example     user/.env
cp product/.env.example  product/.env
cp order/.env.example    order/.env
cp payment/.env.example  payment/.env
cp email/.env.example    email/.env
```

### 2. Environment variables

**gateway/.env**

```env
PORT=5000
NODE_ENV=development
USER_SERVICE_URL=http://user-service:5001
PRODUCT_SERVICE_URL=http://product-service:5002
ORDER_SERVICE_URL=http://order-service:5003
PAYMENT_SERVICE_URL=http://payment-service:5004
FRONTEND_URL=http://localhost:3001
RATE_LIMIT_MAX=200
RATE_LIMIT_WINDOW_MS=900000
```

**user/.env**

```env
PORT=5001
MONGO_URI=mongodb://mongodb:27017/user-service
KAFKA_BROKER=kafka:9092
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

**product/.env**

```env
PORT=5002
MONGO_URI=mongodb://mongodb:27017/product-service
KAFKA_BROKER=kafka:9092
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**order/.env**

```env
PORT=5003
MONGO_URI=mongodb://mongodb:27017/order-service
KAFKA_BROKER=kafka:9092
JWT_SECRET=your_jwt_secret
```

**payment/.env**

```env
PORT=5004
MONGO_URI=mongodb://mongodb:27017/payment-service
KAFKA_BROKER=kafka:9092
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox
```

**email/.env**

```env
KAFKA_BROKER=kafka:9092
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
```

### 3. Run all services

```bash
# Build and start everything
docker compose up --build

# Run in background
docker compose up --build -d

# View logs
docker compose logs -f

# Stop everything
docker compose down

# Rebuild single service
docker compose build --no-cache api-gateway
docker compose up -d api-gateway
```

### 4. Stripe webhook (local development)

```bash
docker run --rm -it stripe/stripe-cli \
  --api-key sk_test_your_key \
  listen --forward-to host.docker.internal:5004/api/payments/stripe/webhook
```

Copy the printed `whsec_xxx` → paste into `payment/.env` as `STRIPE_WEBHOOK_SECRET` → restart payment service.

---

## 📡 API Endpoints

> All requests go through the API Gateway on port **5000**.
> Direct service ports (5001-5004) are still available for internal use.

### Users (→ user-service :5001)

| Method | Endpoint              | Description              |
| ------ | --------------------- | ------------------------ |
| POST   | `/api/users/register` | Register new user        |
| POST   | `/api/users/login`    | Login and get JWT cookie |
| POST   | `/api/users/logout`   | Logout                   |
| GET    | `/api/users/me`       | Get current user         |

### Products (→ product-service :5002)

| Method | Endpoint            | Description           |
| ------ | ------------------- | --------------------- |
| GET    | `/api/products`     | List all products     |
| GET    | `/api/products/:id` | Get single product    |
| POST   | `/api/products`     | Create product (auth) |
| PUT    | `/api/products/:id` | Update product (auth) |
| DELETE | `/api/products/:id` | Delete product (auth) |

### Orders (→ order-service :5003)

| Method | Endpoint                 | Description           |
| ------ | ------------------------ | --------------------- |
| POST   | `/api/orders`            | Create order          |
| GET    | `/api/orders`            | Get my orders         |
| GET    | `/api/orders/:id`        | Get single order      |
| PUT    | `/api/orders/:id/status` | Update status (admin) |
| DELETE | `/api/orders/:id`        | Cancel order + refund |

### Payments (→ payment-service :5004)

| Method | Endpoint                       | Description               |
| ------ | ------------------------------ | ------------------------- |
| POST   | `/api/payments/initiate`       | Initiate payment          |
| POST   | `/api/payments/paypal/capture` | Capture PayPal payment    |
| GET    | `/api/payments`                | Get my payments           |
| GET    | `/api/payments/order/:orderId` | Get payment by order      |
| POST   | `/api/payments/stripe/webhook` | Stripe webhook (internal) |

### Gateway

| Method | Endpoint  | Description                         |
| ------ | --------- | ----------------------------------- |
| GET    | `/health` | Gateway health check + service URLs |

---

## 🧪 Testing Payments

### Stripe test card

```
Card number: 4242 4242 4242 4242
Expiry:      12/26
CVC:         123
```

### PayPal sandbox

1. Get sandbox buyer credentials from https://developer.paypal.com/dashboard/accounts
2. Open `approveUrl` from order response in browser
3. Login with sandbox Personal account
4. Approve payment
5. Call `POST /api/payments/paypal/capture` with `{ paypalOrderId, orderId }`

---

## 🛠️ Tech Stack

| Category         | Technology               |
| ---------------- | ------------------------ |
| Runtime          | Node.js 20               |
| Language         | TypeScript               |
| Framework        | Express.js               |
| API Gateway      | http-proxy-middleware    |
| Database         | MongoDB + Mongoose       |
| Message Broker   | Apache Kafka (KafkaJS)   |
| Validation       | Zod                      |
| Auth             | JWT + bcrypt             |
| Image Upload     | Cloudinary               |
| Payments         | Stripe + PayPal REST API |
| Email            | Nodemailer + Gmail SMTP  |
| HTTP Client      | Axios                    |
| Logging          | Pino                     |
| Containerization | Docker + Docker Compose  |
| Hot Reload       | ts-node-dev              |

---

## 👨‍💻 Author

**Hazem Ghannem**
MS Software Engineering Student
Grand Valley State University
