"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Member } from '@/types/auth';

// Mock data
const mockMembers: Member[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Developer', joinDate: '2024-01-15', teamId: 'team1' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Designer', joinDate: '2024-01-20', teamId: 'team1' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Manager', joinDate: '2024-02-01', teamId: 'team2' },
  { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'Tester', joinDate: '2024-02-10', teamId: 'team2' },
];

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'joinDate'>('name');

  const filteredMembers = members
    .filter(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'joinDate') {
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      }
      return a[sortBy].localeCompare(b[sortBy]);
    });

  const handleDelete = (id: string) => {
    setMembers(members.filter(member => member.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">Members Management</h1>
          <p className="text-muted-foreground">Manage CSI members and their information</p>
        </div>
        <Button className="glow-blue">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle>All Members</CardTitle>
          <CardDescription>
            View and manage all CSI members. Total: {members.length} members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'role' | 'joinDate')}
              className="px-3 py-2 bg-input border border-border rounded-md text-foreground"
            >
              <option value="name">Sort by Name</option>
              <option value="role">Sort by Role</option>
              <option value="joinDate">Sort by Join Date</option>
            </select>
          </div>

          {/* Members Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} className="border-border">
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="glow-purple">
                        {member.role}
                      </Badge>
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
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No members found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}