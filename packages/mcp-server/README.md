## MCP Server: Bangladesh Domains

This MCP server exposes tools to explore Bangladeshi domains from your Supabase database: domains, crawls, and WHOIS.

### Tools
- `search_domains` — full-text search domains by name/tag; supports paging
- `get_domain` — fetch a single domain by exact name
- `get_crawl` — latest crawl for a domain
- `get_whois` — WHOIS record for a domain

### Environment
Set these variables for the server process:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Development

```bash
pnpm -w --filter @mcp-bd/mcp-server dev
```

### Build

```bash
pnpm -w --filter @mcp-bd/mcp-server build
```

### Run (stdio)

```bash
pnpm -w --filter @mcp-bd/mcp-server start
```

### Example client configuration

Cursor/Windsurf MCP configuration (stdio):

```json
{
  "mcpServers": {
    "mcp-bd": {
      "command": "pnpm",
      "args": ["-w", "--filter", "@mcp-bd/mcp-server", "start"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    }
  }
}
```


