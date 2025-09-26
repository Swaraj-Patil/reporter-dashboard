import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, Trash2, FileText, Loader2, ChartColumn, Eye, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { socketClient } from '../lib/socket';
import { fetchImpactEvents } from '../lib/api';
import { ImpactEvent } from '../lib/types';
import { CheckCircledIcon } from '@radix-ui/react-icons';

interface ImpactWithTitle extends ImpactEvent {
  ticket_title?: string;
}

interface ImpactFeedProps {
  ticketId?: number;
  limit?: number;
  className?: string;
  standalone?: boolean;
}

const getImpactIcon = (type: string) => {
  switch (type) {
    case 'ad_removed': return Trash2;
    case 'advertiser_warned': return AlertTriangle;
    case 'policy_updated': return FileText;
    case 'report_used': return ChartColumn;
    case 'enhanced_monitoring': return Eye;
    case 'content_filtered': return Shield;
    default: return CheckCircledIcon;
  }
};

const getImpactColor = (type: string) => {
  switch (type) {
    case 'ad_removed': return 'bg-red-100 text-red-700 border-red-200';
    case 'advertiser_warned': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'policy_updated': return 'bg-green-100 text-green-700 border-green-200';
    case 'report_used': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'enhanced_monitoring': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'content_filtered': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    default: return 'bg-green-100 text-green-700 border-green-200';
  }
};

export function ImpactFeed({ ticketId, limit, className, standalone = false }: ImpactFeedProps) {
  const [impacts, setImpacts] = useState<ImpactWithTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        setLoading(true);
        const impacts = await fetchImpactEvents({ ticketId, limit });
        setImpacts(impacts);
      } catch (err) {
        console.error('Error fetching impacts:', err);
        setError('Failed to load impact events');
      } finally {
        setLoading(false);
      }
    };

    fetchImpactData();

    // Subscribe to real-time updates
    const handleImpactCreated = (impact: ImpactEvent) => {
      if (!ticketId || impact.ticket_id === ticketId) {
        setImpacts(prev => {
          const newImpacts = [impact, ...prev];
          return limit ? newImpacts.slice(0, limit) : newImpacts;
        });
      }
    };

    socketClient.on('impact:created', handleImpactCreated);

    return () => {
      socketClient.off('impact:created', handleImpactCreated);
    };
  }, [ticketId, limit]);

  const content = (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Impact Feed</CardTitle>
        {standalone && (
          <p className="text-sm text-muted-foreground">
            Real-time outcomes and actions resulting from reports
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : impacts.length === 0 ? (
          <p className="text-muted-foreground">No impact events yet</p>
        ) : (
          <div className="space-y-4">
            {impacts.map((impact) => {
              const Icon = getImpactIcon(impact.type);
              return (
                <div key={impact.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className={`p-3 rounded-full ${getImpactColor(impact.type)} flex-shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mt-1">{impact.description}</p>
                      </div>
                      {impact.ticket_title && (
                        <Badge variant="outline" className="text-xs">
                          {impact.ticket_title}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      by {impact.admin_name} • {format(new Date(impact.created_at), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (standalone) {
    return (
      <div className="flex-1">
        <header className="border-b bg-background p-6">
          <h1 className="text-2xl">Impact Feed</h1>
          <p className="text-muted-foreground">Track real-time outcomes from community reports</p>
        </header>
        <div className="p-6">
          {content}
        </div>
      </div>
    );
  }

  return content;
}