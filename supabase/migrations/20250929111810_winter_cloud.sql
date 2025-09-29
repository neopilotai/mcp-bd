-- Seed data for MCP-BD Explorer
-- Sample domains and initial data for development and testing

-- Insert sample Bangladeshi domains
INSERT INTO domains (domain, status, priority, tags, metadata) VALUES
    ('bangladesh.gov.bd', 'active', 10, ARRAY['government', 'official'], '{"category": "government", "importance": "high"}'),
    ('dhaka.gov.bd', 'active', 9, ARRAY['government', 'local'], '{"category": "government", "city": "dhaka"}'),
    ('du.ac.bd', 'active', 8, ARRAY['education', 'university'], '{"category": "education", "type": "university"}'),
    ('buet.ac.bd', 'active', 8, ARRAY['education', 'engineering'], '{"category": "education", "type": "engineering"}'),
    ('prothomalo.com', 'active', 7, ARRAY['news', 'media'], '{"category": "news", "language": "bengali"}'),
    ('thedailystar.net', 'active', 7, ARRAY['news', 'english'], '{"category": "news", "language": "english"}'),
    ('brac.net', 'active', 6, ARRAY['ngo', 'development'], '{"category": "ngo", "focus": "development"}'),
    ('grameen.com', 'active', 6, ARRAY['finance', 'microfinance'], '{"category": "finance", "type": "microfinance"}'),
    ('robi.com.bd', 'active', 5, ARRAY['telecom', 'mobile'], '{"category": "telecom", "service": "mobile"}'),
    ('grameenphone.com', 'active', 5, ARRAY['telecom', 'mobile'], '{"category": "telecom", "service": "mobile"}'),
    ('bikroy.com', 'active', 4, ARRAY['ecommerce', 'classifieds'], '{"category": "ecommerce", "type": "classifieds"}'),
    ('daraz.com.bd', 'active', 4, ARRAY['ecommerce', 'marketplace'], '{"category": "ecommerce", "type": "marketplace"}'),
    ('bkash.com', 'active', 6, ARRAY['fintech', 'mobile-banking'], '{"category": "fintech", "service": "mobile-banking"}'),
    ('nagad.com.bd', 'active', 6, ARRAY['fintech', 'mobile-banking'], '{"category": "fintech", "service": "mobile-banking"}'),
    ('sonalibank.com.bd', 'active', 5, ARRAY['banking', 'traditional'], '{"category": "banking", "type": "traditional"}')
ON CONFLICT (domain) DO NOTHING;

-- Insert sample crawl data
INSERT INTO crawls (domain_id, url, title, description, http_status, response_time_ms, content_length, content_type, language, crawled_at) 
SELECT 
    d.id,
    'https://' || d.domain,
    CASE d.domain
        WHEN 'bangladesh.gov.bd' THEN 'Government of the People''s Republic of Bangladesh'
        WHEN 'dhaka.gov.bd' THEN 'Dhaka City Corporation'
        WHEN 'du.ac.bd' THEN 'University of Dhaka'
        WHEN 'buet.ac.bd' THEN 'Bangladesh University of Engineering and Technology'
        WHEN 'prothomalo.com' THEN 'প্রথম আলো - বাংলাদেশের সর্বাধিক প্রচারিত দৈনিক'
        WHEN 'thedailystar.net' THEN 'The Daily Star - Leading English Daily'
        WHEN 'brac.net' THEN 'BRAC - Building Resources Across Communities'
        WHEN 'grameen.com' THEN 'Grameen Bank - Banking for the Poor'
        WHEN 'robi.com.bd' THEN 'Robi Axiata Limited'
        WHEN 'grameenphone.com' THEN 'Grameenphone - Stay Close'
        WHEN 'bikroy.com' THEN 'Bikroy.com - Buy, Sell, Rent, Find Jobs in Bangladesh'
        WHEN 'daraz.com.bd' THEN 'Daraz.com.bd - Online Shopping in Bangladesh'
        WHEN 'bkash.com' THEN 'bKash - Mobile Financial Service'
        WHEN 'nagad.com.bd' THEN 'Nagad - Digital Financial Service'
        WHEN 'sonalibank.com.bd' THEN 'Sonali Bank Limited'
        ELSE 'Sample Title for ' || d.domain
    END,
    CASE d.domain
        WHEN 'bangladesh.gov.bd' THEN 'Official website of the Government of Bangladesh'
        WHEN 'dhaka.gov.bd' THEN 'Official website of Dhaka City Corporation'
        WHEN 'du.ac.bd' THEN 'University of Dhaka - Premier educational institution'
        WHEN 'buet.ac.bd' THEN 'Leading engineering university in Bangladesh'
        WHEN 'prothomalo.com' THEN 'Latest news, politics, sports, entertainment from Bangladesh'
        WHEN 'thedailystar.net' THEN 'Breaking news, analysis, and opinion from Bangladesh'
        WHEN 'brac.net' THEN 'Development organization working to eliminate poverty'
        WHEN 'grameen.com' THEN 'Microfinance and social business pioneer'
        ELSE 'Sample description for ' || d.domain
    END,
    200,
    FLOOR(RANDOM() * 2000 + 500)::INTEGER,
    FLOOR(RANDOM() * 100000 + 10000)::INTEGER,
    'text/html; charset=utf-8',
    CASE WHEN d.domain IN ('prothomalo.com') THEN 'bn' ELSE 'en' END,
    NOW() - INTERVAL '1 hour' * FLOOR(RANDOM() * 24)
FROM domains d;

-- Insert sample WHOIS data
INSERT INTO whois (domain_id, registrar, registrant_organization, registrant_country, creation_date, expiration_date, name_servers, status)
SELECT 
    d.id,
    CASE 
        WHEN d.domain LIKE '%.gov.bd' THEN 'Bangladesh Telecommunication Regulatory Commission'
        WHEN d.domain LIKE '%.ac.bd' THEN 'Bangladesh Education and Research Network'
        ELSE 'Sample Registrar Ltd.'
    END,
    CASE d.domain
        WHEN 'bangladesh.gov.bd' THEN 'Government of Bangladesh'
        WHEN 'dhaka.gov.bd' THEN 'Dhaka City Corporation'
        WHEN 'du.ac.bd' THEN 'University of Dhaka'
        WHEN 'buet.ac.bd' THEN 'Bangladesh University of Engineering and Technology'
        ELSE 'Sample Organization'
    END,
    'BD',
    NOW() - INTERVAL '1 year' * FLOOR(RANDOM() * 10 + 1),
    NOW() + INTERVAL '1 year' * FLOOR(RANDOM() * 3 + 1),
    ARRAY['ns1.btcl.net.bd', 'ns2.btcl.net.bd'],
    ARRAY['clientTransferProhibited']
FROM domains d;

-- Insert sample SSL certificate data
INSERT INTO ssl_certs (domain_id, issuer, subject, valid_from, valid_to, is_wildcard, fingerprint_sha256)
SELECT 
    d.id,
    'Let''s Encrypt Authority X3',
    'CN=' || d.domain,
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '60 days',
    FALSE,
    encode(sha256(d.domain::bytea), 'hex')
FROM domains d;

-- Insert sample DNS records
INSERT INTO dns_records (domain_id, record_type, name, value, ttl)
SELECT 
    d.id,
    'A',
    d.domain,
    '203.112.218.' || FLOOR(RANDOM() * 254 + 1)::TEXT,
    3600
FROM domains d
UNION ALL
SELECT 
    d.id,
    'MX',
    d.domain,
    '10 mail.' || d.domain,
    3600
FROM domains d;

-- Insert sample analytics data
INSERT INTO analytics (metric_name, metric_value, dimensions, timestamp)
SELECT 
    'crawl_response_time',
    FLOOR(RANDOM() * 2000 + 200),
    jsonb_build_object('domain', d.domain, 'status', 'success'),
    NOW() - INTERVAL '1 hour' * generate_series(1, 24)
FROM domains d
WHERE d.status = 'active'
LIMIT 100;

-- Insert sample jobs
INSERT INTO jobs (domain_id, job_type, status, priority, payload)
SELECT 
    d.id,
    'crawl',
    CASE FLOOR(RANDOM() * 4)
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'completed'
        WHEN 2 THEN 'running'
        ELSE 'failed'
    END,
    d.priority,
    jsonb_build_object('url', 'https://' || d.domain, 'depth', 1)
FROM domains d;