process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { Client } from 'pg';

const connectionString = "postgres://postgres.utctfircycpjmpjqmtmm:rlntkAiBRYnzVjSD@aws-0-eu-central-2.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

async function setupDatabase() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL database.");

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS leads (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        brand VARCHAR(255),
        model VARCHAR(255),
        year VARCHAR(255),
        service VARCHAR(255),
        location VARCHAR(255),
        photo_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createTableQuery);
    console.log("Table 'leads' created successfully or already exists.");
  } catch (err) {
    console.error("Error setting up database:", err);
  } finally {
    await client.end();
  }
}

setupDatabase();
