const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars - try multiple paths
const envPath = path.join(__dirname, '..', '.env');
const envPathAlt = path.join(__dirname, '.env'); // Also try same directory

// Load from parent directory first (backend/.env)
const result = dotenv.config({ path: envPath });

if (result.error) {
  // Try alternative path
  dotenv.config({ path: envPathAlt });
}

// Also load from process.env (in case it's already loaded)
dotenv.config();

// Supabase configuration - support multiple naming conventions
const supabaseUrl = process.env.SUPABASE_URL || process.env.project_url;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.SUPABASE_ANON_KEY || 
                          process.env.servicerole_key || 
                          process.env.anon_key;

// Debug: Show what we found (without exposing full keys)
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️  Supabase configuration missing!');
  console.error('\n📋 Current environment variables:');
  console.error(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set (' + supabaseUrl.substring(0, 30) + '...)' : '❌ Missing'}`);
  console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.error(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
  console.error('\n💡 Please check your .env file in the backend/ directory');
  console.error('   Make sure the variable names are exactly:');
  console.error('   - SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY=your-key-here');
  console.error('   OR');
  console.error('   - SUPABASE_ANON_KEY=your-key-here');
  console.error('\n   Note: No spaces around the = sign!');
  process.exit(1);
}

// Create Supabase client with service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
const connectDB = async () => {
  try {
    // Test query to verify connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected on first run)
      throw error;
    }

    console.log('✅ Supabase Connected Successfully');
    console.log(`📊 Project URL: ${supabaseUrl}`);
    return supabase;
  } catch (error) {
    console.error('❌ Supabase connection error:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.message.includes('Invalid API key')) {
      console.error('⚠️  Invalid Supabase API key. Please check your SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.');
    } else if (error.message.includes('Failed to fetch')) {
      console.error('⚠️  Connection failed. Please check your SUPABASE_URL and network connection.');
    }
    
    process.exit(1);
  }
};

module.exports = { supabase, connectDB };

