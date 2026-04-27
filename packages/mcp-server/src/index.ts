import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

loadEnv();

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

const searchSchema = z.object({
  q: z.string().min(1),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

const getDomainSchema = z.object({ domain: z.string().min(1) });

async function main() {
  const server = new Server(
    { name: 'mcp-bd', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  const tools = [
    {
      name: 'search_domains',
      description: 'Full-text search Bangladeshi domains (by domain or tags)',
      inputSchema: searchSchema as unknown as Record<string, unknown>,
    },
    {
      name: 'get_domain',
      description: 'Get a single domain by exact domain name',
      inputSchema: getDomainSchema as unknown as Record<string, unknown>,
    },
    {
      name: 'get_crawl',
      description: 'Get the latest crawl record for a domain',
      inputSchema: getDomainSchema as unknown as Record<string, unknown>,
    },
    {
      name: 'get_whois',
      description: 'Get WHOIS information for a domain',
      inputSchema: getDomainSchema as unknown as Record<string, unknown>,
    },
  ];

  const toolsListSchema = z.object({ method: z.literal('tools/list') });
  server.setRequestHandler(toolsListSchema, async () => ({ tools }));

  const toolsCallSchema = z.object({
    method: z.literal('tools/call'),
    params: z.object({
      name: z.string(),
      arguments: z.record(z.any()).optional(),
    }),
  });

  server.setRequestHandler(toolsCallSchema, async (req) => {
    const name = req.params.name;
    const args = req.params.arguments ?? {};
    const supabase = getSupabase();

    if (name === 'search_domains') {
      const { q, page, limit } = searchSchema.parse(args);
      const offset = (page - 1) * limit;
      const { data, error, count } = await supabase
        .from('domains')
        .select('*', { count: 'exact' })
        .or(`domain.ilike.%${q}%,tags.cs.{${q}}`)
        .order('priority', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(error.message);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ data, page, limit, total: count ?? data?.length ?? 0 }),
        }],
      } as any;
    }

    if (name === 'get_domain') {
      const { domain } = getDomainSchema.parse(args);
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('domain', domain)
        .single();
      if (error) throw new Error(error.message);
      return { content: [{ type: 'text', text: JSON.stringify(data) }] } as any;
    }

    if (name === 'get_crawl') {
      const { domain } = getDomainSchema.parse(args);
      const { data: dom, error: dErr } = await supabase
        .from('domains')
        .select('id')
        .eq('domain', domain)
        .single();
      if (dErr) throw new Error(dErr.message);
      const { data, error } = await supabase
        .from('crawls')
        .select('*')
        .eq('domain_id', dom.id)
        .order('crawled_at', { ascending: false })
        .limit(1)
        .single();
      if (error) throw new Error(error.message);
      return { content: [{ type: 'text', text: JSON.stringify(data) }] } as any;
    }

    if (name === 'get_whois') {
      const { domain } = getDomainSchema.parse(args);
      const { data: dom, error: dErr } = await supabase
        .from('domains')
        .select('id')
        .eq('domain', domain)
        .single();
      if (dErr) throw new Error(dErr.message);
      const { data, error } = await supabase
        .from('whois')
        .select('*')
        .eq('domain_id', dom.id)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();
      if (error) throw new Error(error.message);
      return { content: [{ type: 'text', text: JSON.stringify(data) }] } as any;
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


