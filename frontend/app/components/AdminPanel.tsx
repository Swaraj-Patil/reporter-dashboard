import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertTriangle, Trash2, BarChart3, Bot } from 'lucide-react';
import type { Ticket, TimelineEvent } from '../lib/types';

// Helper functions for status handling
const displayStatus = (status: string): string => {
  console.log({status})
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
    console.log({status})
    switch (status) {
      case 'responded': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_review': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'received': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

export function AdminPanel() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TCK-001',
      title: 'Misleading Health Claims in Advertisement',
      description: 'Found an ad making unverified health claims about supplements.',
      status: 'responded',
      created_at: "2024-03-21T10:00:00Z",
      updated_at: "2024-03-21T10:00:00Z",
      lastUpdated: "2 days ago",
      timeline: [
        {
          status: "submitted",
          timestamp: "2024-03-21T10:00:00Z",
          message: "Ticket created",
          type: "system"
        }
      ]
    },
    {
      id: 'TCK-002',
      title: 'Data Privacy Breach',
      description: 'An app is sharing location data without user consent.',
      status: 'in_review',
      created_at: "2024-03-22T09:00:00Z",
      updated_at: "2024-03-22T09:00:00Z",
      lastUpdated: "1 day ago",
      timeline: [
        {
          status: "submitted",
          timestamp: "2024-03-22T09:00:00Z",
          message: "Ticket created",
          type: "system"
        }
      ]
    },
    {
      id: 'TCK-003',
      title: 'Misleading Subscription Terms',
      description: 'Hidden subscription fees in a freemium app.',
      status: 'received',
      created_at: "2024-03-23T09:00:00Z",
      updated_at: "2024-03-23T09:00:00Z",
      lastUpdated: "3 hours ago",
      timeline: []
    },
    {
      id: 'TCK-004',
      title: 'False Advertisement Claims',
      description: 'Product features advertised but not available.',
      status: 'received',
      created_at: "2024-03-23T11:00:00Z",
      updated_at: "2024-03-23T11:00:00Z",
      lastUpdated: "1 hour ago",
      timeline: []
    }
  ]);

  const updateTicketStatus = (newStatus: 'received' | 'in_review' | 'responded') => {
    if (!selectedTicket) return;

    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        const newTimeline = [...(ticket.timeline || [])];
        newTimeline.push({
          status: newStatus,
          timestamp: new Date().toISOString(),
          message: `Status updated to ${displayStatus(newStatus)}`,
          type: 'system'
        });
        
        return {
          ...ticket,
          status: newStatus,
          updated_at: new Date().toISOString(),
          lastUpdated: "Just now",
          timeline: newTimeline
        };
      }
      return ticket;
    });
    
    setTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id) || null);
  };

  const addReviewComment = () => {
    if (!selectedTicket || !reviewComment.trim()) return;
    
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        const newTimeline = [...(ticket.timeline || [])];
        newTimeline.push({
          status: ticket.status,
          timestamp: new Date().toISOString(),
          message: reviewComment,
          type: 'human'
        });
        
        return {
          ...ticket,
          updated_at: new Date().toISOString(),
          lastUpdated: "Just now",
          timeline: newTimeline
        };
      }
      return ticket;
    });
    
    setTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id) || null);
    setReviewComment('');
  };

  const generateAutoFeedback = () => {
    const autoMessages = [
      "Automated review completed. No policy violations detected.",
      "Content flagged for manual review due to sensitive keywords.",
      "Similar reports consolidated. Pattern analysis in progress.",
      "Advertiser notification sent. Awaiting response within 48 hours."
    ];
    
    const randomMessage = autoMessages[Math.floor(Math.random() * autoMessages.length)];
    setReviewComment(randomMessage);
  };

  const triggerImpactEvent = (impactType: string) => {
    if (!selectedTicket) return;
    
    const impactMessages: Record<string, string> = {
      'ad-removed': 'Advertisement removed from platform',
      'advertiser-warned': 'Advertiser received formal warning',
      'account-suspended': 'Advertiser account temporarily suspended'
    };
    
    const message = impactMessages[impactType] || 'Impact action triggered';
    
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        const newTimeline = [...(ticket.timeline || [])];
        newTimeline.push({
          status: ticket.status,
          timestamp: new Date().toISOString(),
          message,
          type: 'system'
        });
        
        return {
          ...ticket,
          updated_at: new Date().toISOString(),
          lastUpdated: "Just now",
          timeline: newTimeline
        };
      }
      return ticket;
    });
    
    setTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id) || null);
  };

  const pendingTickets = tickets.filter(t => t.status !== 'responded');

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
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedTicket?.id === ticket.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <TableCell className="font-mono text-sm">{ticket.id}</TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.title}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.status)}>
                          {displayStatus(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{ticket.lastUpdated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Ticket Details & Actions */}
        <div className="w-1/2 p-6">
          {selectedTicket ? (
            <div className="space-y-6">
              {/* Ticket Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {selectedTicket.title}
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {displayStatus(selectedTicket.status)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">ID: {selectedTicket.id}</p>
                  <p>{selectedTicket.description}</p>
                </CardContent>
              </Card>

              {/* Status Update */}
              <Card>
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select 
                    value={selectedTicket.status}
                    onValueChange={(value: 'received' | 'in_review' | 'responded') => updateTicketStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status">
                        {displayStatus(selectedTicket.status)}
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
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Add feedback or notes about this report"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={addReviewComment} disabled={!reviewComment.trim()}>
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
                      onClick={() => triggerImpactEvent('advertiser-warned')}
                      className="flex items-center justify-center"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Warn Advertiser
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => triggerImpactEvent('ad-removed')}
                      className="flex items-center justify-center"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Ad
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => triggerImpactEvent('account-suspended')}
                      className="flex items-center justify-center col-span-2"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Suspend Account
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              {selectedTicket.timeline && selectedTicket.timeline.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedTicket.timeline.map((event, index) => (
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