const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function seed() {
  require('dotenv').config({ path: '.env.local' });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const hash = await bcrypt.hash('password', 10);
  
  await pool.query(
    `INSERT INTO users (id, email, password_hash, auth_provider) 
     VALUES ($1, $2, $3, 'credentials') 
     ON CONFLICT (email) DO UPDATE SET password_hash = $3`,
    ['00000000-0000-0000-0000-000000000001', 'test@example.com', hash]
  );
  
  console.log('Seeded test@example.com / password');
  process.exit(0);
}
seed();
