"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Users, User } from 'lucide-react';
import { Event } from '@/types/auth';

// Mock data
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Web Development Challenge',
    description: 'Build a responsive website using modern web technologies',
    maxParticipants: 50,
    deadline: '2024-12-25',
    type: 'individual',
    status: 'active',
    registeredCount: 23
  },
  {
    id: '2',
    title: 'Team Hackathon',
    description: 'Create an innovative solution in 48 hours',
    maxParticipants: 20,
    deadline: '2024-12-30',
    type: 'team',
    status: 'active',
    registeredCount: 8
  },
  {
    id: '3',
    title: 'Algorithm Contest',
    description: 'Solve complex algorithmic problems',
    maxParticipants: 100,
    deadline: '2024-11-15',
    type: 'individual',
    status: 'ended',
    registeredCount: 89
  }
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    maxParticipants: '',
    deadline: '',
    type: 'individual' as 'individual' | 'team'
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      maxParticipants: parseInt(newEvent.maxParticipants),
      deadline: newEvent.deadline,
      type: newEvent.type,
      status: 'active',
      registeredCount: 0
    };
    
    setEvents([event, ...events]);
    setNewEvent({
      title: '',
      description: '',
      maxParticipants: '',
      deadline: '',
      type: 'individual'
    });
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">Events Management</h1>
          <p className="text-muted-foreground">Create and manage CSI events</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)} 
          className="glow-blue"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <Card className="bg-dark-surface border-border glow-blue">
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>Fill in the details to create a new event</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="Enter event title"
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={newEvent.maxParticipants}
                    onChange={(e) => setNewEvent({...newEvent, maxParticipants: e.target.value})}
                    placeholder="50"
                    required
                    className="bg-input border-border"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Describe the event..."
                  required
                  className="bg-input border-border"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newEvent.deadline}
                    onChange={(e) => setNewEvent({...newEvent, deadline: e.target.value})}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Event Type</Label>
                  <select
                    id="type"
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value as 'individual' | 'team'})}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                  >
                    <option value="individual">Individual</option>
                    <option value="team">Team</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="glow-blue">
                  Create Event
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <div className="grid gap-6">
        <h2 className="text-xl font-semibold">All Events</h2>
        {events.map((event) => (
          <Card key={event.id} className="bg-dark-surface border-border">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {event.title}
                    <Badge 
                      variant={event.status === 'active' ? 'default' : 'secondary'}
                      className={event.status === 'active' ? 'glow-blue' : ''}
                    >
                      {event.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {event.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {event.type === 'team' ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  <span className="text-sm capitalize">{event.type}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Deadline: {new Date(event.deadline).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Participants: </span>
                  <span className="font-medium">
                    {event.registeredCount}/{event.maxParticipants}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Progress: </span>
                  <span className="font-medium">
                    {Math.round((event.registeredCount / event.maxParticipants) * 100)}%
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4 w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300 glow-blue"
                  style={{ width: `${(event.registeredCount / event.maxParticipants) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}