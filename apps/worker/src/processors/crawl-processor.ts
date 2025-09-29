import { SupabaseClient } from '@supabase/supabase-js';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import { Logger } from '../utils/logger';
import { Config } from '../config';
import type { Job, Domain, Crawl } from '@mcp-bd/db/types';
import type { ProcessorResult } from './job-processor';

export class CrawlProcessor {
  private logger = Logger.getInstance();

  constructor(private supabase: SupabaseClient) {}

  async process(job: Job): Promise<ProcessorResult> {
    try {
      // Get domain information
      const { data: domain, error: domainError } = await this.supabase
        .from('domains')
        .select('*')
        .eq('id', job.domain_id)
        .single();

      if (domainError || !domain) {
        return {
          success: false,
          error: `Domain not found: ${domainError?.message}`,
        };
      }

      // Check robots.txt if enabled
      if (Config.RESPECT_ROBOTS_TXT) {
        const robotsAllowed = await this.checkRobotsTxt(domain.domain);
        if (!robotsAllowed) {
          return {
            success: false,
            error: 'Crawling disallowed by robots.txt',
          };
        }
      }

      // Perform the crawl
      const crawlResult = await this.crawlDomain(domain);

      // Save crawl result
      const { error: insertError } = await this.supabase
        .from('crawls')
        .insert(crawlResult);

      if (insertError) {
        this.logger.error('Failed to save crawl result', { 
          domainId: domain.id, 
          error: insertError 
        });
        return {
          success: false,
          error: `Failed to save crawl result: ${insertError.message}`,
        };
      }

      // Update domain last_crawled timestamp
      await this.supabase
        .from('domains')
        .update({ 
          last_crawled: new Date().toISOString(),
          status: crawlResult.http_status && crawlResult.http_status < 400 ? 'active' : 'inactive'
        })
        .eq('id', domain.id);

      return {
        success: true,
        data: crawlResult,
      };

    } catch (error) {
      this.logger.error('Crawl processing failed', { 
        jobId: job.id, 
        error 
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown crawl error',
      };
    }
  }

  private async checkRobotsTxt(domain: string): Promise<boolean> {
    try {
      const robotsUrl = `https://${domain}/robots.txt`;
      const response = await axios.get(robotsUrl, {
        timeout: 5000,
        headers: { 'User-Agent': Config.USER_AGENT },
      });

      const robots = robotsParser(robotsUrl, response.data);
      return robots.isAllowed('/', Config.USER_AGENT);
    } catch (error) {
      // If robots.txt is not accessible, assume crawling is allowed
      this.logger.debug('Could not fetch robots.txt, assuming allowed', { 
        domain, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return true;
    }
  }

  private async crawlDomain(domain: Domain): Promise<Omit<Crawl, 'id' | 'created_at'>> {
    const startTime = Date.now();
    const url = `https://${domain.domain}`;

    try {
      const response = await axios.get(url, {
        timeout: Config.REQUEST_TIMEOUT_MS,
        maxRedirects: Config.MAX_REDIRECTS,
        headers: {
          'User-Agent': Config.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        validateStatus: () => true, // Accept all status codes
      });

      const responseTime = Date.now() - startTime;
      const contentLength = Buffer.byteLength(response.data, 'utf8');

      // Parse HTML content
      const $ = cheerio.load(response.data);
      const metadata = this.extractMetadata($, response);

      return {
        domain_id: domain.id,
        url,
        title: metadata.title,
        description: metadata.description,
        http_status: response.status,
        response_time_ms: responseTime,
        content_length: contentLength,
        content_type: response.headers['content-type'],
        meta_keywords: metadata.keywords,
        meta_author: metadata.author,
        language: metadata.language,
        favicon_url: metadata.faviconUrl,
        headers: this.sanitizeHeaders(response.headers),
        technologies: await this.detectTechnologies($, response),
        performance_metrics: {
          responseTime,
          contentLength,
          redirectCount: response.request?.res?.responseUrl !== url ? 1 : 0,
        },
        accessibility_score: this.calculateAccessibilityScore($),
        seo_score: this.calculateSeoScore($, metadata),
        crawled_at: new Date().toISOString(),
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.logger.warn('Failed to crawl domain', { 
        domain: domain.domain, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        domain_id: domain.id,
        url,
        http_status: 0,
        response_time_ms: responseTime,
        content_length: 0,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        headers: {},
        technologies: {},
        performance_metrics: { responseTime, contentLength: 0 },
        crawled_at: new Date().toISOString(),
      };
    }
  }

  private extractMetadata($: cheerio.CheerioAPI, response: AxiosResponse) {
    const title = $('title').first().text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('meta[name="twitter:title"]').attr('content');

    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="twitter:description"]').attr('content');

    const keywords = $('meta[name="keywords"]').attr('content');
    const author = $('meta[name="author"]').attr('content');
    
    const language = $('html').attr('lang') || 
                    $('meta[http-equiv="content-language"]').attr('content') ||
                    response.headers['content-language'];

    // Extract favicon URL
    let faviconUrl = $('link[rel="icon"]').attr('href') || 
                     $('link[rel="shortcut icon"]').attr('href') ||
                     $('link[rel="apple-touch-icon"]').attr('href');

    if (faviconUrl && !faviconUrl.startsWith('http')) {
      const baseUrl = new URL(response.config.url!);
      faviconUrl = faviconUrl.startsWith('/') 
        ? `${baseUrl.protocol}//${baseUrl.host}${faviconUrl}`
        : `${baseUrl.protocol}//${baseUrl.host}/${faviconUrl}`;
    }

    return {
      title,
      description,
      keywords,
      author,
      language,
      faviconUrl,
    };
  }

  private async detectTechnologies($: cheerio.CheerioAPI, response: AxiosResponse): Promise<Record<string, any>> {
    const technologies: Record<string, any> = {};

    // Server detection
    const server = response.headers['server'];
    if (server) {
      technologies.server = server;
    }

    // Framework detection
    const generator = $('meta[name="generator"]').attr('content');
    if (generator) {
      technologies.generator = generator;
    }

    // JavaScript frameworks
    if ($('script[src*="react"]').length > 0) {
      technologies.react = true;
    }
    if ($('script[src*="vue"]').length > 0) {
      technologies.vue = true;
    }
    if ($('script[src*="angular"]').length > 0) {
      technologies.angular = true;
    }
    if ($('script[src*="jquery"]').length > 0) {
      technologies.jquery = true;
    }

    // CSS frameworks
    if ($('link[href*="bootstrap"]').length > 0) {
      technologies.bootstrap = true;
    }
    if ($('link[href*="tailwind"]').length > 0) {
      technologies.tailwind = true;
    }

    // Analytics
    if ($('script[src*="google-analytics"]').length > 0 || $('script[src*="gtag"]').length > 0) {
      technologies.googleAnalytics = true;
    }

    // CMS detection
    if ($('meta[name="generator"][content*="WordPress"]').length > 0) {
      technologies.wordpress = true;
    }
    if ($('meta[name="generator"][content*="Drupal"]').length > 0) {
      technologies.drupal = true;
    }

    return technologies;
  }

  private calculateAccessibilityScore($: cheerio.CheerioAPI): number {
    let score = 100;

    // Check for alt attributes on images
    const images = $('img');
    const imagesWithoutAlt = images.filter((_, img) => !$(img).attr('alt')).length;
    if (imagesWithoutAlt > 0) {
      score -= Math.min(20, imagesWithoutAlt * 2);
    }

    // Check for heading structure
    const h1Count = $('h1').length;
    if (h1Count === 0) score -= 10;
    if (h1Count > 1) score -= 5;

    // Check for form labels
    const inputs = $('input[type="text"], input[type="email"], textarea, select');
    const inputsWithoutLabels = inputs.filter((_, input) => {
      const id = $(input).attr('id');
      return !id || $(`label[for="${id}"]`).length === 0;
    }).length;
    if (inputsWithoutLabels > 0) {
      score -= Math.min(15, inputsWithoutLabels * 3);
    }

    return Math.max(0, score);
  }

  private calculateSeoScore($: cheerio.CheerioAPI, metadata: any): number {
    let score = 100;

    // Title checks
    if (!metadata.title) score -= 20;
    else if (metadata.title.length < 30 || metadata.title.length > 60) score -= 10;

    // Description checks
    if (!metadata.description) score -= 15;
    else if (metadata.description.length < 120 || metadata.description.length > 160) score -= 5;

    // Heading structure
    if ($('h1').length === 0) score -= 10;
    if ($('h1').length > 1) score -= 5;

    // Meta keywords (not heavily weighted as it's not used by modern search engines)
    if (!metadata.keywords) score -= 2;

    // Image alt attributes
    const imagesWithoutAlt = $('img').filter((_, img) => !$(img).attr('alt')).length;
    if (imagesWithoutAlt > 0) score -= Math.min(10, imagesWithoutAlt);

    return Math.max(0, score);
  }

  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const allowedHeaders = [
      'content-type',
      'server',
      'x-powered-by',
      'cache-control',
      'content-encoding',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security',
    ];

    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase()) && typeof value === 'string') {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}