import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertTriangle, Trash2, BarChart3, Bot } from 'lucide-react';
import { Ticket } from './ReporterDashboard';

export function AdminPanel() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TCK-001',
      title: 'Misleading Health Claims in Advertisement',
      description: 'Found an ad making unverified health claims about supplements.',
      status: 'Resolved',
      lastUpdated: '2024-01-15',
      timeline: [
        { status: 'Received', timestamp: '2024-01-10 09:30', message: 'Report submitted successfully', type: 'system' },
        { status: 'In Review', timestamp: '2024-01-12 14:20', message: 'Report assigned to reviewer team', type: 'system' },
        { status: 'Resolved', timestamp: '2024-01-15 16:45', message: 'Advertisement removed and advertiser warned', type: 'human' }
      ]
    },
    {
      id: 'TCK-002',
      title: 'Inappropriate Content Targeting',
      description: 'Adult content being shown to minors in gaming app.',
      status: 'In Review',
      lastUpdated: '2024-01-14',
      timeline: [
        { status: 'Received', timestamp: '2024-01-13 16:20', message: 'Report submitted successfully', type: 'system' },
        { status: 'In Review', timestamp: '2024-01-14 10:00', message: 'Report under active investigation', type: 'system' }
      ]
    },
    {
      id: 'TCK-003',
      title: 'Fraudulent Investment Scheme',
      description: 'Suspicious investment ad promising unrealistic returns.',
      status: 'Received',
      lastUpdated: '2024-01-14',
      timeline: [
        { status: 'Received', timestamp: '2024-01-14 13:45', message: 'Report submitted successfully', type: 'system' }
      ]
    },
    {
      id: 'TCK-004',
      title: 'Fake Product Reviews',
      description: 'Multiple suspicious 5-star reviews posted on the same day.',
      status: 'Received',
      lastUpdated: '2024-01-13',
      timeline: [
        { status: 'Received', timestamp: '2024-01-13 11:20', message: 'Report submitted successfully', type: 'system' }
      ]
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Review': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Received': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const updateTicketStatus = (status: string) => {
    if (!selectedTicket) return;
    
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        const newTimeline = [...(ticket.timeline || [])];
        newTimeline.push({
          status,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          message: `Status updated to ${status}`,
          type: 'system'
        });
        
        return {
          ...ticket,
          status: status as 'Received' | 'In Review' | 'Resolved',
          lastUpdated: new Date().toISOString().split('T')[0],
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
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          message: reviewComment,
          type: 'human'
        });
        
        return {
          ...ticket,
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
    
    // In a real app, this would trigger an actual impact event
    // For now, we'll just add it to the timeline
    const impactMessages = {
      'ad-removed': 'Advertisement removed from platform',
      'advertiser-warned': 'Advertiser received formal warning',
      'account-suspended': 'Advertiser account temporarily suspended'
    };
    
    const message = impactMessages[impactType as keyof typeof impactMessages] || 'Impact action triggered';
    
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        const newTimeline = [...(ticket.timeline || [])];
        newTimeline.push({
          status: ticket.status,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          message,
          type: 'system'
        });
        
        return {
          ...ticket,
          timeline: newTimeline
        };
      }
      return ticket;
    });
    
    setTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id) || null);
  };

  const pendingTickets = tickets.filter(t => t.status !== 'Resolved');

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
                          {ticket.status}
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
                      {selectedTicket.status}
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
                  <Select onValueChange={updateTicketStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Received">Received</SelectItem>
                      <SelectItem value="In Review">In Review</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
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
                              {event.timestamp} • {event.type === 'system' ? 'System' : 'Human'}
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