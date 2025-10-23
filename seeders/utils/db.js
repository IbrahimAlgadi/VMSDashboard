const { Client } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vms_dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

class DatabaseSeeder {
  constructor() {
    this.client = new Client(dbConfig);
    this.isConnected = false;
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      console.log('✅ Database connected');
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.end();
      this.isConnected = false;
      console.log('🔌 Database disconnected');
    }
  }

  async query(text, params) {
    return await this.client.query(text, params);
  }

  async clearTable(tableName) {
    console.log(`🗑️  Clearing table: ${tableName}`);
    await this.query(`DELETE FROM ${tableName}`);
    // Reset sequence if exists
    try {
      await this.query(`ALTER SEQUENCE ${tableName}_id_seq RESTART WITH 1`);
    } catch (error) {
      // Sequence might not exist, ignore error
    }
  }

  async insertBatch(tableName, data, conflictResolution = 'DO NOTHING') {
    if (!data || data.length === 0) {
      console.log(`⚠️  No data to insert for ${tableName}`);
      return [];
    }

    const columns = Object.keys(data[0]);
    const values = data.map(row => columns.map(col => row[col]));
    
    const placeholders = data.map((_, rowIndex) => 
      `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
    ).join(', ');

    const flatValues = [].concat(...values);
    
    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${placeholders}
      ON CONFLICT ${conflictResolution}
      RETURNING id
    `;

    try {
      const result = await this.query(query, flatValues);
      console.log(`✅ Inserted ${result.rows.length} records into ${tableName}`);
      return result.rows;
    } catch (error) {
      console.error(`❌ Error inserting into ${tableName}:`, error.message);
      throw error;
    }
  }

  async getTableCount(tableName) {
    const result = await this.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  }

  async tableExists(tableName) {
    const result = await this.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    return result.rows[0].exists;
  }
}

module.exports = DatabaseSeeder;
