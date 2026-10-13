/**
 * auth.js
 * Authentication middleware verifying Supabase JWT tokens.
 * Supports DEV_BYPASS_AUTH / testing mode when credentials are not yet supplied.
 */

const { supabase, isConfigured, isDevBypass } = require('../config/supabase');

const DEV_DEFAULT_USER = {
  id: '9b1179b5-fb63-4ae2-b6b5-a62962663039',
  email: 'dealer@smartmovetraders.com',
  role: 'authenticated'
};

let cachedDevUser = null;

async function getDevUser() {
  if (cachedDevUser) return cachedDevUser;

  if (isConfigured && supabase) {
    try {
      const { data } = await supabase.auth.admin.listUsers();
      if (data && data.users && data.users.length > 0) {
        cachedDevUser = {
          id: data.users[0].id,
          email: data.users[0].email,
          role: 'authenticated'
        };
        return cachedDevUser;
      }
    } catch {
      // Fallback if admin query fails
    }
  }

  return DEV_DEFAULT_USER;
}

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Check for explicit dev bypass header or env config
    if (isDevBypass || process.env.NODE_ENV === 'test') {
      const devUser = await getDevUser();

      if (req.headers['x-dev-user-id']) {
        req.user = { id: req.headers['x-dev-user-id'], email: 'custom-dev@smartmovetraders.com' };
        return next();
      }
      if (!authHeader || authHeader.startsWith('Bearer dev-token') || authHeader.startsWith('Bearer mock-token')) {
        req.user = devUser;
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
        req.user = await getDevUser();
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
  DEV_DEFAULT_USER,
  getDevUser
};
