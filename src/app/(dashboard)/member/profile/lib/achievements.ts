import {
  Trophy,
  Star,
  Zap,
  Target,
  Crown,
  Award,
  Users,
  TrendingUp,
  Flame,
  Shield,
  Rocket,
  Medal,
  Gem,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

export interface Achievement {
  id: string
  name: string
  description: string
  icon: LucideIcon
  color: string
  bgColor: string
  borderColor: string
  requirement: (data: any) => boolean
  progress?: (data: any) => { current: number; target: number }
  category: "participation" | "wins" | "ranking" | "team" | "special" | "points"
}

export const ACHIEVEMENTS: Achievement[] = [
  // Participation Achievements
  {
    id: "first_steps",
    name: "First Steps",
    description: "Participated in your first event",
    icon: Target,
    color: "text-blue-500",
    bgColor: "bg-blue-500/5",
    borderColor: "border-blue-500/20",
    category: "participation",
    requirement: (data) => data.events_participated >= 1,
  },
  {
    id: "getting_started",
    name: "Getting Started",
    description: "Participated in 5 events",
    icon: Zap,
    color: "text-green-500",
    bgColor: "bg-green-500/5",
    borderColor: "border-green-500/20",
    category: "participation",
    requirement: (data) => data.events_participated >= 5,
    progress: (data) => ({ current: data.events_participated, target: 5 }),
  },
  {
    id: "event_explorer",
    name: "Event Explorer",
    description: "Participated in 10 events",
    icon: Rocket,
    color: "text-purple-500",
    bgColor: "bg-purple-500/5",
    borderColor: "border-purple-500/20",
    category: "participation",
    requirement: (data) => data.events_participated >= 10,
    progress: (data) => ({ current: data.events_participated, target: 10 }),
  },
  {
    id: "veteran_participant",
    name: "Veteran Participant",
    description: "Participated in 20 events",
    icon: Shield,
    color: "text-orange-500",
    bgColor: "bg-orange-500/5",
    borderColor: "border-orange-500/20",
    category: "participation",
    requirement: (data) => data.events_participated >= 20,
    progress: (data) => ({ current: data.events_participated, target: 20 }),
  },

  // Win Achievements
  {
    id: "first_victory",
    name: "First Victory",
    description: "Won your first event",
    icon: Trophy,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/5",
    borderColor: "border-yellow-500/20",
    category: "wins",
    requirement: (data) => data.events_won >= 1,
  },
  {
    id: "rising_champion",
    name: "Rising Champion",
    description: "Won 3 events",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-600/5",
    borderColor: "border-yellow-600/20",
    category: "wins",
    requirement: (data) => data.events_won >= 3,
    progress: (data) => ({ current: data.events_won, target: 3 }),
  },
  {
    id: "skilled_competitor",
    name: "Skilled Competitor",
    description: "Won 5 events",
    icon: Medal,
    color: "text-amber-500",
    bgColor: "bg-amber-500/5",
    borderColor: "border-amber-500/20",
    category: "wins",
    requirement: (data) => data.events_won >= 5,
    progress: (data) => ({ current: data.events_won, target: 5 }),
  },
  {
    id: "elite_winner",
    name: "Elite Winner",
    description: "Won 10 events",
    icon: Crown,
    color: "text-purple-600",
    bgColor: "bg-purple-600/5",
    borderColor: "border-purple-600/20",
    category: "wins",
    requirement: (data) => data.events_won >= 10,
    progress: (data) => ({ current: data.events_won, target: 10 }),
  },
  {
    id: "legendary_champion",
    name: "Legendary Champion",
    description: "Won 15 events",
    icon: Gem,
    color: "text-pink-500",
    bgColor: "bg-pink-500/5",
    borderColor: "border-pink-500/20",
    category: "wins",
    requirement: (data) => data.events_won >= 15,
    progress: (data) => ({ current: data.events_won, target: 15 }),
  },
  {
    id: "ultimate_master",
    name: "Ultimate Master",
    description: "Won 25 events",
    icon: Sparkles,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/5",
    borderColor: "border-indigo-500/20",
    category: "wins",
    requirement: (data) => data.events_won >= 25,
    progress: (data) => ({ current: data.events_won, target: 25 }),
  },

  // Ranking Achievements (includes wins + runner-ups + second runner-ups)
  {
    id: "consistent_performer",
    name: "Consistent Performer",
    description: "Ranked in top 3 of 5 events",
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-600/5",
    borderColor: "border-green-600/20",
    category: "ranking",
    requirement: (data) => {
      const totalRanked = (data.events_won || 0) + (data.events_runner_ups || 0) + (data.events_second_runner_ups || 0)
      return totalRanked >= 5
    },
    progress: (data) => {
      const totalRanked = (data.events_won || 0) + (data.events_runner_ups || 0) + (data.events_second_runner_ups || 0)
      return { current: totalRanked, target: 5 }
    },
  },
  {
    id: "podium_regular",
    name: "Podium Regular",
    description: "Ranked in top 3 of 10 events",
    icon: Award,
    color: "text-blue-600",
    bgColor: "bg-blue-600/5",
    borderColor: "border-blue-600/20",
    category: "ranking",
    requirement: (data) => {
      const totalRanked = (data.events_won || 0) + (data.events_runner_ups || 0) + (data.events_second_runner_ups || 0)
      return totalRanked >= 10
    },
    progress: (data) => {
      const totalRanked = (data.events_won || 0) + (data.events_runner_ups || 0) + (data.events_second_runner_ups || 0)
      return { current: totalRanked, target: 10 }
    },
  },
  {
    id: "ranking_specialist",
    name: "Ranking Specialist",
    description: "Ranked in top 3 of 15 events",
    icon: Medal,
    color: "text-purple-700",
    bgColor: "bg-purple-700/5",
    borderColor: "border-purple-700/20",
    category: "ranking",
    requirement: (data) => {
      const totalRanked = (data.events_won || 0) + (data.events_runner_ups || 0) + (data.events_second_runner_ups || 0)
      return totalRanked >= 15
    },
    progress: (data) => {
      const totalRanked = (data.events_won || 0) + (data.events_runner_ups || 0) + (data.events_second_runner_ups || 0)
      return { current: totalRanked, target: 15 }
    },
  },
  {
    id: "podium_master",
    name: "Podium Master",
    description: "Ranked in top 3 of 20 events",
    icon: Crown,
    color: "text-red-500",
    bgColor: "bg-red-500/5",
    borderColor: "border-red-500/20",
    category: "ranking",
    requirement: (data) => {
      const totalRanked = (data.events_won || 0) + (data.events_runner_ups || 0) + (data.events_second_runner_ups || 0)
      return totalRanked >= 20
    },
    progress: (data) => {
      const totalRanked = (data.events_won || 0) + (data.events_runner_ups || 0) + (data.events_second_runner_ups || 0)
      return { current: totalRanked, target: 20 }
    },
  },

  // Team Achievements
  {
    id: "team_player",
    name: "Team Player",
    description: "Joined 3 different teams",
    icon: Users,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/5",
    borderColor: "border-cyan-500/20",
    category: "team",
    requirement: (data) => data.teams_joined >= 3,
    progress: (data) => ({ current: data.teams_joined, target: 3 }),
  },
  {
    id: "collaboration_expert",
    name: "Collaboration Expert",
    description: "Joined 5 different teams",
    icon: Users,
    color: "text-teal-500",
    bgColor: "bg-teal-500/5",
    borderColor: "border-teal-500/20",
    category: "team",
    requirement: (data) => data.teams_joined >= 5,
    progress: (data) => ({ current: data.teams_joined, target: 5 }),
  },

  // Points Achievements
  {
    id: "point_collector",
    name: "Point Collector",
    description: "Earned 100 total points",
    icon: Star,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/5",
    borderColor: "border-yellow-400/20",
    category: "points",
    requirement: (data) => (data.total_points_earned || 0) >= 100,
    progress: (data) => ({ current: data.total_points_earned || 0, target: 100 }),
  },
  {
    id: "point_master",
    name: "Point Master",
    description: "Earned 500 total points",
    icon: Gem,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/5",
    borderColor: "border-emerald-500/20",
    category: "points",
    requirement: (data) => (data.total_points_earned || 0) >= 500,
    progress: (data) => ({ current: data.total_points_earned || 0, target: 500 }),
  },
  {
    id: "point_legend",
    name: "Point Legend",
    description: "Earned 1000 total points",
    icon: Sparkles,
    color: "text-violet-500",
    bgColor: "bg-violet-500/5",
    borderColor: "border-violet-500/20",
    category: "points",
    requirement: (data) => (data.total_points_earned || 0) >= 1000,
    progress: (data) => ({ current: data.total_points_earned || 0, target: 1000 }),
  },

  // Special Achievements
  {
    id: "core_team_member",
    name: "Core Team Member",
    description: "Part of the CSI core team",
    icon: Crown,
    color: "text-purple-500",
    bgColor: "bg-purple-500/5",
    borderColor: "border-purple-500/20",
    category: "special",
    requirement: (data) => data.is_core_team === true,
  },
  {
    id: "perfect_score",
    name: "Perfect Score",
    description: "100% win rate with 5+ events",
    icon: Flame,
    color: "text-red-400",
    bgColor: "bg-red-400/5",
    borderColor: "border-red-400/20",
    category: "special",
    requirement: (data) => {
      if (data.events_participated < 5) return false
      return data.events_won === data.events_participated
    },
  },
  {
    id: "early_adopter",
    name: "Early Adopter",
    description: "One of the first 100 members",
    icon: Rocket,
    color: "text-blue-400",
    bgColor: "bg-blue-400/5",
    borderColor: "border-blue-400/20",
    category: "special",
    requirement: (data) => {
      // This would need to be calculated based on member join order
      // For now, we'll use a simple date check
      const joinDate = new Date(data.created_at)
      const cutoffDate = new Date("2024-02-01") // Adjust based on your needs
      return joinDate <= cutoffDate
    },
  },
]

export function calculateEarnedAchievements(profileData: any): Achievement[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.requirement(profileData))
}

export function getProgressAchievements(profileData: any): Achievement[] {
  return ACHIEVEMENTS.filter((achievement) => {
    if (!achievement.progress) return false
    const progress = achievement.progress(profileData)
    return progress.current < progress.target && progress.current > 0
  }).slice(0, 3) // Show top 3 closest achievements
}
