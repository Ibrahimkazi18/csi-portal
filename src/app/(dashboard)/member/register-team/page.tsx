"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterTeamPage() {
  const [hasTeam, setHasTeam] = useState(false); // Mock: user hasn't registered a team yet
  const [teamForm, setTeamForm] = useState({
    teamName: '',
    leader: '',
    member2: '',
    member3: '',
    member4: ''
  });

  const currentTeam = {
    name: 'Code Warriors',
    leader: 'John Doe',
    members: ['John Doe', 'Jane Smith', 'Mike Wilson', 'Sarah Johnson'],
    registeredAt: '2024-01-15'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock team registration
    setHasTeam(true);
    setTeamForm({
      teamName: '',
      leader: '',
      member2: '',
      member3: '',
      member4: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setTeamForm(prev => ({ ...prev, [field]: value }));
  };

  if (hasTeam) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-lavender">My Team</h1>
            <p className="text-muted-foreground">Your registered team information</p>
          </div>
          <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500">
            <CheckCircle className="h-4 w-4 mr-1" />
            Team Registered
          </Badge>
        </div>

        <Card className="bg-dark-surface border-border glow-purple">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              {currentTeam.name}
            </CardTitle>
            <CardDescription>
              Registered on {new Date(currentTeam.registeredAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentTeam.members.map((member, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    {index === 0 && <Crown className="h-5 w-5 text-secondary-foreground" />}
                    {index !== 0 && <span className="font-medium text-secondary-foreground">{index + 1}</span>}
                  </div>
                  <div>
                    <p className="font-medium">{member}</p>
                    <p className="text-sm text-muted-foreground">
                      {index === 0 ? 'Team Leader' : 'Team Member'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-primary mb-1">Team Registration Rules</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Teams can only be registered once per academic year</li>
                    <li>• Team changes are allowed up to 48 hours before event deadlines</li>
                    <li>• All team members must be active CSI members</li>
                    <li>• Contact core team for any team modification requests</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-lavender">Register Team</h1>
          <p className="text-muted-foreground">Create your team of 4 members for competitions</p>
        </div>
      </div>

      <Card className="bg-dark-surface border-border glow-purple">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            Team Registration Form
          </CardTitle>
          <CardDescription>
            Fill in the details to create your competition team. Each team must have exactly 4 members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamForm.teamName}
                onChange={(e) => handleInputChange('teamName', e.target.value)}
                placeholder="Enter your team name"
                required
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Team Members</h3>
              
              <div className="space-y-2">
                <Label htmlFor="leader" className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-accent" />
                  Team Leader
                </Label>
                <Input
                  id="leader"
                  value={teamForm.leader}
                  onChange={(e) => handleInputChange('leader', e.target.value)}
                  placeholder="Team leader's full name"
                  required
                  className="bg-input border-border"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="member2">Member 2</Label>
                  <Input
                    id="member2"
                    value={teamForm.member2}
                    onChange={(e) => handleInputChange('member2', e.target.value)}
                    placeholder="Second member's name"
                    required
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member3">Member 3</Label>
                  <Input
                    id="member3"
                    value={teamForm.member3}
                    onChange={(e) => handleInputChange('member3', e.target.value)}
                    placeholder="Third member's name"
                    required
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member4">Member 4</Label>
                  <Input
                    id="member4"
                    value={teamForm.member4}
                    onChange={(e) => handleInputChange('member4', e.target.value)}
                    placeholder="Fourth member's name"
                    required
                    className="bg-input border-border"
                  />
                </div>
              </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <h4 className="font-medium mb-2">Important Notes</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• You can only register one team per academic year</li>
                    <li>• All team members must be current CSI members</li>
                    <li>• The team leader will be the primary contact for all communications</li>
                    <li>• Team modifications are allowed up to 48 hours before event deadlines</li>
                    <li>• Make sure all member names are spelled correctly</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full glow-purple">
              <Users className="h-4 w-4 mr-2" />
              Register Team
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}