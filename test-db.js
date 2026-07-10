const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres@127.0.0.1:5432/agentshare' });

async function main() {
  const res = await pool.query('SELECT * FROM pathway_tokens');
  console.log('Tokens:', res.rows);
  const users = await pool.query('SELECT * FROM users');
  console.log('Users:', users.rows);
  const assets = await pool.query('SELECT * FROM assets');
  console.log('Assets:', assets.rows);
  pool.end();
}
main();
