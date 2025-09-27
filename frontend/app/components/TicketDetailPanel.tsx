import { Ticket } from '@/lib/types';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Clock, User, Bot } from 'lucide-react';
import { camelCaseToEnglish } from '@/lib/utils';
import { CommentThread } from './CommentThread';

interface TicketDetailPanelProps {
  ticket: Ticket;
}

export function TicketDetailPanel({ ticket }: TicketDetailPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'responded': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_review': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'received': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4" style={{ paddingBottom: '60px' }}>
        {/* Ticket Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{`TCK-${String(ticket.id).padStart(3, '0')}`}</CardTitle>
              <Badge className={getStatusColor(ticket.status)}>
                {camelCaseToEnglish(ticket.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-2">Title</h4>
              <p className="text-sm">{ticket.title}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{ticket.description}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Last Updated</h4>
              <p className="text-sm text-muted-foreground">{ticket.lastUpdated || ticket.created_at}</p>
            </div>
          </CardContent>
        </Card>

        {/* Status Progression */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['received', 'in_review', 'responded'].map((status, index) => {
                const isActive = ticket.status === status;
                const isPassed = ['received', 'in_review', 'responded'].indexOf(ticket.status) > index;
                const isCompleted = isActive || isPassed;

                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full border-2 ${isCompleted
                        ? 'bg-primary border-primary'
                        : 'bg-background border-muted-foreground'
                      }`} />
                    <span className={`text-sm ${isActive ? 'font-medium' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/50'
                      }`}>
                      {camelCaseToEnglish(status)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        {ticket.timeline && ticket.timeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ticket.timeline.map((event, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      {event.type === 'system' ? (
                        <Bot className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{event.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                        <Badge variant="outline" className="text-xs">
                          {event.type === 'system' ? 'Automated' : 'Human Review'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Impact Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Impact Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ticket.status === 'responded' && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Report responded successfully</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Data contributed to policy insights</span>
                  </div>
                </>
              )}
              {ticket.status === 'in_review' && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span>Under active investigation</span>
                </div>
              )}
              {ticket.status === 'received' && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  <span>Awaiting initial review</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Discussion</CardTitle>
          </CardHeader>
          <CardContent>
            <CommentThread
              ticketId={ticket.id}
              isAdmin={false}
            />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}