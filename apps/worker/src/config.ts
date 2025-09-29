import { config } from 'dotenv';

// Load environment variables
config();

export const Config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Worker settings
  WORKER_ID: process.env.WORKER_ID || `worker-${Math.random().toString(36).substr(2, 9)}`,
  WORKER_CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY || '5'),
  POLL_INTERVAL_MS: parseInt(process.env.POLL_INTERVAL_MS || '5000'),
  
  // Retry settings
  RETRY_MAX_ATTEMPTS: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3'),
  RETRY_DELAY_MS: parseInt(process.env.RETRY_DELAY_MS || '1000'),
  RETRY_BACKOFF_MULTIPLIER: parseFloat(process.env.RETRY_BACKOFF_MULTIPLIER || '2'),
  
  // Crawling settings
  REQUEST_TIMEOUT_MS: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000'),
  USER_AGENT: process.env.USER_AGENT || 'MCP-BD-ResearchBot/1.0 (+https://mcp-bd-explorer.com/bot)',
  RESPECT_ROBOTS_TXT: process.env.RESPECT_ROBOTS_TXT !== 'false',
  MAX_REDIRECTS: parseInt(process.env.MAX_REDIRECTS || '5'),
  
  // Rate limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
  RATE_LIMIT_REQUESTS_PER_DOMAIN: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_DOMAIN || '10'),
  
  // SSL/TLS settings
  SSL_CHECK_TIMEOUT_MS: parseInt(process.env.SSL_CHECK_TIMEOUT_MS || '10000'),
  
  // WHOIS settings
  WHOIS_TIMEOUT_MS: parseInt(process.env.WHOIS_TIMEOUT_MS || '15000'),
  
  // DNS settings
  DNS_TIMEOUT_MS: parseInt(process.env.DNS_TIMEOUT_MS || '5000'),
  DNS_SERVERS: process.env.DNS_SERVERS?.split(',') || ['8.8.8.8', '1.1.1.1'],
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'json',
  
  // Health check
  HEALTH_CHECK_PORT: parseInt(process.env.HEALTH_CHECK_PORT || '3001'),
  
  // Metrics
  METRICS_ENABLED: process.env.METRICS_ENABLED === 'true',
  METRICS_PORT: parseInt(process.env.METRICS_PORT || '3002'),
} as const;

// Validate required configuration
const requiredConfig = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

for (const key of requiredConfig) {
  if (!Config[key as keyof typeof Config]) {
    throw new Error(`Missing required configuration: ${key}`);
  }
}