"use client"

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Edit, Save, X } from 'lucide-react';
import { getMemberRoles, getMembers, getProfileUser, updateMemberRole } from './actions';
import { toast } from 'sonner';
import { set } from 'date-fns';

export default function RolesPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState<string>('');
  const [loadingData, setLoadingData] = useState(true);
  const [loadEditMemberRole, setLoadEditMemberRole] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [availableRolesWithDescription, setAvailableRolesWithDescription] = useState<any[]>([]);
  const [roleColors, setRoleColors] = useState<{name : string, color_class: string}[]>([]);
  const [profileUser, setProfileUser] = useState<any>(null);

  const fetchAllMembersAndRoles = useCallback(async () => {
    setLoadingData(true);

    try {
      const [activeMembers, memberRoles, response] = await Promise.all([getMembers(), getMemberRoles(), getProfileUser()]);

      if(response.error) {
        throw new Error(response.error);
      }

      else if(response.success){
        setProfileUser(response.user);
      }

      setMembers(activeMembers);
      const roles = memberRoles.map(role => role.name);
      
      setAvailableRoles(roles);
      setAvailableRolesWithDescription(memberRoles);

      const assignableRoles = memberRoles.map((role:any) => {
        return {
          name: role.name as string,
          color_class: role.color_class as string || 'bg-gray-500/20 text-gray-500'
        }
      });

      setRoleColors(assignableRoles);

    } catch (error) {
        console.error("Failed to fetch members:", error)
        toast.error("Error", {
          description: "Failed to load members. Please try again.",
        });

    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchAllMembersAndRoles()
  }, [fetchAllMembersAndRoles]);

  const handleEditRole = (memberId: string, currentRole: string) => {
    setEditingId(memberId);
    setTempRole(currentRole);
  };

  const handleSaveRole = async (memberId: string) => {
    setLoadEditMemberRole(true);

    try {
      const roleId = availableRolesWithDescription.find(role => role.name.toLowerCase() === tempRole.toLocaleLowerCase())?.id

      const res = await updateMemberRole(memberId, tempRole, roleId);

      if (!res.success) {
        console.error('Failed to update member role:', res.error);
        throw new Error(res.error);
      } else {
        console.log('Role updated successfully');
        
        await fetchAllMembersAndRoles();

        setEditingId(null);
        setTempRole('');

        toast.success('Member role updated successfully');
      }

    } catch (error: any) {
      toast.error(error);
    } finally {
      setLoadEditMemberRole(false);
    }
    
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTempRole('');
  };

  const getRoleCount = (role: string) => {
    return members.filter(member => member.member_role.toLowerCase() === role.toLowerCase()).length;
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
                  className={`w-full justify-center 
                    ${roleColors.filter(r => r.name === role)[0].color_class}
                    ${role === "President" && "bg-amber-500/20 text-amber-500"}
                  `}
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
            {
              loadingData ? (
                <div className='flex items-center justify-center h-32 text-muted-foreground'>
                  Loading Members... 
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Join Date</TableHead>
                      {profileUser?.member_role === "president" && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id} className="border-border">
                        <TableCell className="font-medium">{member.full_name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          {editingId === member.id ? (
                            <select
                              value={tempRole}
                              onChange={(e) => setTempRole(e.target.value)}
                              className="px-2 py-1 bg-input dark:border-gray-950 border border-border rounded text-sm"
                            >
                              {availableRoles.map((role) => (
                                <option key={role} value={role} className='dark:bg-gray-600 dark:border-gray-950 text-white'>{role}</option>
                              ))}
                            </select>
                          ) : (
                            <Badge 
                              variant="outline"
                              className={`capitalize 
                                ${roleColors.filter(r => r.name.toLowerCase() === member.member_role)[0]?.color_class} 
                                ${member.member_role === "president" && "bg-amber-500/20 text-amber-500"}                       
                              `}
                            >
                              {member.member_role}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>

                        {
                          profileUser?.member_role === "president" && (
                            <TableCell className="text-right">
                              {editingId === member.id ? (
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleSaveRole(member.id)}
                                    className="glow-blue"
                                    disabled={loadEditMemberRole}
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
                                  onClick={() => handleEditRole(member.id, member.member_role)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          )
                        }
                      </TableRow>
                    ))}
                  </TableBody>

                </Table>
              )
            }
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
            {availableRolesWithDescription.map((role) => (
              <div key={role.id} className='space-y-4'>
                <h4 className={`capitalize font-medium mb-2 ${role.color_class.split(" ")[1]}`}>{role.name}</h4>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
            ))}
          </div>  
        </CardContent>
      </Card>
      
    </div>
  );
}