import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';

const mockLeaderboard = [
  { rank: 1, name: 'Code Warriors', leader: 'John Doe', points: 850 },
  { rank: 2, name: 'Debug Masters', leader: 'Alice Brown', points: 720 },
  { rank: 3, name: 'Algorithm Aces', leader: 'Emma Wilson', points: 680 },
  { rank: 4, name: 'Tech Titans', leader: 'Ivy Anderson', points: 590 },
  { rank: 5, name: 'Code Crusaders', leader: 'Noah Thompson', points: 520 },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-lavender">Leaderboard</h1>
        <p className="text-muted-foreground">Current team standings and rankings</p>
      </div>

      <Card className="bg-dark-surface border-border glow-purple">
        <CardHeader>
          <CardTitle>Team Rankings</CardTitle>
          <CardDescription>Current competition standings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Team Name</TableHead>
                <TableHead>Leader</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeaderboard.map((team) => (
                <TableRow key={team.rank} className="border-border">
                  <TableCell>{getRankIcon(team.rank)}</TableCell>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.leader}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{team.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}