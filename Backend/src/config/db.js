const mongoose = require('mongoose');

const config = require('./configService');

const EXPECTED_DB_NAME = 'workquora';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, { dbName: EXPECTED_DB_NAME });
    console.log(`✅ MongoDB Connected: ${conn.connection.host} (db: ${conn.connection.name})`);
    // MONGO_URI omitting a /dbname segment silently connects to a database
    // literally named "test" — this has bitten this project before. The
    // explicit dbName option above forces the right database regardless of
    // what the URI says, but we still check and shout loudly if the URI
    // itself looks misconfigured, so a bad env var gets noticed immediately.
    if (conn.connection.name !== EXPECTED_DB_NAME) {
      console.error(`⚠️⚠️⚠️  MongoDB connected to database "${conn.connection.name}", expected "${EXPECTED_DB_NAME}"! Check MONGO_URI.`);
    }
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1); // Stop the server if DB fails
  }
};

module.exports = connectDB;