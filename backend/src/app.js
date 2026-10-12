/**
 * app.js
 * Express application configuration for Smart Move Traders.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const healthRoutes = require('./routes/healthRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const businessRoutes = require('./routes/businessRoutes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: '*', // Allow mobile apps and web dashboard
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-user-id']
}));

// Body parser
app.use(express.json({ limit: '1mb' }));

// Logging (disabled during tests)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Rate limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // relaxed for local dev and mobile testing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', limiter);

// Mount API routes
app.use('/api', healthRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/business', businessRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
