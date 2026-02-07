# Truvamate Backend

Backend API for Truvamate Marketplace - USA Import & Special Products Platform

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials and API keys
```

### Database Setup

```bash
# Create PostgreSQL database
createdb truvamate_db

# Run migrations (auto-created in dev mode)
npm run dev
```

### Development

```bash
npm run dev
```

Server will run on `http://localhost:5000`

### Production

```bash
# Build
npm run build

# Start
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── entities/          # TypeORM entities (database models)
│   ├── controllers/       # Route controllers
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic
│   ├── jobs/             # Cron jobs & background tasks
│   ├── utils/            # Utility functions
│   ├── config/           # Configuration files
│   └── server.ts         # Entry point
├── dist/                 # Compiled JavaScript
├── logs/                 # Log files
└── uploads/              # File uploads
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Lotto
- `GET /api/lotto/jackpots` - Get current jackpots
- `GET /api/lotto/games` - Get game rules
- `POST /api/lotto/orders` - Create order
- `GET /api/lotto/orders` - Get user's orders
- `GET /api/lotto/tickets` - Get user's tickets
- `POST /api/lotto/quick-pick` - Generate random numbers

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/:id/status` - Check payment status
- `POST /api/payments/webhook` - Payment webhook (Stripe)

## 🔧 Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- `SENDGRID_API_KEY`
- `REDIS_HOST`, `REDIS_PORT`

## 🗄️ Database Schema

- **users** - User accounts
- **lotto_orders** - Lottery orders
- **lotto_tickets** - Individual tickets
- **draw_results** - Lottery draw results
- **payments** - Payment transactions
- **marketplace_orders** - Marketplace orders (future)
- **order_items** - Order line items (future)

## 🕐 Cron Jobs

- **Every hour**: Update jackpots from lottery APIs
- **Daily 1 AM**: Fetch latest draw results
- **Daily 2 AM**: Check all pending tickets for wins
- **Every 5 minutes**: Process email queue

## 🔒 Security

- JWT authentication
- bcrypt password hashing
- Helmet.js security headers
- CORS configuration
- Rate limiting
- Input validation (Joi)
- SQL injection prevention (TypeORM)

## 📧 Email System

Uses SendGrid for transactional emails:
- Order confirmation
- Purchase notification
- Draw results
- Winner notifications

## 💳 Payment Integration

- **Stripe** - International credit cards
- **Omise** - Thai market (PromptPay, Thai cards)

## 📊 Logging

Winston logger with:
- Console output (development)
- File rotation (production)
- Error tracking
- Access logs

## 🧪 Testing

```bash
npm test
```

## 📝 License

MIT

## 👥 Team

Truvamate Development Team
