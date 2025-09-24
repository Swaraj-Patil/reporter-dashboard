import type { Ticket, Comment, ImpactEvent } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Tickets API
export const fetchTickets = async (): Promise<Ticket[]> => {
  const response = await fetch(`${API_BASE_URL}/tickets`);
  if (!response.ok) throw new Error('Failed to fetch tickets');
  const data = await response.json();
  return data.tickets;
};

export const fetchTicket = async (id: string): Promise<Ticket> => {
  const response = await fetch(`${API_BASE_URL}/tickets/${id}`);
  if (!response.ok) throw new Error('Failed to fetch ticket');
  return response.json();
};

export const createTicket = async (data: { title: string; description: string }): Promise<Ticket> => {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create ticket');
  const _data = await response.json();
  return _data.ticket;
};

// Comments API
export const fetchTicketComments = async (ticketId: string): Promise<Comment[]> => {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments`);
  if (!response.ok) throw new Error('Failed to fetch comments');
  return response.json();
};

export const addComment = async (ticketId: string, content: string): Promise<Comment> => {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error('Failed to add comment');
  return response.json();
};

// Impact Events API
export const fetchTicketImpactEvents = async (ticketId: string): Promise<ImpactEvent[]> => {
  const response = await fetch(`${API_BASE_URL}/impact-events?ticket_id=${ticketId}`);
  if (!response.ok) throw new Error('Failed to fetch impact events');
  return response.json();
};