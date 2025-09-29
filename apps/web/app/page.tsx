import { Suspense } from 'react';
import { StatsCard, DomainCard } from '@mcp-bd/ui';
import { Globe, Activity, TriangleAlert as AlertTriangle, Clock, TrendingUp, Shield, Database, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@mcp-bd/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@mcp-bd/ui/components/ui/card';
import { Input } from '@mcp-bd/ui/components/ui/input';

// Mock data for demonstration
const mockStats = {
  totalDomains: 15420,
  activeDomains: 14832,
  crawlsToday: 1247,
  avgResponseTime: 1.2,
  sslExpiringSoon: 23,
  errorRate: 2.1
};

const mockRecentDomains = [
  {
    id: '1',
    domain: 'bangladesh.gov.bd',
    status: 'active',
    last_crawled: new Date().toISOString(),
    priority: 10,
    tags: ['government', 'official'],
    title: 'Government of Bangladesh',
    description: 'Official website of the Government of Bangladesh',
    http_status: 200,
    response_time_ms: 850,
    expiration_date: '2025-12-31',
    registrar: 'BTRC',
    ssl_expires: '2024-06-15',
    ssl_expired: false
  },
  {
    id: '2',
    domain: 'du.ac.bd',
    status: 'active',
    last_crawled: new Date().toISOString(),
    priority: 8,
    tags: ['education', 'university'],
    title: 'University of Dhaka',
    description: 'Premier educational institution in Bangladesh',
    http_status: 200,
    response_time_ms: 1200,
    expiration_date: '2025-08-20',
    registrar: 'BERN',
    ssl_expires: '2024-09-10',
    ssl_expired: false
  },
  {
    id: '3',
    domain: 'prothomalo.com',
    status: 'active',
    last_crawled: new Date().toISOString(),
    priority: 7,
    tags: ['news', 'media'],
    title: 'প্রথম আলো',
    description: 'Leading Bengali newspaper in Bangladesh',
    http_status: 200,
    response_time_ms: 650,
    expiration_date: '2024-11-15',
    registrar: 'GoDaddy',
    ssl_expires: '2024-05-20',
    ssl_expired: false
  }
];

function StatsOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Domains"
        value={mockStats.totalDomains.toLocaleString()}
        description="Domains in database"
        icon={Globe}
        trend={{ value: 12.5, label: 'from last month', isPositive: true }}
      />
      <StatsCard
        title="Active Domains"
        value={mockStats.activeDomains.toLocaleString()}
        description="Currently online"
        icon={Activity}
        trend={{ value: 2.1, label: 'from last week', isPositive: true }}
      />
      <StatsCard
        title="Crawls Today"
        value={mockStats.crawlsToday.toLocaleString()}
        description="Successful crawls"
        icon={TrendingUp}
        trend={{ value: 8.3, label: 'from yesterday', isPositive: true }}
      />
      <StatsCard
        title="Avg Response Time"
        value={`${mockStats.avgResponseTime}s`}
        description="Last 24 hours"
        icon={Clock}
        trend={{ value: -5.2, label: 'improvement', isPositive: true }}
      />
    </div>
  );
}

function QuickSearch() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Quick Domain Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input 
            placeholder="Enter domain name (e.g., example.com.bd)" 
            className="flex-1"
          />
          <Button>Search</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm">.gov.bd</Button>
          <Button variant="outline" size="sm">.edu.bd</Button>
          <Button variant="outline" size="sm">.com.bd</Button>
          <Button variant="outline" size="sm">.org.bd</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Domains</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockRecentDomains.map((domain) => (
            <DomainCard 
              key={domain.id} 
              domain={domain}
              className="border-0 shadow-none bg-muted/30"
            />
          ))}
        </div>
        <div className="mt-4">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/domains">View All Domains</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SystemHealth() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SSL Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valid Certificates</span>
              <span className="text-sm font-medium">14,397</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Expiring Soon</span>
              <span className="text-sm font-medium text-yellow-600">{mockStats.sslExpiringSoon}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Expired</span>
              <span className="text-sm font-medium text-red-600">12</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Crawler Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Jobs Pending</span>
              <span className="text-sm font-medium">156</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Jobs Running</span>
              <span className="text-sm font-medium text-blue-600">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Error Rate</span>
              <span className="text-sm font-medium text-red-600">{mockStats.errorRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">MCP-BD Explorer</h1>
        <p className="text-muted-foreground">
          Comprehensive monitoring and analysis of Bangladeshi domains
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/domains">Browse Domains</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/analytics">Analytics</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/jobs">Job Queue</Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <Suspense fallback={<div className="animate-pulse h-32 bg-muted rounded-lg" />}>
        <StatsOverview />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <QuickSearch />
          <SystemHealth />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}