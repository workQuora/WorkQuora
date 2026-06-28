const dotenv = require('dotenv');
const { z } = require('zod');

// Load environment variables from .env file
dotenv.config();

// Define validation schema for environment variables (Vol 6 & 11)
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  MONGO_URI: z.string({
    required_error: 'MONGO_URI is required for database connection'
  }),
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET is required'
  }),
  REDIS_URL: z.string().optional().nullable(),
  QUEUE_PROVIDER: z.enum(['local', 'redis']).default('local'),
  GEMINI_API_KEY: z.string().optional().nullable(),
});

// Perform validation
const envCheck = envSchema.safeParse(process.env);

if (!envCheck.success) {
  console.error('❌ Environment validation failed:', JSON.stringify(envCheck.error.format(), null, 2));
  process.exit(1); // Fail fast
}

const config = {
  env: envCheck.data.NODE_ENV,
  port: envCheck.data.PORT,
  mongoUri: envCheck.data.MONGO_URI,
  jwtSecret: envCheck.data.JWT_SECRET,
  redisUrl: envCheck.data.REDIS_URL || null,
  queueProvider: envCheck.data.QUEUE_PROVIDER,
  geminiApiKey: envCheck.data.GEMINI_API_KEY || null,
  enableRedisCache: !!envCheck.data.REDIS_URL,
};

module.exports = config;
