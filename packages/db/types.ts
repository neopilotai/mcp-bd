// Database types for MCP-BD Explorer
// Auto-generated from database schema

export interface Domain {
  id: string;
  domain: string;
  status: 'active' | 'inactive' | 'pending' | 'error';
  first_seen: string;
  last_crawled?: string;
  crawl_frequency_hours: number;
  priority: number;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Crawl {
  id: string;
  domain_id: string;
  url: string;
  title?: string;
  description?: string;
  http_status?: number;
  response_time_ms?: number;
  content_length?: number;
  content_type?: string;
  meta_keywords?: string;
  meta_author?: string;
  language?: string;
  favicon_url?: string;
  screenshot_url?: string;
  headers: Record<string, any>;
  technologies: Record<string, any>;
  performance_metrics: Record<string, any>;
  accessibility_score?: number;
  seo_score?: number;
  error_message?: string;
  crawled_at: string;
  created_at: string;
}

export interface Whois {
  id: string;
  domain_id: string;
  registrar?: string;
  registrant_name?: string;
  registrant_email?: string;
  registrant_organization?: string;
  registrant_country?: string;
  admin_contact: Record<string, any>;
  tech_contact: Record<string, any>;
  name_servers?: string[];
  creation_date?: string;
  expiration_date?: string;
  updated_date?: string;
  status?: string[];
  raw_text?: string;
  last_updated: string;
  created_at: string;
}

export interface SslCert {
  id: string;
  domain_id: string;
  issuer?: string;
  subject?: string;
  serial_number?: string;
  fingerprint_sha1?: string;
  fingerprint_sha256?: string;
  signature_algorithm?: string;
  public_key_algorithm?: string;
  key_size?: number;
  valid_from?: string;
  valid_to?: string;
  san_domains?: string[];
  is_wildcard: boolean;
  is_self_signed: boolean;
  is_expired: boolean;
  is_revoked: boolean;
  certificate_chain: Record<string, any>;
  ocsp_status?: string;
  ct_logs: Record<string, any>;
  vulnerability_scan: Record<string, any>;
  last_checked: string;
  created_at: string;
}

export interface Job {
  id: string;
  domain_id: string;
  job_type: 'crawl' | 'whois' | 'ssl_check' | 'dns_lookup';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  attempts: number;
  max_attempts: number;
  payload: Record<string, any>;
  result: Record<string, any>;
  error_message?: string;
  worker_id?: string;
  started_at?: string;
  finished_at?: string;
  next_retry_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DnsRecord {
  id: string;
  domain_id: string;
  record_type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'TXT' | 'SOA';
  name: string;
  value: string;
  ttl?: number;
  priority?: number;
  last_resolved: string;
  created_at: string;
}

export interface Analytics {
  id: string;
  metric_name: string;
  metric_value?: number;
  dimensions: Record<string, any>;
  timestamp: string;
  created_at: string;
}

export interface DomainSummary {
  id: string;
  domain: string;
  status: string;
  last_crawled?: string;
  priority: number;
  tags: string[];
  title?: string;
  description?: string;
  http_status?: number;
  response_time_ms?: number;
  expiration_date?: string;
  registrar?: string;
  ssl_expires?: string;
  ssl_expired?: boolean;
}

export interface DomainStats {
  total_domains: number;
  active_domains: number;
  inactive_domains: number;
  pending_domains: number;
  crawls_today: number;
  failed_crawls_today: number;
  avg_response_time: number;
  ssl_expiring_soon: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Worker types
export interface CrawlJob {
  id: string;
  domain: string;
  url: string;
  options: {
    depth?: number;
    followRedirects?: boolean;
    timeout?: number;
    userAgent?: string;
  };
}

export interface CrawlResult {
  success: boolean;
  data?: Partial<Crawl>;
  error?: string;
  metadata?: Record<string, any>;
}

export interface WhoisResult {
  success: boolean;
  data?: Partial<Whois>;
  error?: string;
}

export interface SslCheckResult {
  success: boolean;
  data?: Partial<SslCert>;
  error?: string;
}

export interface DnsLookupResult {
  success: boolean;
  data?: DnsRecord[];
  error?: string;
}