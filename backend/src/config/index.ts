import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'fintrack_jwt_access_secret_key_super_secure_32_chars_min',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fintrack_jwt_refresh_secret_key_super_secure_32_chars_min',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS ||
    'https://fintrack-expense-tracker-xi.vercel.app,http://localhost:5173,https://localhost,capacitor://localhost'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};
