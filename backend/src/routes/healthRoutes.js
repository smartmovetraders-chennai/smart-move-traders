const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');

/**
 * GET /health and /ping
 * Lightweight health check endpoint that keeps both Vercel Serverless
 * and Supabase PostgreSQL alive without consuming database storage.
 */
const healthHandler = async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'unconfigured';
  let dbConnected = false;
  let latencyMs = 0;
  let dbError = null;

  if (isConfigured && supabase) {
    try {
      const pingStart = Date.now();
      // Zero-storage read ping: head: true triggers a count query in PostgreSQL
      // which registers active database traffic on Supabase and prevents 7-day pause
      const { error } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true });

      latencyMs = Date.now() - pingStart;

      if (error) {
        // Fallback lightweight limit(1) query
        const fallback = await supabase.from('invoices').select('id').limit(1);
        if (fallback.error) {
          dbStatus = 'error';
          dbError = fallback.error.message;
        } else {
          dbStatus = 'connected';
          dbConnected = true;
        }
      } else {
        dbStatus = 'connected';
        dbConnected = true;
      }
    } catch (err) {
      dbStatus = 'unreachable';
      dbError = err.message;
    }
  } else {
    dbStatus = 'mock_active';
    dbConnected = true;
  }

  const totalTimeMs = Date.now() - startTime;
  const isOk = dbConnected;

  res.status(isOk ? 200 : 503).json({
    status: isOk ? 'ok' : 'degraded',
    service: 'Smart Move Traders Billing API',
    business: 'Smart Move Traders',
    address: 'Plot 8, GF, Bharathiyar Street, Maruthi Nagar, Phase 1, Thundalam, Chennai - 600077',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    vercel: {
      status: 'alive',
      environment: process.env.NODE_ENV || 'production',
      region: process.env.VERCEL_REGION || 'local'
    },
    supabase: {
      status: dbStatus,
      connected: dbConnected,
      activityRegistered: dbConnected,
      storageConsumedBytes: 0,
      latencyMs: latencyMs,
      note: 'Zero-storage read ping prevents 7-day inactivity pause',
      error: dbError
    },
    totalResponseTimeMs: totalTimeMs
  });
};

router.get('/health', healthHandler);
router.get('/ping', healthHandler);

module.exports = router;
