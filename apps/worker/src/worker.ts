import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Config } from './config';
import { Logger } from './utils/logger';
import { JobProcessor } from './processors/job-processor';
import { HealthCheck } from './utils/health-check';
import { RateLimiter } from './utils/rate-limiter';
import type { Job } from '@mcp-bd/db/types';

export class Worker {
  private supabase: SupabaseClient;
  private logger = Logger.getInstance();
  private jobProcessor: JobProcessor;
  private healthCheck: HealthCheck;
  private rateLimiter: RateLimiter;
  private isRunning = false;
  private activeJobs = new Set<string>();

  constructor() {
    this.supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY);
    this.jobProcessor = new JobProcessor(this.supabase);
    this.healthCheck = new HealthCheck();
    this.rateLimiter = new RateLimiter();
  }

  async start(): Promise<void> {
    this.logger.info('Starting worker', { workerId: Config.WORKER_ID });

    try {
      // Start health check server
      await this.healthCheck.start();
      
      // Start main worker loop
      this.isRunning = true;
      await this.workerLoop();
    } catch (error) {
      this.logger.error('Failed to start worker', { error });
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping worker', { workerId: Config.WORKER_ID });
    
    this.isRunning = false;
    
    // Wait for active jobs to complete
    while (this.activeJobs.size > 0) {
      this.logger.info('Waiting for active jobs to complete', { 
        activeJobs: this.activeJobs.size 
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await this.healthCheck.stop();
    this.logger.info('Worker stopped');
  }

  private async workerLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Check if we can process more jobs
        if (this.activeJobs.size >= Config.WORKER_CONCURRENCY) {
          await this.sleep(Config.POLL_INTERVAL_MS);
          continue;
        }

        // Fetch pending jobs
        const jobs = await this.fetchPendingJobs();
        
        if (jobs.length === 0) {
          await this.sleep(Config.POLL_INTERVAL_MS);
          continue;
        }

        // Process jobs concurrently
        const jobPromises = jobs.map(job => this.processJob(job));
        await Promise.allSettled(jobPromises);

      } catch (error) {
        this.logger.error('Error in worker loop', { error });
        await this.sleep(Config.POLL_INTERVAL_MS);
      }
    }
  }

  private async fetchPendingJobs(): Promise<Job[]> {
    const availableSlots = Config.WORKER_CONCURRENCY - this.activeJobs.size;
    
    const { data: jobs, error } = await this.supabase
      .from('jobs')
      .select('*')
      .in('status', ['pending', 'failed'])
      .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
      .lt('attempts', 'max_attempts')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(availableSlots);

    if (error) {
      this.logger.error('Failed to fetch pending jobs', { error });
      return [];
    }

    return jobs || [];
  }

  private async processJob(job: Job): Promise<void> {
    const jobId = job.id;
    this.activeJobs.add(jobId);

    try {
      this.logger.info('Processing job', { 
        jobId, 
        jobType: job.job_type, 
        domainId: job.domain_id,
        attempts: job.attempts 
      });

      // Update job status to running
      await this.updateJobStatus(jobId, 'running', {
        worker_id: Config.WORKER_ID,
        started_at: new Date().toISOString(),
      });

      // Process the job based on type
      const result = await this.jobProcessor.processJob(job);

      if (result.success) {
        // Job completed successfully
        await this.updateJobStatus(jobId, 'completed', {
          finished_at: new Date().toISOString(),
          result: result.data,
        });

        this.logger.info('Job completed successfully', { 
          jobId, 
          jobType: job.job_type 
        });
      } else {
        // Job failed
        await this.handleJobFailure(job, result.error || 'Unknown error');
      }

    } catch (error) {
      this.logger.error('Error processing job', { jobId, error });
      await this.handleJobFailure(job, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  private async handleJobFailure(job: Job, errorMessage: string): Promise<void> {
    const newAttempts = job.attempts + 1;
    const maxAttempts = job.max_attempts;

    if (newAttempts >= maxAttempts) {
      // Max attempts reached, mark as failed
      await this.updateJobStatus(job.id, 'failed', {
        finished_at: new Date().toISOString(),
        error_message: errorMessage,
        attempts: newAttempts,
      });

      this.logger.error('Job failed permanently', { 
        jobId: job.id, 
        attempts: newAttempts, 
        maxAttempts,
        error: errorMessage 
      });
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = Config.RETRY_DELAY_MS * Math.pow(Config.RETRY_BACKOFF_MULTIPLIER, newAttempts - 1);
      const nextRetryAt = new Date(Date.now() + retryDelay).toISOString();

      await this.updateJobStatus(job.id, 'pending', {
        attempts: newAttempts,
        error_message: errorMessage,
        next_retry_at: nextRetryAt,
      });

      this.logger.warn('Job failed, scheduling retry', { 
        jobId: job.id, 
        attempts: newAttempts, 
        nextRetryAt,
        error: errorMessage 
      });
    }
  }

  private async updateJobStatus(
    jobId: string, 
    status: Job['status'], 
    updates: Partial<Job> = {}
  ): Promise<void> {
    const { error } = await this.supabase
      .from('jobs')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...updates,
      })
      .eq('id', jobId);

    if (error) {
      this.logger.error('Failed to update job status', { jobId, status, error });
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check endpoint
  getHealthStatus() {
    return {
      status: this.isRunning ? 'healthy' : 'unhealthy',
      workerId: Config.WORKER_ID,
      activeJobs: this.activeJobs.size,
      maxConcurrency: Config.WORKER_CONCURRENCY,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}