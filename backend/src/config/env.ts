import dotenv from 'dotenv';

dotenv.config();

/**
 * Safely retrieve environment variable with validation
 * @throws Error if required variable is missing
 */
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];

  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not defined. This is a critical configuration.`);
  }

  const result = value || defaultValue || '';

  if (!result) {
    throw new Error(`Environment variable ${key} is empty. Please provide a valid value.`);
  }

  return result;
};

/**
 * Validate URL format
 */
const validateUrl = (url: string, name: string): string => {
  try {
    new URL(url);
    return url;
  } catch {
    throw new Error(`Environment variable ${name} (${url}) is not a valid URL`);
  }
};

/**
 * Validate port number
 */
const validatePort = (port: number): number => {
  if (port < 1 || port > 65535) {
    throw new Error(`Port ${port} is out of valid range (1-65535)`);
  }
  return port;
};

/**
 * Validate JWT secret strength
 */
const validateJwtSecret = (secret: string): string => {
  if (secret.length < 32) {
    throw new Error(`JWT_SECRET must be at least 32 characters long for security (current: ${secret.length}). Current value is too weak.`);
  }
  return secret;
};

const nodeEnv = getEnv('NODE_ENV', 'development') as 'development' | 'production' | 'staging';
const port = validatePort(parseInt(getEnv('PORT', '3000'), 10));
const databaseUrl = validateUrl(getEnv('DATABASE_URL'), 'DATABASE_URL');
const redisUrl = validateUrl(getEnv('REDIS_URL', 'redis://localhost:6379'), 'REDIS_URL');
const jwtSecret = validateJwtSecret(getEnv('JWT_SECRET'));
const appUrl = validateUrl(getEnv('APP_URL', 'http://localhost:3000'), 'APP_URL');

export const env = {
  // Server
  port,
  nodeEnv,

  // Database
  databaseUrl,

  // JWT
  jwtSecret,
  jwtExpiration: getEnv('JWT_EXPIRATION', '24h'),

  // Redis
  redisUrl,

  // SMS
  smsProvider: getEnv('SMS_PROVIDER', 'mock') as 'mock' | 'twilio' | 'smsapi' | 'other',
  smsApiKey: getEnv('SMS_API_KEY', ''),
  smsSenderName: getEnv('SMS_SENDER_NAME', 'LotosSPA'),

  // Email
  emailHost: getEnv('EMAIL_HOST', 'smtp.gmail.com'),
  emailPort: validatePort(parseInt(getEnv('EMAIL_PORT', '587'), 10)),
  emailUser: getEnv('EMAIL_USER', ''),
  emailPassword: getEnv('EMAIL_PASSWORD', ''),
  emailFromAddress: getEnv('EMAIL_FROM_ADDRESS', getEnv('EMAIL_USER', 'noreply@lotosspa.pl')),

  // Payment
  paymentProvider: getEnv('PAYMENT_PROVIDER', 'mock') as 'mock' | 'stripe' | 'przelewy24' | 'payu',
  paymentWebhookSecret: getEnv('PAYMENT_WEBHOOK_SECRET', 'webhook-secret'),
  appUrl,

  // App
  appName: getEnv('APP_NAME', 'Lotos SPA'),
  appVersion: getEnv('APP_VERSION', '1.0.0'),
  appTimezone: getEnv('APP_TIMEZONE', 'Europe/Warsaw'),

  // Request limits
  maxBodySize: parseInt(getEnv('MAX_BODY_SIZE', '10485760'), 10), // 10MB default
  maxJsonSize: parseInt(getEnv('MAX_JSON_SIZE', '1048576'), 10), // 1MB default
  requestTimeoutMs: parseInt(getEnv('REQUEST_TIMEOUT_MS', '30000'), 10), // 30s default

  // Pagination
  defaultPageSize: parseInt(getEnv('DEFAULT_PAGE_SIZE', '10'), 10),
  maxPageSize: parseInt(getEnv('MAX_PAGE_SIZE', '100'), 10),

  // Features
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  isStaging: nodeEnv === 'staging',
};
