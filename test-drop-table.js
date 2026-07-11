const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log(`Connecting as: ${process.env.DATABASE_URL.split('@')[0].split('//')[1].split(':')[0]}`);
    console.log("Attempting to run: DROP TABLE audit_logs;");
    await pool.query("DROP TABLE audit_logs;");
    console.log("SUCCESS?! (This should not happen!)");
  } catch (error) {
    console.error("EXPECTED ERROR:", error.message);
  } finally {
    await pool.end();
  }
}

run();
