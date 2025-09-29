-- MCP-BD Explorer Database Schema
-- Initial migration with all core tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Domains table - Core domain registry
CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending', 'error')),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_crawled TIMESTAMP WITH TIME ZONE,
    crawl_frequency_hours INTEGER DEFAULT 24,
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 10),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crawls table - Store crawl results and webpage data
CREATE TABLE IF NOT EXISTS crawls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    http_status INTEGER,
    response_time_ms INTEGER,
    content_length INTEGER,
    content_type VARCHAR(100),
    meta_keywords TEXT,
    meta_author TEXT,
    language VARCHAR(10),
    favicon_url TEXT,
    screenshot_url TEXT,
    headers JSONB DEFAULT '{}',
    technologies JSONB DEFAULT '{}', -- Detected tech stack
    performance_metrics JSONB DEFAULT '{}',
    accessibility_score INTEGER CHECK (accessibility_score BETWEEN 0 AND 100),
    seo_score INTEGER CHECK (seo_score BETWEEN 0 AND 100),
    error_message TEXT,
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WHOIS table - Domain registration information
CREATE TABLE IF NOT EXISTS whois (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    registrar VARCHAR(255),
    registrant_name VARCHAR(255),
    registrant_email VARCHAR(255),
    registrant_organization VARCHAR(255),
    registrant_country VARCHAR(2),
    admin_contact JSONB DEFAULT '{}',
    tech_contact JSONB DEFAULT '{}',
    name_servers TEXT[],
    creation_date TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    updated_date TIMESTAMP WITH TIME ZONE,
    status TEXT[],
    raw_text TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SSL Certificates table - SSL/TLS certificate monitoring
CREATE TABLE IF NOT EXISTS ssl_certs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    issuer VARCHAR(255),
    subject VARCHAR(255),
    serial_number VARCHAR(255),
    fingerprint_sha1 VARCHAR(40),
    fingerprint_sha256 VARCHAR(64),
    signature_algorithm VARCHAR(50),
    public_key_algorithm VARCHAR(50),
    key_size INTEGER,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_to TIMESTAMP WITH TIME ZONE,
    san_domains TEXT[], -- Subject Alternative Names
    is_wildcard BOOLEAN DEFAULT FALSE,
    is_self_signed BOOLEAN DEFAULT FALSE,
    is_expired BOOLEAN DEFAULT FALSE,
    is_revoked BOOLEAN DEFAULT FALSE,
    certificate_chain JSONB DEFAULT '{}',
    ocsp_status VARCHAR(20),
    ct_logs JSONB DEFAULT '{}', -- Certificate Transparency logs
    vulnerability_scan JSONB DEFAULT '{}',
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table - Crawl job queue and status tracking
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('crawl', 'whois', 'ssl_check', 'dns_lookup')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 10),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    payload JSONB DEFAULT '{}',
    result JSONB DEFAULT '{}',
    error_message TEXT,
    worker_id VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DNS Records table - DNS resolution results
CREATE TABLE IF NOT EXISTS dns_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    record_type VARCHAR(10) NOT NULL CHECK (record_type IN ('A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA')),
    name VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    ttl INTEGER,
    priority INTEGER, -- For MX records
    last_resolved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table - Aggregated statistics and metrics
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    dimensions JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_last_crawled ON domains(last_crawled);
CREATE INDEX IF NOT EXISTS idx_domains_priority ON domains(priority);
CREATE INDEX IF NOT EXISTS idx_domains_tags ON domains USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_crawls_domain_id ON crawls(domain_id);
CREATE INDEX IF NOT EXISTS idx_crawls_crawled_at ON crawls(crawled_at);
CREATE INDEX IF NOT EXISTS idx_crawls_http_status ON crawls(http_status);
CREATE INDEX IF NOT EXISTS idx_crawls_url ON crawls(url);

CREATE INDEX IF NOT EXISTS idx_whois_domain_id ON whois(domain_id);
CREATE INDEX IF NOT EXISTS idx_whois_expiration_date ON whois(expiration_date);
CREATE INDEX IF NOT EXISTS idx_whois_registrar ON whois(registrar);

CREATE INDEX IF NOT EXISTS idx_ssl_certs_domain_id ON ssl_certs(domain_id);
CREATE INDEX IF NOT EXISTS idx_ssl_certs_valid_to ON ssl_certs(valid_to);
CREATE INDEX IF NOT EXISTS idx_ssl_certs_is_expired ON ssl_certs(is_expired);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON jobs(priority);
CREATE INDEX IF NOT EXISTS idx_jobs_next_retry_at ON jobs(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_dns_records_domain_id ON dns_records(domain_id);
CREATE INDEX IF NOT EXISTS idx_dns_records_type ON dns_records(record_type);

CREATE INDEX IF NOT EXISTS idx_analytics_metric_name ON analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_domains_search ON domains USING GIN(to_tsvector('english', domain || ' ' || COALESCE(array_to_string(tags, ' '), '')));
CREATE INDEX IF NOT EXISTS idx_crawls_search ON crawls USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawls ENABLE ROW LEVEL SECURITY;
ALTER TABLE whois ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssl_certs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dns_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Allow public read access to domains" ON domains FOR SELECT USING (true);
CREATE POLICY "Allow public read access to crawls" ON crawls FOR SELECT USING (true);
CREATE POLICY "Allow public read access to whois" ON whois FOR SELECT USING (true);
CREATE POLICY "Allow public read access to ssl_certs" ON ssl_certs FOR SELECT USING (true);
CREATE POLICY "Allow public read access to dns_records" ON dns_records FOR SELECT USING (true);
CREATE POLICY "Allow public read access to analytics" ON analytics FOR SELECT USING (true);

-- Create RLS policies for authenticated write access
CREATE POLICY "Allow authenticated users to manage domains" ON domains FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to manage crawls" ON crawls FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to manage whois" ON whois FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to manage ssl_certs" ON ssl_certs FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to manage jobs" ON jobs FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to manage dns_records" ON dns_records FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to manage analytics" ON analytics FOR ALL USING (auth.uid() IS NOT NULL);

-- Create views for common queries
CREATE OR REPLACE VIEW domain_summary AS
SELECT 
    d.id,
    d.domain,
    d.status,
    d.last_crawled,
    d.priority,
    d.tags,
    c.title,
    c.description,
    c.http_status,
    c.response_time_ms,
    w.expiration_date,
    w.registrar,
    s.valid_to as ssl_expires,
    s.is_expired as ssl_expired
FROM domains d
LEFT JOIN LATERAL (
    SELECT title, description, http_status, response_time_ms
    FROM crawls 
    WHERE domain_id = d.id 
    ORDER BY crawled_at DESC 
    LIMIT 1
) c ON true
LEFT JOIN LATERAL (
    SELECT expiration_date, registrar
    FROM whois 
    WHERE domain_id = d.id 
    ORDER BY last_updated DESC 
    LIMIT 1
) w ON true
LEFT JOIN LATERAL (
    SELECT valid_to, is_expired
    FROM ssl_certs 
    WHERE domain_id = d.id 
    ORDER BY last_checked DESC 
    LIMIT 1
) s ON true;

-- Create function to get domain statistics
CREATE OR REPLACE FUNCTION get_domain_stats()
RETURNS TABLE(
    total_domains BIGINT,
    active_domains BIGINT,
    inactive_domains BIGINT,
    pending_domains BIGINT,
    crawls_today BIGINT,
    failed_crawls_today BIGINT,
    avg_response_time NUMERIC,
    ssl_expiring_soon BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM domains) as total_domains,
        (SELECT COUNT(*) FROM domains WHERE status = 'active') as active_domains,
        (SELECT COUNT(*) FROM domains WHERE status = 'inactive') as inactive_domains,
        (SELECT COUNT(*) FROM domains WHERE status = 'pending') as pending_domains,
        (SELECT COUNT(*) FROM crawls WHERE crawled_at >= CURRENT_DATE) as crawls_today,
        (SELECT COUNT(*) FROM crawls WHERE crawled_at >= CURRENT_DATE AND http_status >= 400) as failed_crawls_today,
        (SELECT AVG(response_time_ms) FROM crawls WHERE crawled_at >= CURRENT_DATE - INTERVAL '7 days') as avg_response_time,
        (SELECT COUNT(*) FROM ssl_certs WHERE valid_to <= CURRENT_DATE + INTERVAL '30 days' AND NOT is_expired) as ssl_expiring_soon;
END;
$$ LANGUAGE plpgsql;