const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.key;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase URL or Key is missing from environment variables.');
}

const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseKey || 'placeholder-key'
);

module.exports = supabase;
