const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function deploySchema() {
  // Try connection string format
  const connectionString = 'postgresql://postgres:mission-control@db.emsivxzsrkovjrrpquki.supabase.co:5432/postgres?sslmode=require';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📦 Deploying schema...\n');
    
    // Execute the schema
    await client.query(schema);
    
    console.log('✅ Schema deployed successfully!\n');

    // Verify tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📋 Tables created:');
    result.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });

    // Count agents
    const agentCount = await client.query('SELECT COUNT(*) FROM agents');
    console.log(`\n🤖 Agents seeded: ${agentCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Tables may already exist. This is fine if re-running.');
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔒 Connection closed.');
  }
}

deploySchema();
