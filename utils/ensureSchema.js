async function getTableColumns(sequelize, tableName) {
  try {
    if (sequelize.options.dialect === 'postgres') {
      const [rows] = await sequelize.query(`
        SELECT column_name as name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}';
      `);
      return new Set((rows || []).map(row => row.name));
    } else {
      // SQLite
      const [rows] = await sequelize.query(`PRAGMA table_info('${tableName}')`);
      return new Set((rows || []).map(row => row.name));
    }
  } catch (error) {
    console.error(`Error getting columns for ${tableName}:`, error.message);
    return new Set();
  }
}

async function ensureBookingSchema(sequelize) {
  try {
    const columns = await getTableColumns(sequelize, 'Bookings');
    // If table doesn't exist yet, columns will be empty, skip manual alter since sync() handles it
    if (!columns || !columns.size) return;

    const alterations = [];
    const isPostgres = sequelize.options.dialect === 'postgres';
    const quote = isPostgres ? '"' : '`';

    if (!columns.has('userId')) {
      alterations.push(`ALTER TABLE ${quote}Bookings${quote} ADD COLUMN ${quote}userId${quote} INTEGER;`);
    }
    if (!columns.has('location')) {
      alterations.push(`ALTER TABLE ${quote}Bookings${quote} ADD COLUMN ${quote}location${quote} VARCHAR(255) NOT NULL DEFAULT '';`);
    }
    if (!columns.has('notes')) {
      alterations.push(`ALTER TABLE ${quote}Bookings${quote} ADD COLUMN ${quote}notes${quote} TEXT;`);
    }
    if (!columns.has('estimatedArrival')) {
      alterations.push(`ALTER TABLE ${quote}Bookings${quote} ADD COLUMN ${quote}estimatedArrival${quote} ${isPostgres ? 'TIMESTAMP' : 'DATETIME'};`);
    }
    if (!columns.has('completedAt')) {
      alterations.push(`ALTER TABLE ${quote}Bookings${quote} ADD COLUMN ${quote}completedAt${quote} ${isPostgres ? 'TIMESTAMP' : 'DATETIME'};`);
    }
    if (!columns.has('patientCount')) {
      alterations.push(`ALTER TABLE ${quote}Bookings${quote} ADD COLUMN ${quote}patientCount${quote} INTEGER DEFAULT 1;`);
    }
    if (!columns.has('incidentDescription')) {
      alterations.push(`ALTER TABLE ${quote}Bookings${quote} ADD COLUMN ${quote}incidentDescription${quote} TEXT;`);
    }
    if (!columns.has('preparationNeeded')) {
      alterations.push(`ALTER TABLE ${quote}Bookings${quote} ADD COLUMN ${quote}preparationNeeded${quote} TEXT;`);
    }
    
    for (const sql of alterations) {
      console.log(`🔧 Applying schema update: ${sql}`);
      await sequelize.query(sql);
    }
    if (alterations.length === 0) {
      console.log('✅ Booking schema is up to date.');
    }
  } catch (error) {
    console.error('Error in ensureBookingSchema:', error.message);
  }
}

module.exports = {
  ensureBookingSchema
};
