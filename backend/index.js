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
const calendarCategoryRoutes = require('./src/routes/calendarCategories');
const userRoutes = require('./src/routes/users');
const shoppingListRoutes = require('./src/routes/shoppingList');
const flyersRoutes = require('./src/routes/flyers');
const pushRoutes = require('./src/routes/push');
const maintenanceRoutes = require('./src/routes/maintenance');
const fitnessRoutes = require('./src/routes/fitness');
const interestsRouter = require('./src/routes/interests');
const eventSuggestionsRouter = require('./src/routes/eventSuggestions');
const internalRouter = require('./src/routes/internal');

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
app.use('/calendar-categories', calendarCategoryRoutes);
app.use('/users', userRoutes);
app.use('/shopping-list', shoppingListRoutes);
app.use('/flyers', flyersRoutes);
app.use('/push', pushRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/fitness', fitnessRoutes);
app.use('/api/interests', interestsRouter);
app.use('/api/event-suggestions', eventSuggestionsRouter);
app.use('/api/internal', internalRouter);

module.exports = app;
