const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL과 Key는 .env 파일에 반드시 있어야 합니다.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

