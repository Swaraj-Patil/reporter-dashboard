import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertTriangle, Trash2, BarChart3, Bot, FileText, ChartColumn, Eye, Shield } from 'lucide-react';
import type { Ticket, TimelineEvent, Comment } from '../lib/types';
import { addComment, addImpactEvent, fetchPendingTickets, updateTicketStatus } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';

interface State {
  selectedTicket: Ticket | null;
  reviewComment: string;
  loading: boolean;
  error: string | null;
  tickets: Ticket[];
}

const initialState: State = {
  selectedTicket: null,
  reviewComment: '',
  loading: true,
  error: null,
  tickets: []
};

// Helper functions for status handling
const displayStatus = (status: string): string => {
  console.log({ status })
  const statusMap: Record<string, string> = {
    'received': 'Received',
    'in_review': 'In Review',
    'responded': 'Responded'
  };
  return statusMap[status] || status;
};

const mapDisplayToApiStatus = (displayStatus: string): 'received' | 'in_review' | 'responded' => {
  const statusMap: Record<string, 'received' | 'in_review' | 'responded'> = {
    'Received': 'received',
    'In Review': 'in_review',
    'Responded': 'responded'
  };
  return statusMap[displayStatus] || 'received';
};

// const getStatusColor = (status: string) => {
//   switch (status) {
//     case 'received':
//       return 'bg-yellow-500';
//     case 'in_review':
//       return 'bg-blue-500';
//     case 'responded':
//       return 'bg-green-500';
//     default:
//       return 'bg-gray-500';
//   }
// };

const getStatusColor = (status: string) => {
  console.log({ status })
  switch (status) {
    case 'responded': return 'bg-green-100 text-green-800 border-green-200';
    case 'in_review': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'received': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};


export function AdminPanel() {
  const [state, setState] = useState<State>(initialState);
  
  useEffect(() => {
    const loadTickets = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        const data = await fetchPendingTickets();
        setState(prev => ({ ...prev, tickets: data, loading: false }));
      } catch (err) {
        console.error('Error loading tickets:', err);
        setState(prev => ({ ...prev, error: 'Failed to load tickets', loading: false }));
      }
    };

    loadTickets();
  }, []);

  const handleStatusChange = async (ticketId: string, newStatus: Ticket['status']) => {
    try {
      const updatedTicket = await updateTicketStatus(ticketId, newStatus);
      
      setState(prev => ({
        ...prev,
        tickets: prev.tickets.map(t => t.id === ticketId ? updatedTicket : t),
        selectedTicket: prev.selectedTicket?.id === ticketId ? updatedTicket : prev.selectedTicket,
        error: null
      }));
    } catch (err) {
      console.error('Error updating ticket status:', err);
      setState(prev => ({ ...prev, error: 'Failed to update ticket status' }));
    }
  };

  const handleAddComment = async (ticketId: string, comment: string) => {
    if (!comment.trim()) return;
    
    try {
      // const response = await fetch(`/api/tickets/${ticketId}/comments`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ content: comment.trim(), is_admin: true }),
      // });
      const newComment = await addComment(ticketId, comment.trim(), true);

      setState(prev => {
        if (!prev.selectedTicket || prev.selectedTicket.id !== ticketId) return prev;

        const newTimeline: TimelineEvent = {
          type: 'human',
          timestamp: newComment.created_at,
          message: newComment.text,
          status: prev.selectedTicket.status
        };
        
        const updatedSelectedTicket = {
          ...prev.selectedTicket,
          timeline: [...(prev.selectedTicket.timeline || []), newTimeline]
        };
        
        return {
          ...prev,
          selectedTicket: updatedSelectedTicket,
          tickets: prev.tickets.map(t => 
            t.id === ticketId ? updatedSelectedTicket : t
          ),
          reviewComment: '',
          error: null
        };
      });
    } catch (err) {
      console.error('Error adding comment:', err);
      setState(prev => ({ ...prev, error: 'Failed to add comment' }));
    }
  };
  const generateAutoFeedback = () => {
    const autoMessages = [
      "Automated review completed. No policy violations detected.",
      "Content flagged for manual review due to sensitive keywords.",
      "Similar reports consolidated. Pattern analysis in progress.",
      "Advertiser notification sent. Awaiting response within 48 hours."
    ];

    const randomMessage = autoMessages[Math.floor(Math.random() * autoMessages.length)];
    setState(prev => ({ ...prev, reviewComment: randomMessage }));
  };

  const triggerImpactEvent = async (impactType: string) => {
    const { selectedTicket } = state;
    if (!selectedTicket) return;

    const impactMessages: Record<string, string> = {
      'ad_removed': 'Advertisement removed from platform',
      'advertiser_warned': 'Advertiser received formal warning',
      'policy_updated': 'Policy guidance updated for this ad category',
      'report_used': 'Report Used in Analytics Summary',
      'enhanced_monitoring': 'Enhanced Monitoring Activated',
      'content_filtered': 'Content Filter Updated',
      'in_review_log': 'Review logged; no action taken yet',
    };

    const message = impactMessages[impactType] || 'Impact action triggered';
    
    try {
      // const response = await fetch(`/api/impact-events`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     type: impactType,
      //     description: message,
      //     ticket_id: selectedTicket.id,
      //     admin_id: null,
      //   }),
      // });
      const impact_event = await addImpactEvent(impactType, message, selectedTicket.id);

      
      setState(prev => {
        const updatedSelectedTicket: Ticket = {
          ...prev.selectedTicket!,
          timeline: [...(prev.selectedTicket?.timeline || []), {
            status: prev.selectedTicket!.status,
            timestamp: impact_event.created_at,
            message,
            type: impactType === 'system' ? 'system' : 'human',
          }]
        };

        return {
          ...prev,
          selectedTicket: updatedSelectedTicket,
          tickets: prev.tickets.map(t => 
            t.id === selectedTicket.id ? updatedSelectedTicket : t
          ),
          error: null
        };
      });
    } catch (err) {
      console.error('Error triggering impact event:', err);
      setState(prev => ({ ...prev, error: 'Failed to trigger impact event' }));
    }
  };

  const pendingTickets = state.tickets.filter(t => t.status !== 'responded');

  return (
    <div className="flex-1">
      {/* Header */}
      <header className="border-b bg-background p-6">
        <h1 className="text-2xl">Admin Panel</h1>
        <p className="text-muted-foreground">Review and manage reported content</p>
      </header>

      <div className="flex h-full">
        {/* Left Panel - Tickets List */}
        <div className="w-1/2 p-6 border-r">
          <Card>
            <CardHeader>
              <CardTitle>Tickets Awaiting Review ({pendingTickets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {state.loading ? (
                <div className="flex items-center justify-center p-6">
                  <p className="text-muted-foreground">Loading tickets...</p>
                </div>
              ) : state.error ? (
                <div className="flex items-center justify-center p-6">
                  <p className="text-red-500">{state.error}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className={`cursor-pointer hover:bg-muted/50 ${state.selectedTicket?.id === ticket.id ? 'bg-muted' : ''
                          }`}
                        onClick={() => setState(prev => ({ ...prev, selectedTicket: ticket }))}
                      >
                        <TableCell className="font-mono text-sm">{ticket.id}</TableCell>
                        <TableCell className="max-w-xs truncate">{ticket.title}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            {displayStatus(ticket.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Ticket Details & Actions */}
        <div className="w-1/2 p-6">
          {state.selectedTicket ? (
            <div className="space-y-6">
              {/* Ticket Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {state.selectedTicket.title}
                    <Badge className={getStatusColor(state.selectedTicket.status)}>
                      {displayStatus(state.selectedTicket.status)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">ID: {state.selectedTicket.id}</p>
                  <p>{state.selectedTicket.description}</p>
                </CardContent>
              </Card>

              {/* Status Update */}
              <Card>
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={state.selectedTicket.status}
                    onValueChange={(value: Ticket['status']) => handleStatusChange(state.selectedTicket!.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status">
                        {displayStatus(state.selectedTicket.status)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Review Comment */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Review Comment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={state.reviewComment}
                    onChange={(e) => setState(prev => ({ ...prev, reviewComment: e.target.value }))}
                    placeholder="Add feedback or notes about this report"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleAddComment(state.selectedTicket!.id, state.reviewComment)} 
                      disabled={!state.reviewComment.trim()}
                    >
                      Add Comment
                    </Button>
                    <Button variant="outline" onClick={generateAutoFeedback}>
                      <Bot className="mr-2 h-4 w-4" />
                      Generate Auto Feedback
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Impact Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Trigger Impact Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => triggerImpactEvent('advertiser_warned')}
                      className="flex items-center justify-center"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Warn Advertiser
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => triggerImpactEvent('ad_removed')}
                      className="flex items-center justify-center"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Ad
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => triggerImpactEvent('policy_updated')}
                      className="flex items-center justify-center"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Update Policy
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => triggerImpactEvent('report_used')}
                      className="flex items-center justify-center"
                    >
                      <ChartColumn className="mr-2 h-4 w-4" />
                      Use Report
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => triggerImpactEvent('enhanced_monitoring')}
                      className="flex items-center justify-center"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Enhance Monitoring
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => triggerImpactEvent('content_filtered')}
                      className="flex items-center justify-center"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Filter Content
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => triggerImpactEvent('in_review_log')}
                      className="flex items-center justify-center col-span-2"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Review Log
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              {state.selectedTicket.timeline && state.selectedTicket.timeline.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {state.selectedTicket.timeline.map((event: TimelineEvent, index: number) => (
                        <div key={index} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm">{event.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(event.timestamp).toLocaleString()} • {event.type === 'system' ? 'System' : 'Human'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Select a ticket to view details and actions</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}