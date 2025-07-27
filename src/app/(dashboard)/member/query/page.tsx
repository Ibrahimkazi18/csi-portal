"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send } from 'lucide-react';

export default function QueryPage() {
  const [form, setForm] = useState({ subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    alert('Query submitted successfully!');
    setForm({ subject: '', message: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-lavender">Ask Query</h1>
        <p className="text-muted-foreground">Submit your questions to the core team</p>
      </div>

      <Card className="bg-dark-surface border-border glow-purple">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            Submit Your Query
          </CardTitle>
          <CardDescription>
            Ask questions about events, teams, or general CSI activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({...form, subject: e.target.value})}
                placeholder="Brief description of your query"
                required
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
                placeholder="Detailed description of your question or concern"
                required
                className="bg-input border-border min-h-32"
              />
            </div>
            <Button type="submit" className="glow-purple">
              <Send className="h-4 w-4 mr-2" />
              Submit Query
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}