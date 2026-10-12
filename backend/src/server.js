/**
 * server.js
 * Server entry point for Smart Move Traders Billing Backend.
 */

const app = require('./app');
const { BUSINESS_DETAILS } = require('./config/constants');
const { isConfigured } = require('./config/supabase');

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0'; // Bind to all interfaces so mobile devices on LAN can connect

const server = app.listen(PORT, HOST, () => {
  console.log('================================================================');
  console.log(`  ${BUSINESS_DETAILS.name.toUpperCase()}`);
  console.log(`  ${BUSINESS_DETAILS.fullAddress}`);
  console.log('================================================================');
  console.log(`  Billing API Server listening on http://${HOST}:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  Invoices:     http://localhost:${PORT}/api/invoices`);
  console.log(`  Reports:      http://localhost:${PORT}/api/reports/summary`);
  console.log(`  Supabase:     ${isConfigured ? 'CONNECTED' : 'MOCK / DEV MODE (offline ready)'}`);
  console.log('================================================================');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server terminated.');
  });
});

module.exports = server;
