"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { User, Mail, Calendar, Trophy, Users, Target, TrendingUp, Edit, Settings, Crown, Activity, Search } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getProfile } from "./actions"
import * as z from "zod"
import { EditBioModal } from "./components/edit-bio-modal"
import { UpdateAvatarModal } from "./components/update-avatar-modal"
import { AccountSettingsModal } from "./components/account-settings-modal"
import { AchievementsSection } from "./components/achievements-section"
import ProfileLoadingSkeleton from "./components/profile-skeleton"
import SearcgProfileModal from "./components/search-profile-modal"

interface ProfileData {
  id: string
  full_name: string
  email: string
  role: string
  member_role: string
  avatar_url?: string
  bio?: string
  created_at: string
  is_core_team: boolean
  events_participated_names?: string
  events_participated: number
  teams_joined_names?: string
  teams_joined: number
  events_won: number
  total_points_earned: number
  tournament_team_name?: string
  achievements_earned: number
}


export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [editBioOpen, setEditBioOpen] = useState(false)
  const [searchProfileOpen, setSearchProfileOpen] = useState(false)
  const [updateAvatarOpen, setUpdateAvatarOpen] = useState(false)
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false)

  const loadProfileData = useCallback(async () => {
    setLoading(true)
    try {
      const profileResponse = await getProfile()

      if (!profileResponse.success) {
        throw new Error(profileResponse.message)
      }

      if (profileResponse.profile) {
        setProfileData(profileResponse.profile)
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load profile data",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  if (loading) {
    return <ProfileLoadingSkeleton />
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
        <p className="text-muted-foreground">Unable to load your profile data.</p>
        <Button onClick={loadProfileData} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  const memberSince = new Date(profileData.created_at)
  const winRate =
    profileData.events_participated > 0
      ? Math.round((profileData.events_won / profileData.events_participated) * 100)
      : 0

  const eventsParticipated = profileData.events_participated_names
    ? profileData.events_participated_names.split(", ").filter((name) => name.trim())
    : []

  const teamsJoined = profileData.teams_joined_names
    ? profileData.teams_joined_names.split(", ").filter((name) => name.trim())
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-lavender">My Profile</h1>
          <p className="text-muted-foreground">Manage your CSI profile and track your progress</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setSearchProfileOpen(true)}
          >
            <Search className="h-4 w-4 mr-2" />
            Search Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header Card */}
          <Card className="bg-dark-surface border-border glow-purple">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileData.avatar_url || "/placeholder.svg"} alt={profileData.full_name} />
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                    {profileData.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{profileData.full_name}</h2>
                    {profileData.is_core_team && (
                      <Badge variant="secondary" className="gap-1 glow-purple">
                        <Crown className="h-3 w-3" />
                        Core Team
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4" />
                    {profileData.email}
                  </p>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="capitalize">
                      {profileData.member_role || "Member"}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Member since {memberSince.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            {profileData.bio && (
              <CardContent className="pt-0">
                <Separator className="mb-4" />
                <p className="text-sm leading-relaxed">{profileData.bio}</p>
              </CardContent>
            )}
          </Card>

          {/* Stats Overview */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Activity Overview
              </CardTitle>
              <CardDescription>Your participation and performance statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">{profileData.events_participated}</div>
                  <div className="text-sm text-muted-foreground">Events Joined</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-green-500">{profileData.events_won}</div>
                  <div className="text-sm text-muted-foreground">Events Won</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-blue-500">{profileData.teams_joined}</div>
                  <div className="text-sm text-muted-foreground">Teams Joined</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-yellow-500">{profileData.total_points_earned || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Points</div>
                </div>
              </div>

              {profileData.events_participated > 0 && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Win Rate</span>
                      <span className="text-sm text-muted-foreground">{winRate}%</span>
                    </div>
                    <Progress value={winRate} className="h-2" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Events Participated */}
          {eventsParticipated.length > 0 && (
            <Card className="bg-dark-surface border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" />
                  Events Participated
                </CardTitle>
                <CardDescription>Events you've joined and competed in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {eventsParticipated.map((event, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {event}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Teams */}
          {teamsJoined.length > 0 && (
            <Card className="bg-dark-surface border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Teams & Collaborations
                </CardTitle>
                <CardDescription>Teams you've been part of</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profileData.tournament_team_name && (
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <Trophy className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Tournament Team</p>
                        <p className="text-sm text-muted-foreground">{profileData.tournament_team_name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {teamsJoined.map((team, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AchievementsSection profileData={profileData} isMy={true} />

          {/* Performance Insights */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Participation Level</span>
                  <Badge variant={profileData.events_participated >= 5 ? "default" : "secondary"}>
                    {profileData.events_participated >= 5
                      ? "High"
                      : profileData.events_participated >= 2
                        ? "Medium"
                        : "Low"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Success Rate</span>
                  <Badge variant={winRate >= 50 ? "default" : "secondary"}>
                    {winRate >= 50 ? "Excellent" : winRate >= 25 ? "Good" : "Growing"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Team Player</span>
                  <Badge variant={profileData.teams_joined >= 3 ? "default" : "secondary"}>
                    {profileData.teams_joined >= 3 ? "Yes" : "Developing"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent"
                onClick={() => setEditBioOpen(true)}
              >
                <Edit className="h-4 w-4" />
                Edit Bio
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent"
                onClick={() => setUpdateAvatarOpen(true)}
              >
                <User className="h-4 w-4" />
                Update Avatar
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent"
                onClick={() => setAccountSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Account Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Modals */}
      <EditBioModal
        open={editBioOpen}
        onOpenChange={setEditBioOpen}
        currentBio={profileData?.bio || ""}
        onSuccess={loadProfileData}
      />

      <UpdateAvatarModal
        open={updateAvatarOpen}
        onOpenChange={setUpdateAvatarOpen}
        currentAvatar={profileData?.avatar_url}
        onSuccess={loadProfileData}
      />

      <AccountSettingsModal
        open={accountSettingsOpen}
        onOpenChange={setAccountSettingsOpen}
      />

      <SearcgProfileModal 
        open={searchProfileOpen}
        onOpenChange={setSearchProfileOpen}
      />

    </div>
  )
}
