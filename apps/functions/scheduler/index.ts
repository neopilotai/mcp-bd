import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Domain {
  id: string;
  domain: string;
  last_crawled?: string;
  crawl_frequency_hours: number;
  priority: number;
  status: string;
}

interface Job {
  domain_id: string;
  job_type: 'crawl' | 'whois' | 'ssl_check' | 'dns_lookup';
  priority: number;
  payload: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Scheduler function started');

    // Get domains that need crawling
    const domainsToProcess = await getDomainsForCrawling(supabaseClient);
    console.log(`Found ${domainsToProcess.length} domains to process`);

    // Create jobs for domains that need processing
    const jobsCreated = await createCrawlJobs(supabaseClient, domainsToProcess);
    console.log(`Created ${jobsCreated} jobs`);

    // Clean up old completed jobs (older than 7 days)
    const jobsDeleted = await cleanupOldJobs(supabaseClient);
    console.log(`Cleaned up ${jobsDeleted} old jobs`);

    // Update analytics
    await updateAnalytics(supabaseClient, {
      domainsProcessed: domainsToProcess.length,
      jobsCreated,
      jobsDeleted,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduler completed successfully',
        stats: {
          domainsProcessed: domainsToProcess.length,
          jobsCreated,
          jobsDeleted,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Scheduler error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function getDomainsForCrawling(supabase: any): Promise<Domain[]> {
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

  // Get domains that haven't been crawled recently or never crawled
  const { data: domains, error } = await supabase
    .from('domains')
    .select('id, domain, last_crawled, crawl_frequency_hours, priority, status')
    .in('status', ['active', 'pending'])
    .or(`last_crawled.is.null,last_crawled.lt.${cutoffTime.toISOString()}`)
    .order('priority', { ascending: false })
    .order('last_crawled', { ascending: true, nullsFirst: true })
    .limit(1000); // Process up to 1000 domains per run

  if (error) {
    console.error('Error fetching domains:', error);
    throw new Error(`Failed to fetch domains: ${error.message}`);
  }

  // Filter domains based on their crawl frequency
  const domainsToProcess = domains?.filter((domain: Domain) => {
    if (!domain.last_crawled) return true; // Never crawled

    const lastCrawled = new Date(domain.last_crawled);
    const hoursSinceLastCrawl = (now.getTime() - lastCrawled.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastCrawl >= domain.crawl_frequency_hours;
  }) || [];

  return domainsToProcess;
}

async function createCrawlJobs(supabase: any, domains: Domain[]): Promise<number> {
  if (domains.length === 0) return 0;

  const jobs: Job[] = [];

  for (const domain of domains) {
    // Create crawl job
    jobs.push({
      domain_id: domain.id,
      job_type: 'crawl',
      priority: domain.priority,
      payload: {
        url: `https://${domain.domain}`,
        domain: domain.domain,
      },
    });

    // Create WHOIS job (less frequent)
    const shouldCreateWhoisJob = Math.random() < 0.1; // 10% chance
    if (shouldCreateWhoisJob) {
      jobs.push({
        domain_id: domain.id,
        job_type: 'whois',
        priority: Math.max(1, domain.priority - 2),
        payload: {
          domain: domain.domain,
        },
      });
    }

    // Create SSL check job (less frequent)
    const shouldCreateSslJob = Math.random() < 0.2; // 20% chance
    if (shouldCreateSslJob) {
      jobs.push({
        domain_id: domain.id,
        job_type: 'ssl_check',
        priority: Math.max(1, domain.priority - 1),
        payload: {
          domain: domain.domain,
        },
      });
    }

    // Create DNS lookup job (less frequent)
    const shouldCreateDnsJob = Math.random() < 0.05; // 5% chance
    if (shouldCreateDnsJob) {
      jobs.push({
        domain_id: domain.id,
        job_type: 'dns_lookup',
        priority: Math.max(1, domain.priority - 3),
        payload: {
          domain: domain.domain,
        },
      });
    }
  }

  // Insert jobs in batches
  const batchSize = 100;
  let totalInserted = 0;

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('jobs')
      .insert(batch.map(job => ({
        ...job,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        created_at: new Date().toISOString(),
      })));

    if (error) {
      console.error('Error inserting job batch:', error);
      throw new Error(`Failed to insert jobs: ${error.message}`);
    }

    totalInserted += batch.length;
  }

  return totalInserted;
}

async function cleanupOldJobs(supabase: any): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days ago

  const { error, count } = await supabase
    .from('jobs')
    .delete()
    .in('status', ['completed', 'failed'])
    .lt('finished_at', cutoffDate.toISOString());

  if (error) {
    console.error('Error cleaning up old jobs:', error);
    throw new Error(`Failed to cleanup old jobs: ${error.message}`);
  }

  return count || 0;
}

async function updateAnalytics(supabase: any, stats: any): Promise<void> {
  const timestamp = new Date().toISOString();

  const analyticsEntries = [
    {
      metric_name: 'scheduler_domains_processed',
      metric_value: stats.domainsProcessed,
      dimensions: { source: 'scheduler' },
      timestamp,
    },
    {
      metric_name: 'scheduler_jobs_created',
      metric_value: stats.jobsCreated,
      dimensions: { source: 'scheduler' },
      timestamp,
    },
    {
      metric_name: 'scheduler_jobs_deleted',
      metric_value: stats.jobsDeleted,
      dimensions: { source: 'scheduler' },
      timestamp,
    },
  ];

  const { error } = await supabase
    .from('analytics')
    .insert(analyticsEntries);

  if (error) {
    console.error('Error updating analytics:', error);
    // Don't throw here as analytics failure shouldn't fail the entire scheduler
  }
}

console.log('Scheduler function loaded');