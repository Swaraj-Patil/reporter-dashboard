export interface TimelineEvent {
  status: string;
  timestamp: string;
  message: string;
  type: 'system' | 'human';
}

export interface Ticket {
  id: string;
  external_id?: string;
  title: string;
  description: string;
  summary?: string;
  status: 'received' | 'in_review' | 'responded';
  source?: string;
  reporter?: string;
  privacy_enabled?: boolean;
  comment_count?: number;
  impact_count?: number;
  created_at: string;
  updated_at: string;
  lastUpdated?: string;
  timeline?: TimelineEvent[];
}

export type TicketStatusDisplay = 'Received' | 'In Review' | 'Responded';

export interface Comment {
  id: string;
  ticket_id: string;
  text: string;
  author_name?: string;
  created_at: string;
  user_id?: string;
}

export interface ImpactEvent {
  id: string;
  ticket_id: string;
  type: 'ad_removed' | 'advertiser_warned' | 'policy_updated';
  description: string;
  admin_name?: string;
  created_at: string;
}

export type TicketStatus = 'received' | 'in_review' | 'responded';