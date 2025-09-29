# MCP-BD Explorer

A production-ready monorepo for exploring and monitoring Bangladeshi domains with automated crawling, WHOIS lookup, SSL certificate monitoring, and comprehensive analytics.

## Architecture

```
mcp-bd-explorer/
├── apps/
│   ├── web/          # Next.js 14 dashboard (TypeScript, App Router)
│   ├── worker/       # Node.js crawler service
│   └── functions/    # Supabase Edge Functions (scheduler)
├── packages/
│   ├── db/          # Database schema and migrations
│   └── ui/          # Shared UI components (shadcn/ui)
└── docs/            # Documentation
```

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, shadcn/ui, Recharts
- **Backend**: Supabase (Postgres, Auth, Edge Functions, Cron)
- **Worker**: Node.js with TypeScript
- **Database**: PostgreSQL with Supabase
- **Deployment**: Vercel (web), Docker (worker), Supabase (functions)

## Features

### 🕷️ Crawler Worker
- Automated domain crawling with job queue
- DNS resolution (A, AAAA, MX, NS records)
- Homepage analysis (title, meta, HTTP status)
- SSL/TLS certificate extraction and monitoring
- WHOIS lookup and parsing
- Retry mechanism with exponential backoff
- Robots.txt compliance
- Rate limiting and respectful crawling

### ⏰ Scheduler
- Daily automated job creation
- Re-crawl domains older than 30 days
- Job queue management
- Error handling and monitoring

### 📊 Dashboard
- Real-time overview with key metrics
- Domain search and filtering
- Detailed domain information pages
- Analytics charts and trends
- SSL certificate monitoring
- WHOIS information display
- Crawl history and status tracking

## Quick Start

### Prerequisites
- Node.js 18+
- npm 8+
- Supabase account
- Docker (for worker deployment)

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd mcp-bd-explorer
npm install
```

2. **Set up environment variables**
```bash
# Copy environment templates
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env
cp apps/functions/.env.example apps/functions/.env

# Fill in your Supabase credentials
```

3. **Set up database**
```bash
npm run db:migrate
```

4. **Start development**
```bash
# Start all services
npm run dev

# Or start individually
npm run dev --filter=web
npm run worker:dev
```

### Environment Variables

#### Web App (`apps/web/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Worker (`apps/worker/.env`)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
WORKER_CONCURRENCY=5
RETRY_MAX_ATTEMPTS=3
RETRY_DELAY_MS=1000
```

#### Functions (`apps/functions/.env`)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Schema

### Core Tables
- **domains**: Domain registry and metadata
- **crawls**: Crawl results and webpage data
- **whois**: WHOIS information and registrant details
- **ssl_certs**: SSL certificate information and monitoring
- **jobs**: Crawl job queue and status tracking

### Key Features
- Row Level Security (RLS) enabled
- Optimized indexes for performance
- JSON fields for flexible metadata storage
- Audit trails with timestamps

## Deployment

### Web Dashboard
```bash
# Deploy to Vercel
vercel --prod
```

### Worker Service
```bash
# Build Docker image
cd apps/worker
docker build -t mcp-bd-worker .

# Deploy to your container platform
docker run -d --env-file .env mcp-bd-worker
```

### Edge Functions
```bash
# Deploy to Supabase
npm run functions:deploy
```

## Development

### Adding New Domains
```bash
# Via API
curl -X POST http://localhost:3000/api/domains \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com.bd"}'

# Via dashboard
# Navigate to /domains/add in the web interface
```

### Monitoring
- Dashboard: Real-time metrics and status
- Logs: Structured logging with correlation IDs
- Alerts: Configurable thresholds for failures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.