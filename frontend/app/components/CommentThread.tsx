import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Bot, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fetchTicketComments, addComment } from '../lib/api';
import type { Comment } from '../lib/types';

interface CommentThreadProps {
  ticketId: string;
  isAdmin?: boolean;
  className?: string;
}

export function CommentThread({ ticketId, isAdmin = false, className = '' }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedComments = await fetchTicketComments(ticketId);
      setComments(fetchedComments);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  // Load initial comments
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Set up WebSocket listener for real-time updates
  useEffect(() => {
    const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'comment:created' && data.comment.ticket_id === ticketId) {
        setComments(prev => [...prev, data.comment]);
      }
    };

    return () => {
      socket.close();
    };
  }, [ticketId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setError(null);
      const comment = await addComment(ticketId, newComment, isAdmin);
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  return (
    <div className={className}>
      {loading ? (
        <p className="text-center text-muted-foreground">Loading comments...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="space-y-4">
          {/* Comment List */}
          <div className="space-y-3">
            {comments.map((comment, index) => (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {comment.is_automated ? (
                      <Bot className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{comment.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {comment.author_name || (comment.is_automated ? 'System' : 'Anonymous')} •{' '}
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comment Input */}
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <Button 
              onClick={handleSubmitComment} 
              disabled={!newComment.trim()}
              className="w-full"
            >
              Add Comment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}