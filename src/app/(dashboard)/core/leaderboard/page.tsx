import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Users } from 'lucide-react';
import { Team } from '@/types/auth';

// Mock data
const mockLeaderboard: Team[] = [
  { id: 'team1', name: 'Code Warriors', leader: 'John Doe', members: ['John Doe', 'Jane Smith', 'Mike Wilson', 'Sarah Johnson'], points: 850, rank: 1 },
  { id: 'team2', name: 'Debug Masters', leader: 'Alice Brown', members: ['Alice Brown', 'Bob Davis', 'Carol White', 'David Lee'], points: 720, rank: 2 },
  { id: 'team3', name: 'Algorithm Aces', leader: 'Emma Wilson', members: ['Emma Wilson', 'Frank Miller', 'Grace Taylor', 'Henry Clark'], points: 680, rank: 3 },
  { id: 'team4', name: 'Tech Titans', leader: 'Ivy Anderson', members: ['Ivy Anderson', 'Jack Roberts', 'Kelly Moore', 'Liam Harris'], points: 590, rank: 4 },
  { id: 'team5', name: 'Code Crusaders', leader: 'Noah Thompson', members: ['Noah Thompson', 'Olivia Garcia', 'Peter Martinez', 'Quinn Rodriguez'], points: 520, rank: 5 },
];

export default function LeaderboardPage() {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-orange-500" />;
      default: return <span className="h-5 w-5 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>;
    }
  };

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
          <h1 className="text-3xl font-bold text-neon">Leaderboard</h1>
          <p className="text-muted-foreground">Current team standings and rankings</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Trophy className="h-5 w-5" />
          <span>Tournament Rankings</span>
        </div>
      </div>

      {/* Top 3 Teams Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockLeaderboard.slice(0, 3).map((team, index) => (
          <Card key={team.id} className={`bg-dark-surface border-border ${index === 0 ? 'glow-blue' : index === 1 ? 'glow-purple' : ''}`}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {getRankIcon(team.rank)}
              </div>
              <CardTitle className="text-xl">{team.name}</CardTitle>
              <CardDescription>Led by {team.leader}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <div className="text-3xl font-bold text-primary">{team.points}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
              <Badge variant={getRankBadgeVariant(team.rank)} className="text-sm">
                Rank #{team.rank}
              </Badge>
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {team.members.length} members
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle>Complete Rankings</CardTitle>
          <CardDescription>All teams ranked by total points earned</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLeaderboard.map((team) => (
                  <TableRow key={team.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {getRankIcon(team.rank)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.leader}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {team.members.length}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {team.points}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(team.points / mockLeaderboard[0].points) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12">
                          {Math.round((team.points / mockLeaderboard[0].points) * 100)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle>Competition Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{mockLeaderboard.length}</div>
              <div className="text-sm text-muted-foreground">Active Teams</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{mockLeaderboard.reduce((acc, team) => acc + team.points, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">{mockLeaderboard[0].points}</div>
              <div className="text-sm text-muted-foreground">Highest Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{Math.round(mockLeaderboard.reduce((acc, team) => acc + team.points, 0) / mockLeaderboard.length)}</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}