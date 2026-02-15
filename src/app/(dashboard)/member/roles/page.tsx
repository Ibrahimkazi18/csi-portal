"use client"

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, Users } from 'lucide-react';
import { toast } from 'sonner';
import Preloader from '@/components/ui/preloader';
import { CtaCard, CtaCardContent, CtaCardHeader, CtaCardTitle, CtaCardDescription } from '@/components/ui/cta-card';
import { getMemberRoles, getMembers } from '../../core/roles/actions';

interface Member {
  id: string;
  full_name: string;
  email: string;
  member_role: string;
  member_role_id: string;
  created_at: string;
}

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  color_class: string;
  max_count: number;
}

export default function MemberRolesPage() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [availableRoles, setAvailableRoles] = useState<RoleDefinition[]>([]);
  const [isDataReady, setIsDataReady] = useState(false);

  const roleHierarchy = [
    { role: 'president', label: 'President', minCount: 1, maxCount: 1, icon: Crown },
    { role: 'secretary', label: 'Secretary', minCount: 2, maxCount: null, icon: Shield },
    { role: 'treasurer', label: 'Treasurer', minCount: 2, maxCount: null, icon: Shield },
    { role: 'technicals', label: 'Technical Head', minCount: 2, maxCount: null, icon: Shield },
    { role: 'social media', label: 'Social Media Head', minCount: 2, maxCount: null, icon: Shield },
    { role: 'documentation', label: 'Documentation Head', minCount: 2, maxCount: null, icon: Shield },
    { role: 'creatives', label: 'Creative Head', minCount: 2, maxCount: null, icon: Shield },
  ];

  const fetchAllMembersAndRoles = useCallback(async () => {
    setLoadingData(true);

    try {
      const [activeMembers, memberRoles] = await Promise.all([
        getMembers(), 
        getMemberRoles()
      ]);

      // Filter only core team members (exclude 'none' role)
      const coreMembers = activeMembers.filter((m: Member) => m.member_role && m.member_role.toLowerCase() !== 'none');
      setMembers(coreMembers);
      setAvailableRoles(memberRoles);
      setIsDataReady(true);

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

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false)
  }, [])

  const getMembersForRole = (role: string) => {
    return members.filter(m => m.member_role.toLowerCase() === role.toLowerCase());
  };

  const getRoleColor = (role: string) => {
    const roleData = availableRoles.find(r => r.name.toLowerCase() === role.toLowerCase());
    return roleData?.color_class || 'bg-gray-500/20 text-gray-500';
  };

  if (showPreloader) {
    return (
      <div className="relative w-full h-screen">
        <Preloader onComplete={handlePreloaderComplete} />
      </div>
    )
  }

  if (loadingData || !isDataReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Core Team Hierarchy
          </h1>
          <p className="text-muted-foreground">
            View the CSI core team structure and leadership
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-5 w-5" />
          <span>{members.length} Core Members</span>
        </div>
      </div>

      {/* Hierarchical Organization Chart */}
      <div className="space-y-6">
        {roleHierarchy.map((roleConfig) => {
          const roleMembers = getMembersForRole(roleConfig.role);
          const hasMinimum = roleMembers.length >= roleConfig.minCount;
          const RoleIcon = roleConfig.icon;
          const roleColor = getRoleColor(roleConfig.role);

          return (
            <CtaCard key={roleConfig.role} variant="accent">
              <CtaCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${roleColor}`}>
                      <RoleIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <CtaCardTitle className="text-xl">{roleConfig.label}</CtaCardTitle>
                      <CtaCardDescription>
                        {roleMembers.length} member{roleMembers.length !== 1 ? 's' : ''} assigned
                        {!hasMinimum && (
                          <span className="text-yellow-500 ml-2">
                            (Minimum {roleConfig.minCount} required)
                          </span>
                        )}
                      </CtaCardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={roleColor}>
                    {roleConfig.role}
                  </Badge>
                </div>
              </CtaCardHeader>
              <CtaCardContent>
                {roleMembers.length === 0 ? (
                  /* Empty State */
                  <div className="p-8 rounded-lg border-2 border-dashed border-border bg-muted/20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-full bg-muted">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">
                          No members assigned yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Awaiting assignment by president
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Member Grid - Dynamic columns based on count */
                  <div className={`grid gap-4 ${
                    roleMembers.length === 1 ? 'md:grid-cols-1' :
                    roleMembers.length === 2 ? 'md:grid-cols-2' :
                    roleMembers.length === 3 ? 'md:grid-cols-3' :
                    'md:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {roleMembers.map((member) => (
                      <div
                        key={member.id}
                        className="relative p-4 rounded-lg border border-border bg-card hover:bg-muted/20 transition-all"
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className={`h-12 w-12 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shrink-0`}>
                            {member.full_name.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Member Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1">{member.full_name}</h4>
                            <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                Since {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CtaCardContent>
            </CtaCard>
          );
        })}
      </div>

      {/* Role Descriptions */}
      <CtaCard>
        <CtaCardHeader>
          <CtaCardTitle>Role Descriptions</CtaCardTitle>
          <CtaCardDescription>Understanding different roles and their responsibilities</CtaCardDescription>
        </CtaCardHeader>
        <CtaCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableRoles
              .filter(role => role.name.toLowerCase() !== 'none')
              .map((role) => (
                <div key={role.id} className='space-y-2 p-4 rounded-lg border border-border bg-card'>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={role.color_class}>
                      {role.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              ))}
          </div>  
        </CtaCardContent>
      </CtaCard>
    </div>
  );
}