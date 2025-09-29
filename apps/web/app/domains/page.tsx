'use client';

import { useState, useEffect } from 'react';
import { DomainCard, StatsCard } from '@mcp-bd/ui';
import { Button } from '@mcp-bd/ui/components/ui/button';
import { Input } from '@mcp-bd/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@mcp-bd/ui/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@mcp-bd/ui/components/ui/card';
import { Badge } from '@mcp-bd/ui/components/ui/badge';
import { Search, ListFilter as Filter, Plus, Download } from 'lucide-react';
import type { DomainSummary } from '@mcp-bd/db/types';

// Mock data - replace with actual API calls
const mockDomains: DomainSummary[] = [
  {
    id: '1',
    domain: 'bangladesh.gov.bd',
    status: 'active',
    last_crawled: new Date().toISOString(),
    priority: 10,
    tags: ['government', 'official'],
    title: 'Government of Bangladesh',
    description: 'Official website of the Government of Bangladesh providing information about government services, policies, and initiatives.',
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
    description: 'Premier educational institution in Bangladesh offering undergraduate and graduate programs.',
    http_status: 200,
    response_time_ms: 1200,
    expiration_date: '2025-08-20',
    registrar: 'BERN',
    ssl_expires: '2024-09-10',
    ssl_expired: false
  },
  {
    id: '3',
    domain: 'buet.ac.bd',
    status: 'active',
    last_crawled: new Date().toISOString(),
    priority: 8,
    tags: ['education', 'engineering'],
    title: 'Bangladesh University of Engineering and Technology',
    description: 'Leading engineering university in Bangladesh specializing in engineering and technology education.',
    http_status: 200,
    response_time_ms: 980,
    expiration_date: '2025-03-15',
    registrar: 'BERN',
    ssl_expires: '2024-07-22',
    ssl_expired: false
  },
  {
    id: '4',
    domain: 'prothomalo.com',
    status: 'active',
    last_crawled: new Date().toISOString(),
    priority: 7,
    tags: ['news', 'media'],
    title: 'প্রথম আলো',
    description: 'Leading Bengali newspaper in Bangladesh providing latest news, politics, sports, and entertainment.',
    http_status: 200,
    response_time_ms: 650,
    expiration_date: '2024-11-15',
    registrar: 'GoDaddy',
    ssl_expires: '2024-05-20',
    ssl_expired: false
  },
  {
    id: '5',
    domain: 'thedailystar.net',
    status: 'active',
    last_crawled: new Date().toISOString(),
    priority: 7,
    tags: ['news', 'english'],
    title: 'The Daily Star',
    description: 'Leading English daily newspaper in Bangladesh with comprehensive news coverage.',
    http_status: 200,
    response_time_ms: 720,
    expiration_date: '2024-09-30',
    registrar: 'Namecheap',
    ssl_expires: '2024-08-15',
    ssl_expired: false
  },
  {
    id: '6',
    domain: 'bkash.com',
    status: 'active',
    last_crawled: new Date().toISOString(),
    priority: 9,
    tags: ['fintech', 'mobile-banking'],
    title: 'bKash',
    description: 'Leading mobile financial service provider in Bangladesh offering digital payment solutions.',
    http_status: 200,
    response_time_ms: 450,
    expiration_date: '2025-01-20',
    registrar: 'MarkMonitor',
    ssl_expires: '2024-12-10',
    ssl_expired: false
  }
];

export default function DomainsPage() {
  const [domains, setDomains] = useState<DomainSummary[]>(mockDomains);
  const [filteredDomains, setFilteredDomains] = useState<DomainSummary[]>(mockDomains);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 12;

  // Get unique tags for filter
  const allTags = Array.from(new Set(domains.flatMap(d => d.tags)));

  // Filter and search logic
  useEffect(() => {
    let filtered = [...domains];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(domain =>
        domain.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        domain.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        domain.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        domain.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(domain => domain.status === statusFilter);
    }

    // Tag filter
    if (tagFilter !== 'all') {
      filtered = filtered.filter(domain => domain.tags.includes(tagFilter));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'domain':
          return a.domain.localeCompare(b.domain);
        case 'priority':
          return b.priority - a.priority;
        case 'last_crawled':
          return new Date(b.last_crawled || 0).getTime() - new Date(a.last_crawled || 0).getTime();
        case 'response_time':
          return (a.response_time_ms || 0) - (b.response_time_ms || 0);
        default:
          return 0;
      }
    });

    setFilteredDomains(filtered);
    setCurrentPage(1);
  }, [domains, searchQuery, statusFilter, tagFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredDomains.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDomains = filteredDomains.slice(startIndex, startIndex + itemsPerPage);

  const handleViewDetails = (domain: DomainSummary) => {
    // Navigate to domain details page
    window.location.href = `/domains/${domain.domain}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Domain Directory</h1>
        <p className="text-muted-foreground">
          Browse and search through {domains.length} Bangladeshi domains
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Domains"
          value={domains.length.toLocaleString()}
          description="In database"
        />
        <StatsCard
          title="Active"
          value={domains.filter(d => d.status === 'active').length.toLocaleString()}
          description="Currently online"
        />
        <StatsCard
          title="Government"
          value={domains.filter(d => d.tags.includes('government')).length.toLocaleString()}
          description="Gov domains"
        />
        <StatsCard
          title="Educational"
          value={domains.filter(d => d.tags.includes('education')).length.toLocaleString()}
          description="Edu domains"
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search domains, titles, or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Advanced
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Tag:</label>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort by:</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="domain">Domain Name</SelectItem>
                  <SelectItem value="last_crawled">Last Crawled</SelectItem>
                  <SelectItem value="response_time">Response Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || statusFilter !== 'all' || tagFilter !== 'all') && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                    ×
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('all')} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                    ×
                  </button>
                </Badge>
              )}
              {tagFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Tag: {tagFilter}
                  <button onClick={() => setTagFilter('all')} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDomains.length)} of {filteredDomains.length} domains
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Domain
          </Button>
        </div>
      </div>

      {/* Domain Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : paginatedDomains.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginatedDomains.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No domains found</h3>
              <p>Try adjusting your search criteria or filters</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            );
          })}
          
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="text-muted-foreground">...</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}