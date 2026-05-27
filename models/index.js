const { Sequelize } = require('sequelize');

// Initialize Supabase PostgreSQL database
if (!process.env.SUPABASE_DB_URL) {
  console.error('❌ ERROR: SUPABASE_DB_URL environment variable is required');
  throw new Error('SUPABASE_DB_URL environment variable is required. Please configure Supabase database.');
}

console.log('🚀 Connecting to Supabase PostgreSQL database');

const sequelize = new Sequelize(process.env.SUPABASE_DB_URL, {
  dialect: 'postgres',
  dialectModule: require('pg'),
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

module.exports = sequelize;
