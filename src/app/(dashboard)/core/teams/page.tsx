"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Plus, Minus } from 'lucide-react';
import { Team } from '@/types/auth';

// Mock data
const mockTeams: Team[] = [
  {
    id: 'team1',
    name: 'Code Warriors',
    leader: 'John Doe',
    members: ['John Doe', 'Jane Smith', 'Mike Wilson', 'Sarah Johnson'],
    points: 850,
    rank: 1
  },
  {
    id: 'team2',
    name: 'Debug Masters',
    leader: 'Alice Brown',
    members: ['Alice Brown', 'Bob Davis', 'Carol White', 'David Lee'],
    points: 720,
    rank: 2
  },
  {
    id: 'team3',
    name: 'Algorithm Aces',
    leader: 'Emma Wilson',
    members: ['Emma Wilson', 'Frank Miller', 'Grace Taylor', 'Henry Clark'],
    points: 680,
    rank: 3
  },
  {
    id: 'team4',
    name: 'Tech Titans',
    leader: 'Ivy Anderson',
    members: ['Ivy Anderson', 'Jack Roberts', 'Kelly Moore', 'Liam Harris'],
    points: 590,
    rank: 4
  }
];

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [pointsInput, setPointsInput] = useState<{ [key: string]: string }>({});

  const handleAddPoints = (teamId: string) => {
    const points = parseInt(pointsInput[teamId] || '0');
    if (points > 0) {
      setTeams(teams.map(team => 
        team.id === teamId 
          ? { ...team, points: team.points + points }
          : team
      ));
      setPointsInput({ ...pointsInput, [teamId]: '' });
    }
  };

  const handleRemovePoints = (teamId: string) => {
    const points = parseInt(pointsInput[teamId] || '0');
    if (points > 0) {
      setTeams(teams.map(team => 
        team.id === teamId 
          ? { ...team, points: Math.max(0, team.points - points) }
          : team
      ));
      setPointsInput({ ...pointsInput, [teamId]: '' });
    }
  };

  // Update ranks based on points
  const sortedTeams = teams
    .sort((a, b) => b.points - a.points)
    .map((team, index) => ({ ...team, rank: index + 1 }));

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1: return 'default';
      case 2: return 'secondary';
      case 3: return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">Tournament Teams</h1>
          <p className="text-muted-foreground">Manage teams and assign points</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Trophy className="h-5 w-5" />
          <span>{teams.length} Teams Registered</span>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedTeams.map((team) => (
          <Card key={team.id} className="bg-dark-surface border-border hover:glow-blue transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <Badge 
                  variant={getRankBadgeVariant(team.rank)}
                  className={team.rank <= 3 ? 'glow-blue' : ''}
                >
                  #{team.rank}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Leader: {team.leader}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Team Members */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Members:</h4>
                <div className="space-y-1">
                  {team.members.map((member, index) => (
                    <div key={index} className="text-sm flex items-center gap-2">
                      <div className="h-2 w-2 bg-primary rounded-full" />
                      {member}
                    </div>
                  ))}
                </div>
              </div>

              {/* Points Display */}
              <div className="text-center py-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{team.points}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>

              {/* Points Management */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Points"
                    value={pointsInput[team.id] || ''}
                    onChange={(e) => setPointsInput({ ...pointsInput, [team.id]: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAddPoints(team.id)}
                    className="flex-1 glow-blue"
                    disabled={!pointsInput[team.id] || parseInt(pointsInput[team.id]) <= 0}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemovePoints(team.id)}
                    className="flex-1"
                    disabled={!pointsInput[team.id] || parseInt(pointsInput[team.id]) <= 0}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle>Team Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{teams.length}</div>
              <div className="text-sm text-muted-foreground">Total Teams</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{teams.reduce((acc, team) => acc + team.members.length, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">{teams.reduce((acc, team) => acc + team.points, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{Math.round(teams.reduce((acc, team) => acc + team.points, 0) / teams.length)}</div>
              <div className="text-sm text-muted-foreground">Avg. Points</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}