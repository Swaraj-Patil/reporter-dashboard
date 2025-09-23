import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, Trash2, BarChart3, CheckCircle, Eye, Shield } from 'lucide-react';

interface ImpactEvent {
  id: string;
  type: 'warning' | 'removal' | 'analytics' | 'resolution' | 'monitoring' | 'protection';
  title: string;
  description: string;
  timestamp: string;
  relatedTicket?: string;
}

interface ImpactFeedProps {
  standalone?: boolean;
}

export function ImpactFeed({ standalone = false }: ImpactFeedProps) {
  const impactEvents: ImpactEvent[] = [
    {
      id: 'IMP-001',
      type: 'removal',
      title: 'Ad Removed',
      description: 'Misleading health supplement advertisement removed from platform',
      timestamp: '2024-01-15 16:45',
      relatedTicket: 'TCK-001'
    },
    {
      id: 'IMP-002',
      type: 'warning',
      title: 'Advertiser Warned',
      description: 'Formal warning issued to advertiser for policy violations',
      timestamp: '2024-01-15 16:30',
      relatedTicket: 'TCK-001'
    },
    {
      id: 'IMP-003',
      type: 'analytics',
      title: 'Report Used in Analytics Summary',
      description: 'Data from this report contributed to monthly policy insights',
      timestamp: '2024-01-14 18:20',
      relatedTicket: 'TCK-002'
    },
    {
      id: 'IMP-004',
      type: 'monitoring',
      title: 'Enhanced Monitoring Activated',
      description: 'Increased scrutiny applied to similar content patterns',
      timestamp: '2024-01-14 15:10',
      relatedTicket: 'TCK-003'
    },
    {
      id: 'IMP-005',
      type: 'protection',
      title: 'Content Filter Updated',
      description: 'Algorithm updated to better detect similar violations',
      timestamp: '2024-01-13 14:30',
      relatedTicket: 'TCK-002'
    },
    {
      id: 'IMP-006',
      type: 'resolution',
      title: 'Policy Review Completed',
      description: 'Comprehensive review led to updated community guidelines',
      timestamp: '2024-01-12 11:45',
      relatedTicket: 'TCK-001'
    }
  ];

  const getImpactIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'removal': return Trash2;
      case 'analytics': return BarChart3;
      case 'resolution': return CheckCircle;
      case 'monitoring': return Eye;
      case 'protection': return Shield;
      default: return BarChart3;
    }
  };

  const getImpactColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'removal': return 'bg-red-100 text-red-700 border-red-200';
      case 'analytics': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'resolution': return 'bg-green-100 text-green-700 border-green-200';
      case 'monitoring': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'protection': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const content = (
    <Card>
      <CardHeader>
        <CardTitle>Impact Feed</CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time outcomes and actions resulting from reports
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {impactEvents.map((event) => {
            const Icon = getImpactIcon(event.type);
            return (
              <div key={event.id} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className={`p-3 rounded-full ${getImpactColor(event.type)} flex-shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    </div>
                    {event.relatedTicket && (
                      <Badge variant="outline" className="text-xs">
                        {event.relatedTicket}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{event.timestamp}</p>
                </div>
              </div>
            );
          })}
        </div>
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