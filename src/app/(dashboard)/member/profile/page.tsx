import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Calendar, Trophy, Users } from 'lucide-react';

export default function ProfilePage() {
  // Mock additional profile data
  const profileData = {
    joinDate: '2024-01-15',
    totalEvents: 5,
    completedEvents: 3,
    currentTeam: 'Code Warriors',
    totalPoints: 250,
    achievements: ['First Event', 'Team Player', 'Active Member'],
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Git']
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-lavender">My Profile</h1>
          <p className="text-muted-foreground">View and manage your CSI profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-dark-surface border-border glow-purple">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-lg font-bold text-secondary-foreground">
                    {/* {user?.name.charAt(0).toUpperCase()} */}User
                  </span>
                </div>
                <div>
                  <h2 className="text-xl">username</h2>
                  <p className="text-muted-foreground">useremail</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <Badge variant="secondary" className="glow-purple">
                        {/* {user?.memberRole || 'Developer'} */} Developer
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium">{new Date(profileData.joinDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Current Team</p>
                      <p className="font-medium">{profileData.currentTeam}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Points</p>
                      <p className="font-medium text-primary">{profileData.totalPoints}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Skills & Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Stats */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>Your participation and engagement statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{profileData.totalEvents}</div>
                  <div className="text-sm text-muted-foreground">Events Registered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{profileData.completedEvents}</div>
                  <div className="text-sm text-muted-foreground">Events Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{Math.round((profileData.completedEvents / profileData.totalEvents) * 100)}%</div>
                  <div className="text-sm text-muted-foreground">Completion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Achievements */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profileData.achievements.map((achievement) => (
                <div key={achievement} className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-accent rounded-full" />
                  <span className="text-sm">{achievement}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Update Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Edit Skills
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Trophy className="h-4 w-4 mr-2" />
                View Certificates
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}