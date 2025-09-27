import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Loader2, User, X } from 'lucide-react';
import { ImpactFeed } from './ImpactFeed';
import { TicketDetailPanel } from './TicketDetailPanel';
import { fetchTickets, createTicket } from '../lib/api';
import { Ticket } from '../lib/types';
import { socketClient } from '../lib/socket';
import { format } from 'date-fns';
import { useToast } from './ui/use-toast';
import { camelCaseToEnglish } from '@/lib/utils';

export function ReporterDashboard() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [anonymizedSummaries, setAnonymizedSummaries] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const { toast } = useToast();

  // Fetch tickets on component mount
  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const data = await fetchTickets();
        setTickets(data);
        setError(null);
      } catch (err) {
        console.log('Error', err)
        setError('Failed to load tickets. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load tickets. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [toast]);

  // Set up WebSocket listeners
  useEffect(() => {
    socketClient.connect();

    socketClient.on('ticket:created', (newTicket: Ticket) => {
      setTickets(prev => [newTicket, ...prev]);
      toast({
        title: 'New Ticket',
        description: `Ticket created: ${newTicket.title}`,
      });
    });

    socketClient.on('ticket:updated', (updatedTicket: Ticket) => {
      setTickets(prev => prev.map(ticket =>
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      ));
      toast({
        title: 'Ticket Updated',
        description: `Status changed to: ${updatedTicket.status}`,
      });
    });

    return () => {
      socketClient.disconnect();
    };
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setLoading(true);
      const newTicket = await createTicket({ title, description });
      setTickets([newTicket, ...tickets]);
      setTitle('');
      setDescription('');
      toast({
        title: 'Success',
        description: 'Report submitted successfully',
      });
    } catch (err) {
      console.log('Error', err)
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'responded': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_review': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'received': return 'bg-gray-100 text-gray-800 border-gray-200';
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
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                </div>
              )}
              {error && (
                <div className="bg-destructive/10 border-destructive/20 text-destructive border rounded-md p-4 my-4">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div>
                  <label className="block text-sm mb-2">Title</label>
                  <Input
                    placeholder="Brief description of the issue"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
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
                <div>
                  <Button type="submit">Submit Report</Button>
                </div>
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
                  {[...new Map(tickets.map(ticket => [ticket.id, ticket])).values()]?.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <TableCell className="font-mono text-sm">{`TCK-${String(ticket.id).padStart(3, '0')}`}</TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.title}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.status)}>
                          {camelCaseToEnglish(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(ticket.updated_at || ticket.created_at) ? format(new Date(ticket.updated_at || ticket.created_at), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>
        <div className="md:col-span-1">
          {/* Impact Feed */}
          <ImpactFeed limit={5} className="sticky top-4" />
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