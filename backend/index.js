const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./src/config/env');
const authRoutes = require('./src/routes/auth');
const transactionRoutes = require('./src/routes/transactions');
const balanceRoutes = require('./src/routes/balance');
const categoryRoutes = require('./src/routes/categories');
const paymentMethodRoutes = require('./src/routes/paymentMethods');
const eventRoutes = require('./src/routes/events');
const userRoutes = require('./src/routes/users');
const shoppingListRoutes = require('./src/routes/shoppingList');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Hello from Dokploy!');
});

app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/balance', balanceRoutes);
app.use('/categories', categoryRoutes);
app.use('/payment-methods', paymentMethodRoutes);
app.use('/events', eventRoutes);
app.use('/users', userRoutes);
app.use('/shopping-list', shoppingListRoutes);

module.exports = app;
