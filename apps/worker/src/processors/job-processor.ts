import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from '../utils/logger';
import { CrawlProcessor } from './crawl-processor';
import { WhoisProcessor } from './whois-processor';
import { SslProcessor } from './ssl-processor';
import { DnsProcessor } from './dns-processor';
import type { Job } from '@mcp-bd/db/types';

export interface ProcessorResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class JobProcessor {
  private logger = Logger.getInstance();
  private crawlProcessor: CrawlProcessor;
  private whoisProcessor: WhoisProcessor;
  private sslProcessor: SslProcessor;
  private dnsProcessor: DnsProcessor;

  constructor(private supabase: SupabaseClient) {
    this.crawlProcessor = new CrawlProcessor(supabase);
    this.whoisProcessor = new WhoisProcessor(supabase);
    this.sslProcessor = new SslProcessor(supabase);
    this.dnsProcessor = new DnsProcessor(supabase);
  }

  async processJob(job: Job): Promise<ProcessorResult> {
    this.logger.info('Processing job', { 
      jobId: job.id, 
      jobType: job.job_type,
      payload: job.payload 
    });

    try {
      switch (job.job_type) {
        case 'crawl':
          return await this.crawlProcessor.process(job);
        
        case 'whois':
          return await this.whoisProcessor.process(job);
        
        case 'ssl_check':
          return await this.sslProcessor.process(job);
        
        case 'dns_lookup':
          return await this.dnsProcessor.process(job);
        
        default:
          return {
            success: false,
            error: `Unknown job type: ${job.job_type}`,
          };
      }
    } catch (error) {
      this.logger.error('Error processing job', { 
        jobId: job.id, 
        jobType: job.job_type, 
        error 
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}