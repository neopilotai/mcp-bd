import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ExternalLink, Globe, Shield, Clock } from 'lucide-react';
import { cn, formatDate, formatDuration, getStatusColor } from '../lib/utils';
import type { DomainSummary } from '@mcp-bd/db/types';

interface DomainCardProps {
  domain: DomainSummary;
  onViewDetails?: (domain: DomainSummary) => void;
  className?: string;
}

export function DomainCard({ domain, onViewDetails, className }: DomainCardProps) {
  const statusColor = getStatusColor(domain.status);
  
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {domain.title || domain.domain}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-mono">
              {domain.domain}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            {domain.ssl_expired === false && (
              <Shield className="h-4 w-4 text-green-500" title="SSL Certificate Valid" />
            )}
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a
                href={`https://${domain.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Visit website"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {domain.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {domain.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Badge className={cn('text-xs', statusColor)} variant="outline">
            {domain.status}
          </Badge>
          
          {domain.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>
              {domain.response_time_ms 
                ? formatDuration(domain.response_time_ms)
                : 'N/A'
              }
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Globe className="h-3 w-3" />
            <span>
              {domain.http_status || 'Unknown'}
            </span>
          </div>
        </div>
        
        {domain.last_crawled && (
          <div className="text-xs text-muted-foreground">
            Last crawled: {formatDate(domain.last_crawled)}
          </div>
        )}
        
        {domain.ssl_expires && (
          <div className="text-xs text-muted-foreground">
            SSL expires: {formatDate(domain.ssl_expires)}
          </div>
        )}
        
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onViewDetails(domain)}
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}