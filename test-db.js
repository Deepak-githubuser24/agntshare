const { Pool } = require('pg');

// Connection matches docker-compose.yml (user/password) and
const connectionString = process.env.DATABASE_URL
  || 'postgresql://user:password@localhost:5432/agentshare';

const pool = new Pool({ connectionString });

async function main() {
  try {
    console.log(`Connecting to: ${connectionString}`);
    
    const tables = await pool.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    console.log('Tables:', tables.rows.map(r => r.tablename));
    
    const users = await pool.query('SELECT id, email, auth_provider, created_at FROM users');
    console.log('Users:', users.rows);
    
    const keys = await pool.query('SELECT id, user_id, label, created_at, revoked_at FROM api_keys');
    console.log('API Keys:', keys.rows);
    
    const tokens = await pool.query('SELECT * FROM pathway_tokens');
    console.log('Tokens:', tokens.rows);
    
    const assets = await pool.query('SELECT id, owner_id, filename, content_type, size_bytes FROM assets');
    console.log('Assets:', assets.rows);
    
    console.log('\n✓ Database connection and schema verified.');
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
