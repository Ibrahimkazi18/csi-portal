"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Award, Trophy } from "lucide-react"
import { calculateEarnedAchievements, getProgressAchievements, type Achievement } from "../lib/achievements"

interface AchievementsSectionProps {
  profileData: any
}

export function AchievementsSection({ profileData }: AchievementsSectionProps) {
  const earnedAchievements = calculateEarnedAchievements(profileData)
  const progressAchievements = getProgressAchievements(profileData)

  return (
    <Card className="bg-dark-surface border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Achievements
        </CardTitle>
        <CardDescription>Your accomplishments and progress milestones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Achievement Count */}
        <div className="text-center">
          <div className="text-4xl font-bold text-yellow-500 mb-2">{earnedAchievements.length}</div>
          <p className="text-sm text-muted-foreground">Achievements Earned</p>
        </div>

        {/* Earned Achievements */}
        {earnedAchievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Earned Achievements</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {earnedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} earned={true} />
              ))}
            </div>
          </div>
        )}

        {/* Progress Achievements */}
        {progressAchievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">In Progress</h4>
            <div className="space-y-2">
              {progressAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  earned={false}
                  profileData={profileData}
                />
              ))}
            </div>
          </div>
        )}

        {/* Achievement Categories */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Categories</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(getCategoryStats(earnedAchievements)).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between text-xs">
                <span className="capitalize">{category.replace("_", " ")}</span>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AchievementCard({
  achievement,
  earned,
  profileData,
}: {
  achievement: Achievement
  earned: boolean
  profileData?: any
}) {
  const Icon = achievement.icon
  const progress = achievement.progress && profileData ? achievement.progress(profileData) : null

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        earned ? `${achievement.bgColor} ${achievement.borderColor}` : "bg-muted/20 border-muted/40 opacity-75"
      }`}
    >
      <div className={`flex-shrink-0 ${earned ? achievement.color : "text-muted-foreground"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${earned ? "" : "text-muted-foreground"}`}>{achievement.name}</p>
        <p className="text-xs text-muted-foreground">{achievement.description}</p>
        {progress && !earned && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>
                {progress.current}/{progress.target}
              </span>
            </div>
            <Progress value={(progress.current / progress.target) * 100} className="h-1" />
          </div>
        )}
      </div>
      {earned && (
        <div className="flex-shrink-0">
          <Trophy className="h-4 w-4 text-yellow-500" />
        </div>
      )}
    </div>
  )
}

function getCategoryStats(achievements: Achievement[]) {
  const stats: Record<string, number> = {}
  achievements.forEach((achievement) => {
    stats[achievement.category] = (stats[achievement.category] || 0) + 1
  })
  return stats
}
