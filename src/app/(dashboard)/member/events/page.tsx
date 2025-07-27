"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, User, Clock, CheckCircle } from 'lucide-react';
import { Event } from '@/types/auth';

// Mock events data
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Web Development Challenge',
    description: 'Build a responsive website using modern web technologies. Show off your HTML, CSS, and JavaScript skills!',
    maxParticipants: 50,
    deadline: '2024-12-25',
    type: 'individual',
    status: 'active',
    registeredCount: 23
  },
  {
    id: '2',
    title: 'Team Hackathon 2024',
    description: 'Create an innovative solution in 48 hours. Teams of 4 will compete to build the most creative project.',
    maxParticipants: 20,
    deadline: '2024-12-30',
    type: 'team',
    status: 'active',
    registeredCount: 8
  },
  {
    id: '3',
    title: 'AI/ML Workshop',
    description: 'Learn the fundamentals of machine learning and artificial intelligence with hands-on exercises.',
    maxParticipants: 30,
    deadline: '2024-12-28',
    type: 'individual',
    status: 'active',
    registeredCount: 15
  },
  {
    id: '4',
    title: 'Algorithm Contest',
    description: 'Solve complex algorithmic problems and compete for the top spot on the leaderboard.',
    maxParticipants: 100,
    deadline: '2024-11-15',
    type: 'individual',
    status: 'ended',
    registeredCount: 89
  }
];

export default function EventsPage() {
  const [registeredEvents, setRegisteredEvents] = useState<string[]>(['3']);

  const handleRegister = (eventId: string) => {
    setRegisteredEvents([...registeredEvents, eventId]);
  };

  const isRegistered = (eventId: string) => registeredEvents.includes(eventId);
  const isDeadlinePassed = (deadline: string) => new Date(deadline) < new Date();

  const activeEvents = mockEvents.filter(event => event.status === 'active');
  const pastEvents = mockEvents.filter(event => event.status === 'ended');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-lavender">Events</h1>
          <p className="text-muted-foreground">Discover and register for CSI events</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>{activeEvents.length} Active</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>{registeredEvents.length} Registered</span>
          </div>
        </div>
      </div>

      {/* Active Events */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Active Events
        </h2>
        
        {activeEvents.length === 0 ? (
          <Card className="bg-dark-surface border-border">
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active events at the moment. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {activeEvents.map((event) => (
              <Card key={event.id} className="bg-dark-surface border-border glow-purple">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {event.title}
                        <Badge variant="default" className="glow-blue">
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
                <CardContent className="space-y-4">
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
                      <span className="text-muted-foreground">Spots Left: </span>
                      <span className="font-medium text-primary">
                        {event.maxParticipants - event.registeredCount}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300 glow-blue"
                      style={{ width: `${(event.registeredCount / event.maxParticipants) * 100}%` }}
                    />
                  </div>

                  {/* Registration Button */}
                  <div className="flex justify-end">
                    {isRegistered(event.id) ? (
                      <Button disabled className="bg-green-500/20 text-green-500">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Registered
                      </Button>
                    ) : isDeadlinePassed(event.deadline) ? (
                      <Button disabled variant="outline">
                        Registration Closed
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleRegister(event.id)}
                        className="glow-purple"
                      >
                        Register Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Events */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Past Events
        </h2>
        
        <div className="grid gap-4">
          {pastEvents.map((event) => (
            <Card key={event.id} className="bg-dark-surface border-border opacity-75">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {event.title}
                      <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500">
                        Completed
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
                    <span>Ended: {new Date(event.deadline).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Final Participants: </span>
                    <span className="font-medium">{event.registeredCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Participation: </span>
                    <span className="font-medium">
                      {Math.round((event.registeredCount / event.maxParticipants) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}