import 'dotenv/config';
import pg from 'pg';

console.log('═══════════════════════════════════════════════════════════');
console.log('Testing Supabase Database Connection...');
console.log('═══════════════════════════════════════════════════════════');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Mask password in logs
const maskedUrl = databaseUrl.replace(/:[^:/@]+@/, ':****@');
console.log('Database URL (masked):', maskedUrl);

try {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });

  console.log('Attempting to connect...');
  const client = await pool.connect();
  console.log('✓ Connected successfully!');

  // Test a simple query
  const result = await client.query('SELECT NOW()');
  console.log('✓ Query successful! Current time:', result.rows[0]);

  // Check if users table exists
  const tableCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'users'
    );
  `);
  
  if (tableCheck.rows[0]?.exists) {
    console.log('✓ Users table exists');
    
    // Count users
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✓ Current users in database: ${userCount.rows[0].count}`);
  } else {
    console.log('⚠ Users table does not exist - you may need to run migrations');
  }

  client.release();
  await pool.end();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✓ Database connection test PASSED');
  console.log('═══════════════════════════════════════════════════════════');

} catch (error) {
  console.error('═══════════════════════════════════════════════════════════');
  console.error('❌ Database connection test FAILED');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('Error:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Verify DATABASE_URL is correct in .env file');
  console.error('2. Ensure Supabase project is active and tables are created');
  console.error('3. Check if special characters in password need URL encoding');
  console.error('4. Verify network access from your IP address');
  process.exit(1);
}
