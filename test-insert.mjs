import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual simple .env parser
const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log("Fetching users...");
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error("Error fetching users:", usersError);
    return;
  }

  if (!users || users.length === 0) {
    console.error("No users found in auth.users. Please sign up in the app first!");
    return;
  }

  const user = users[0];
  console.log(`Found user: ${user.email} (${user.id})`);

  console.log("Attempting to insert a random asset (AAPL)...");
  
  const { data, error } = await supabase
    .from("portfolio_holdings")
    .insert({
      user_id: user.id,
      symbol: "AAPL",
      quantity: 10,
      avg_buy_price: 150.50,
      currency: "USD",
      notes: "Test holding inserted by AI"
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to insert holding! Database error:", error);
  } else {
    console.log("Successfully inserted holding:", data);
  }
}

main();
