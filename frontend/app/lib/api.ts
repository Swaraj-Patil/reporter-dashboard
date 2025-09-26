import type { Ticket, Comment, ImpactEvent } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Tickets API
export interface FetchTicketsOptions {
    status?: ('received' | 'in_review' | 'responded')[];
    anonymize?: boolean;
}

export const fetchTickets = async (options?: FetchTicketsOptions): Promise<Ticket[]> => {
    const params = new URLSearchParams();
    if (options?.status?.length) {
        params.set('status', options.status.join(','));
    }
    if (options?.anonymize !== undefined) {
        params.set('anonymize', options.anonymize.toString());
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/tickets${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch tickets');
    const data = await response.json();
    return data.tickets;
};

export const fetchPendingTickets = async (): Promise<Ticket[]> => {
    return fetchTickets({ status: ['received', 'in_review'] });
};

export const fetchTicket = async (id: string): Promise<Ticket> => {
    const response = await fetch(`${API_BASE_URL}/api/tickets/${id}`);
    if (!response.ok) throw new Error('Failed to fetch ticket');
    return response.json();
};

export const createTicket = async (data: { title: string; description: string }): Promise<Ticket> => {
    const response = await fetch(`${API_BASE_URL}/api/tickets`, {
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
    const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/comments`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    const data = await response.json();
    return data.comments;
};

export const addComment = async (
    ticketId: string,
    content: string,
    isAdmin: boolean = false
): Promise<Comment> => {
    //   const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/comments`, {
    const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ticket_id: ticketId,
            body: content,
            user_id: null,
            is_admin: isAdmin
        }),
    });
    if (!response.ok) throw new Error('Failed to add comment');
    const data = await response.json();
    return data.comment;
};

// Ticket Status API
export const updateTicketStatus = async (
    ticketId: string,
    status: 'received' | 'in_review' | 'responded'
): Promise<Ticket> => {
    const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update ticket status');
    const data = await response.json();
    return data.ticket;
};

// Impact Events API
export const fetchImpactEvents = async (options?: { ticketId?: number; limit?: number }): Promise<ImpactEvent[]> => {
    let url = `${API_BASE_URL}/api/impact-events`;
    const params = new URLSearchParams();

    if (options?.ticketId) {
        params.append('ticket_id', options.ticketId.toString());
    }
    if (options?.limit) {
        params.append('limit', options.limit.toString());
    }

    const queryString = params.toString();
    if (queryString) {
        url += `?${queryString}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch impact events');
    const data = await response.json();
    return data.impact_events;
};

export const addImpactEvent = async (
    type: string,
    description: string,
    ticket_id: string
): Promise<Comment> => {
    //   const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/comments`, {
    const response = await fetch(`${API_BASE_URL}/api/impact-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type,
            description,
            ticket_id,
            admin_id: 3,
        }),
    });
    if (!response.ok) throw new Error('Failed to add impact event');
    const data = await response.json();
    return data.impact_event;
};
