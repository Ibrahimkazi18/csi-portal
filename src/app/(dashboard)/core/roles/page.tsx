"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Edit, Save, X } from 'lucide-react';
import { Member } from '@/types/auth';

// Mock data
const mockMembers: Member[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Developer', joinDate: '2024-01-15', teamId: 'team1' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Designer', joinDate: '2024-01-20', teamId: 'team1' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Manager', joinDate: '2024-02-01', teamId: 'team2' },
  { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'Tester', joinDate: '2024-02-10', teamId: 'team2' },
  { id: '5', name: 'Alex Brown', email: 'alex@example.com', role: 'Marketing', joinDate: '2024-02-15', teamId: 'team3' },
];

const availableRoles = ['Developer', 'Designer', 'Manager', 'Tester', 'Marketing', 'Research', 'DevOps'];

const roleColors = {
  'Developer': 'bg-blue-500/20 text-blue-500',
  'Designer': 'bg-purple-500/20 text-purple-500',
  'Manager': 'bg-green-500/20 text-green-500',
  'Tester': 'bg-orange-500/20 text-orange-500',
  'Marketing': 'bg-pink-500/20 text-pink-500',
  'Research': 'bg-cyan-500/20 text-cyan-500',
  'DevOps': 'bg-red-500/20 text-red-500'
};

export default function RolesPage() {
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState<string>('');

  const handleEditRole = (memberId: string, currentRole: string) => {
    setEditingId(memberId);
    setTempRole(currentRole);
  };

  const handleSaveRole = (memberId: string) => {
    setMembers(members.map(member => 
      member.id === memberId 
        ? { ...member, role: tempRole }
        : member
    ));
    setEditingId(null);
    setTempRole('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTempRole('');
  };

  const getRoleCount = (role: string) => {
    return members.filter(member => member.role === role).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">Role Management</h1>
          <p className="text-muted-foreground">Assign and manage member roles</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="h-5 w-5" />
          <span>{members.length} Total Members</span>
        </div>
      </div>

      {/* Role Distribution Overview */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
          <CardDescription>Current breakdown of member roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {availableRoles.map((role) => (
              <div key={role} className="text-center space-y-2">
                <Badge 
                  variant="outline" 
                  className={`w-full justify-center ${roleColors[role as keyof typeof roleColors] || 'bg-gray-500/20 text-gray-500'}`}
                >
                  {role}
                </Badge>
                <div className="text-2xl font-bold text-primary">{getRoleCount(role)}</div>
                <div className="text-xs text-muted-foreground">members</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Members Role Management */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle>Member Roles</CardTitle>
          <CardDescription>Edit individual member roles and responsibilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className="border-border">
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {editingId === member.id ? (
                        <select
                          value={tempRole}
                          onChange={(e) => setTempRole(e.target.value)}
                          className="px-2 py-1 bg-input border border-border rounded text-sm"
                        >
                          {availableRoles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge 
                          variant="outline"
                          className={roleColors[member.role as keyof typeof roleColors] || 'bg-gray-500/20 text-gray-500'}
                        >
                          {member.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(member.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {member.teamId ? (
                        <Badge variant="outline">Team {member.teamId.slice(-1)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">No team</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === member.id ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveRole(member.id)}
                            className="glow-blue"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditRole(member.id, member.role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle>Role Descriptions</CardTitle>
          <CardDescription>Understanding different roles and their responsibilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-blue-500 mb-2">Developer</h4>
                <p className="text-sm text-muted-foreground">Responsible for coding, debugging, and implementing technical solutions.</p>
              </div>
              <div>
                <h4 className="font-medium text-purple-500 mb-2">Designer</h4>
                <p className="text-sm text-muted-foreground">Creates user interfaces, visual designs, and user experience solutions.</p>
              </div>
              <div>
                <h4 className="font-medium text-green-500 mb-2">Manager</h4>
                <p className="text-sm text-muted-foreground">Coordinates team activities, manages projects, and ensures deadlines are met.</p>
              </div>
              <div>
                <h4 className="font-medium text-orange-500 mb-2">Tester</h4>
                <p className="text-sm text-muted-foreground">Conducts quality assurance testing and identifies bugs and issues.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-pink-500 mb-2">Marketing</h4>
                <p className="text-sm text-muted-foreground">Promotes CSI events, manages social media, and handles outreach.</p>
              </div>
              <div>
                <h4 className="font-medium text-cyan-500 mb-2">Research</h4>
                <p className="text-sm text-muted-foreground">Conducts research on new technologies and industry trends.</p>
              </div>
              <div>
                <h4 className="font-medium text-red-500 mb-2">DevOps</h4>
                <p className="text-sm text-muted-foreground">Manages deployment, infrastructure, and continuous integration processes.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}