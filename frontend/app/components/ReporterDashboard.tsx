import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { User, X } from 'lucide-react';
import { ImpactFeed } from './ImpactFeed';
import { TicketDetailPanel } from './TicketDetailPanel';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'Received' | 'In Review' | 'Resolved';
  lastUpdated: string;
  feedback?: string[];
  timeline?: Array<{
    status: string;
    timestamp: string;
    message: string;
    type: 'system' | 'human';
  }>;
}

export function ReporterDashboard() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [anonymizedSummaries, setAnonymizedSummaries] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
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
        { status: 'In Review', timestamp: '2024-01-14 11:15', message: 'Additional context gathered from advertiser', type: 'human' },
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
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newTicket: Ticket = {
      id: `TCK-${String(tickets.length + 1).padStart(3, '0')}`,
      title,
      description,
      status: 'Received',
      lastUpdated: new Date().toISOString().split('T')[0],
      timeline: [
        { 
          status: 'Received', 
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16), 
          message: 'Report submitted successfully', 
          type: 'system' 
        }
      ]
    };

    setTickets([...tickets, newTicket]);
    setTitle('');
    setDescription('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Review': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Received': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 flex">
      <div className={`flex-1 ${selectedTicket ? 'pr-96' : ''} transition-all duration-300`}>
        {/* Header */}
        <header className="border-b bg-background p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl">Reporter Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={anonymizedSummaries} 
                  onCheckedChange={setAnonymizedSummaries}
                />
                <label className="text-sm">Anonymized Summaries</label>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <User className="h-4 w-4" />
                <span className="text-sm">Reporter</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Ticket Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit New Report</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed description of the reported content or behavior"
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit">Submit Report</Button>
              </form>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card>
            <CardHeader>
              <CardTitle>Your Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow 
                      key={ticket.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <TableCell className="font-mono text-sm">{ticket.id}</TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.title}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ticket.lastUpdated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Impact Feed */}
          <ImpactFeed />
        </div>
      </div>

      {/* Right Panel for Ticket Details */}
      {selectedTicket && (
        <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg">Ticket Details</h2>
            <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <TicketDetailPanel ticket={selectedTicket} />
        </div>
      )}
    </div>
  );
}