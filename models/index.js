const { Sequelize } = require('sequelize');

// Initialize database - In-memory SQLite for production (Vercel), file SQLite for development, or Supabase Postgres
let sequelize;

if (process.env.USE_SUPABASE === 'true' && process.env.SUPABASE_DB_URL) {
  // Supabase PostgreSQL
  let dbUrl = process.env.SUPABASE_DB_URL;
  // Fix for unencoded @ in password
  if (dbUrl.includes('pass@Apple2004')) {
    dbUrl = dbUrl.replace('pass@Apple2004', 'pass%40Apple2004');
  }
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else if (process.env.NODE_ENV === 'production') {
  // Production: Use in-memory SQLite (works on serverless)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:', // In-memory database
    logging: false
  });
} else {
  // Development: Use file-based SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false
  });
}

module.exports = sequelize;
