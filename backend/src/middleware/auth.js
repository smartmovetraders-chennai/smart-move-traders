/**
 * auth.js
 * Authentication middleware verifying Supabase JWT tokens.
 * Supports DEV_BYPASS_AUTH / testing mode when credentials are not yet supplied.
 */

const { supabase, isConfigured, isDevBypass } = require('../config/supabase');

const DEV_DEFAULT_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dealer@smartmovetraders.com',
  role: 'authenticated'
};

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Check for explicit dev bypass header or env config
    if (isDevBypass || process.env.NODE_ENV === 'test') {
      if (req.headers['x-dev-user-id']) {
        req.user = { id: req.headers['x-dev-user-id'], email: 'custom-dev@smartmovetraders.com' };
        return next();
      }
      if (!authHeader || authHeader.startsWith('Bearer dev-token') || authHeader.startsWith('Bearer mock-token')) {
        req.user = DEV_DEFAULT_USER;
        return next();
      }
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header missing or invalid. Format must be: Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!isConfigured) {
      if (isDevBypass || process.env.NODE_ENV === 'test') {
        req.user = DEV_DEFAULT_USER;
        return next();
      }
      return res.status(503).json({
        success: false,
        error: 'Authentication service not yet configured. Please supply Supabase credentials in .env.'
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session token.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authenticate,
  DEV_DEFAULT_USER
};
