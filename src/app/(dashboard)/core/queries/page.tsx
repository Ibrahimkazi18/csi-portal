"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Clock, CheckCircle } from 'lucide-react';
import { Query } from '@/types/auth';

// Mock data
const mockQueries: Query[] = [
  {
    id: '1',
    subject: 'Event Registration Issue',
    message: 'I am unable to register for the upcoming hackathon. The form keeps showing an error.',
    memberName: 'John Doe',
    memberEmail: 'john@example.com',
    status: 'Open',
    createdAt: '2024-12-20T10:30:00Z'
  },
  {
    id: '2',
    subject: 'Team Formation Question',
    message: 'Can I change my team after registration? We want to add one more member.',
    memberName: 'Jane Smith',
    memberEmail: 'jane@example.com',
    status: 'Resolved',
    response: 'Yes, you can modify your team up to 48 hours before the event deadline. Please contact us with the new member details.',
    createdAt: '2024-12-19T14:15:00Z'
  },
  {
    id: '3',
    subject: 'Technical Requirements',
    message: 'What are the technical requirements for the web development challenge? Do we need to use specific technologies?',
    memberName: 'Mike Johnson',
    memberEmail: 'mike@example.com',
    status: 'Open',
    createdAt: '2024-12-18T09:45:00Z'
  }
];

export default function QueriesPage() {
  const [queries, setQueries] = useState<Query[]>(mockQueries);
  const [responses, setResponses] = useState<{ [key: string]: string }>({});

  const handleResponse = (queryId: string) => {
    const response = responses[queryId];
    if (response?.trim()) {
      setQueries(queries.map(query => 
        query.id === queryId 
          ? { ...query, status: 'Resolved', response }
          : query
      ));
      setResponses({ ...responses, [queryId]: '' });
    }
  };

  const openQueries = queries.filter(q => q.status === 'Open');
  const resolvedQueries = queries.filter(q => q.status === 'Resolved');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">Member Queries</h1>
          <p className="text-muted-foreground">Manage and respond to member questions</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span>{openQueries.length} Open</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>{resolvedQueries.length} Resolved</span>
          </div>
        </div>
      </div>

      {/* Open Queries */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          Open Queries ({openQueries.length})
        </h2>
        
        {openQueries.length === 0 ? (
          <Card className="bg-dark-surface border-border">
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No open queries at the moment!</p>
            </CardContent>
          </Card>
        ) : (
          openQueries.map((query) => (
            <Card key={query.id} className="bg-dark-surface border-border glow-blue">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{query.subject}</CardTitle>
                    <CardDescription>
                      From: {query.memberName} ({query.memberEmail})
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
                      {query.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(query.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{query.message}</p>
                </div>
                
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your response..."
                    value={responses[query.id] || ''}
                    onChange={(e) => setResponses({ ...responses, [query.id]: e.target.value })}
                    className="bg-input border-border"
                  />
                  <Button 
                    onClick={() => handleResponse(query.id)}
                    disabled={!responses[query.id]?.trim()}
                    className="glow-blue"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Response
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Resolved Queries */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Resolved Queries ({resolvedQueries.length})
        </h2>
        
        {resolvedQueries.map((query) => (
          <Card key={query.id} className="bg-dark-surface border-border opacity-80">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{query.subject}</CardTitle>
                  <CardDescription>
                    From: {query.memberName} ({query.memberEmail})
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500">
                    {query.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(query.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-2">Question:</p>
                <p className="text-sm">{query.message}</p>
              </div>
              
              {query.response && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium text-primary mb-2">Response:</p>
                  <p className="text-sm">{query.response}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}