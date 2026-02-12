"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { User, Mail, Calendar, Trophy, Users, Target, TrendingUp, Edit, Settings, Crown, Activity, Search, Award, Zap, Star } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getProfile } from "./actions"
import { EditBioModal } from "./components/edit-bio-modal"
import { UpdateAvatarModal } from "./components/update-avatar-modal"
import { AccountSettingsModal } from "./components/account-settings-modal"
import { AchievementsSection } from "./components/achievements-section"
import ProfileLoadingSkeleton from "./components/profile-skeleton"
import SearcgProfileModal from "./components/search-profile-modal"
import { motion } from "framer-motion"
import { CtaCard, CtaCardHeader, CtaCardTitle, CtaCardDescription, CtaCardContent } from "@/components/ui/cta-card"
import { StatCard } from "@/components/profile/stat-card"
import { ProfileFolder } from "@/components/profile/profile-folder"

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your CSI profile and track your progress</p>
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

      {/* Profile Header Card */}
      <CtaCard variant="accent" className="overflow-hidden">
        <CtaCardContent className="p-8">
          <div className="flex items-start gap-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={profileData.avatar_url || "/placeholder.svg"} alt={profileData.full_name} />
                <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                  {profileData.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl font-bold">{profileData.full_name}</h2>
                {profileData.is_core_team && (
                  <Badge variant="default" className="gap-1">
                    <Crown className="h-3 w-3" />
                    Core Team
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-2 mb-4">
                <p className="text-muted-foreground flex items-center gap-2">
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
              {profileData.bio && (
                <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">{profileData.bio}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditBioOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAccountSettingsOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CtaCardContent>
      </CtaCard>

      {/* Stats Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Activity Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Events Participated"
            value={profileData.events_participated}
            description="Total events joined"
            icon={Target}
            index={0}
            gradient="linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))"
          />
          <StatCard
            title="Events Won"
            value={profileData.events_won}
            description={`${winRate}% win rate`}
            icon={Trophy}
            index={1}
            gradient="linear-gradient(135deg, #10b981 / 0.15, #10b981 / 0.05)"
          />
          <StatCard
            title="Teams Joined"
            value={profileData.teams_joined}
            description="Collaborative projects"
            icon={Users}
            index={2}
            gradient="linear-gradient(135deg, #3b82f6 / 0.15, #3b82f6 / 0.05)"
          />
          <StatCard
            title="Total Points"
            value={profileData.total_points_earned || 0}
            description="Points earned"
            icon={Zap}
            index={3}
            gradient="linear-gradient(135deg, #f59e0b / 0.15, #f59e0b / 0.05)"
          />
        </div>
      </div>

      {/* Performance Section */}
      {profileData.events_participated > 0 && (
        <CtaCard>
          <CtaCardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <CtaCardTitle>Performance Insights</CtaCardTitle>
            </div>
            <CtaCardDescription>Your competitive performance metrics</CtaCardDescription>
          </CtaCardHeader>
          <CtaCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Win Rate</span>
                  <span className="text-sm text-muted-foreground">{winRate}%</span>
                </div>
                <Progress value={winRate} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {winRate >= 50 ? "Excellent performance!" : winRate >= 25 ? "Good progress!" : "Keep competing!"}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Participation Level</span>
                  <Badge variant={profileData.events_participated >= 5 ? "default" : "secondary"}>
                    {profileData.events_participated >= 5 ? "High" : profileData.events_participated >= 2 ? "Medium" : "Low"}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((profileData.events_participated / 10) * 100, 100)} 
                  className="h-2" 
                />
                <p className="text-xs text-muted-foreground">
                  {profileData.events_participated} of 10+ events goal
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Team Collaboration</span>
                  <Badge variant={profileData.teams_joined >= 3 ? "default" : "secondary"}>
                    {profileData.teams_joined >= 3 ? "Active" : "Growing"}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((profileData.teams_joined / 5) * 100, 100)} 
                  className="h-2" 
                />
                <p className="text-xs text-muted-foreground">
                  {profileData.teams_joined} teams joined
                </p>
              </div>
            </div>
          </CtaCardContent>
        </CtaCard>
      )}

      {/* Compact Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Achievements Folder */}
        <ProfileFolder
          title="Achievements"
          icon={Award}
          count={profileData.achievements_earned}
          gradient="linear-gradient(135deg, #f59e0b / 0.15, #f59e0b / 0.05)"
        >
          <AchievementsSection profileData={profileData} isMy={true} />
        </ProfileFolder>

        {/* Events Participated Folder */}
        {eventsParticipated.length > 0 && (
          <ProfileFolder
            title="Events Participated"
            icon={Target}
            count={eventsParticipated.length}
            gradient="linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))"
          >
            <div className="flex flex-wrap gap-2">
              {eventsParticipated.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge variant="secondary" className="text-sm">
                    {event}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </ProfileFolder>
        )}

        {/* Teams & Collaborations Folder */}
        {teamsJoined.length > 0 && (
          <ProfileFolder
            title="Teams & Collaborations"
            icon={Users}
            count={teamsJoined.length}
            gradient="linear-gradient(135deg, #3b82f6 / 0.15, #3b82f6 / 0.05)"
          >
            <div className="space-y-4">
              {profileData.tournament_team_name && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/30"
                >
                  <Trophy className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold">Tournament Team</p>
                    <p className="text-sm text-muted-foreground">{profileData.tournament_team_name}</p>
                  </div>
                </motion.div>
              )}
              <div className="flex flex-wrap gap-2">
                {teamsJoined.map((team, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Badge variant="outline" className="text-sm">
                      {team}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          </ProfileFolder>
        )}

        {/* Quick Actions Folder */}
        <ProfileFolder
          title="Quick Actions"
          icon={Zap}
          gradient="linear-gradient(135deg, #10b981 / 0.15, #10b981 / 0.05)"
        >
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setEditBioOpen(true)}
            >
              <Edit className="h-4 w-4" />
              Edit Bio
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setUpdateAvatarOpen(true)}
            >
              <User className="h-4 w-4" />
              Update Avatar
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setAccountSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Account Settings
            </Button>
          </div>
        </ProfileFolder>
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
