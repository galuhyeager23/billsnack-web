/* eslint-env node */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
// Load .env located in this server directory explicitly to avoid relying on process.cwd
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_OYsR8Q1MK24OCGL95AwHsA_wmP-fFPA';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

module.exports = supabase;
