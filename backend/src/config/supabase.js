/**
 * supabase.js
 * Supabase client initialization with support for mock in-memory fallback
 * for local development and offline automated testing.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isDevBypass = process.env.DEV_BYPASS_AUTH === 'true';

let supabaseClient = null;

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceRoleKey &&
  !supabaseUrl.includes('YOUR-PROJECT') &&
  !supabaseServiceRoleKey.includes('your-service-role-key')
);

if (isConfigured) {
  supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// In-memory mock store for testing and when Supabase credentials are not yet configured
class MockDatabase {
  constructor() {
    this.invoices = new Map();
    this.businessProfile = new Map();
  }

  reset() {
    this.invoices.clear();
    this.businessProfile.clear();
  }
}

const mockDb = new MockDatabase();

module.exports = {
  supabase: supabaseClient,
  isConfigured,
  isDevBypass,
  mockDb
};
