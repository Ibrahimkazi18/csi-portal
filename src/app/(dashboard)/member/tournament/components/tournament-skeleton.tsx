import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function TournamentListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-40 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
        </div>
      </div>

      {/* Team Invitations Skeleton */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-6 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-muted/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-40 animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-6 bg-muted rounded w-20 animate-pulse"></div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
                    <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Applications Skeleton */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-56 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-muted/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 bg-muted rounded w-28 animate-pulse"></div>
                      <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-muted rounded w-44 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-36 animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
                </div>
                <div className="flex gap-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-6 bg-muted rounded w-16 animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tournaments Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-dark-surface border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-12 animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="h-8 bg-muted rounded w-24 animate-pulse"></div>
                  <div className="h-8 bg-muted rounded w-28 animate-pulse"></div>
                </div>
                <div className="h-8 bg-muted rounded w-24 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function TournamentDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-4 bg-muted rounded w-80 animate-pulse"></div>
        </div>
        <div className="h-10 bg-muted rounded w-28 animate-pulse"></div>
      </div>

      {/* Tournament Info Skeleton */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-44 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                </div>
                <div className="h-5 bg-muted rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User's Team Skeleton */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border border-border bg-muted/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 bg-muted rounded w-32 animate-pulse"></div>
              <div className="h-6 bg-muted rounded w-12 animate-pulse"></div>
            </div>
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-6 bg-muted rounded w-20 animate-pulse"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams Looking for Members Skeleton */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-muted/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-36 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-44 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-52 animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-6 bg-muted rounded w-20 animate-pulse"></div>
                    ))}
                  </div>
                  <div className="h-8 bg-muted rounded w-24 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Skeleton */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-44 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                    <div className="space-y-1">
                      <div className="h-5 bg-muted rounded w-32 animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-8 bg-muted rounded w-12 animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-10 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Registered Teams Skeleton */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-40 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-muted/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-5 bg-muted rounded w-36 animate-pulse"></div>
                  <div className="h-6 bg-muted rounded w-12 animate-pulse"></div>
                </div>
                <div className="h-4 bg-muted rounded w-44 mb-2 animate-pulse"></div>
                <div className="flex gap-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-6 bg-muted rounded w-20 animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TournamentLeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-8 bg-muted rounded w-36 animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 bg-muted rounded w-56 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
        </div>
      </div>

      {/* Top 3 Podium Skeleton */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 2nd Place */}
            <div className="order-1 md:order-1">
              <Card className="bg-muted/10 border-muted/30">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="h-12 w-12 bg-muted rounded mx-auto animate-pulse"></div>
                  <div className="h-6 bg-muted rounded w-32 mx-auto animate-pulse"></div>
                  <div className="h-8 bg-muted rounded w-16 mx-auto animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-40 mx-auto animate-pulse"></div>
                  <div className="h-6 bg-muted rounded w-20 mx-auto animate-pulse"></div>
                </CardContent>
              </Card>
            </div>
            {/* 1st Place */}
            <div className="order-2 md:order-2">
              <Card className="bg-muted/10 border-muted/30 transform md:scale-110">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="h-16 w-16 bg-muted rounded mx-auto animate-pulse"></div>
                  <div className="h-7 bg-muted rounded w-36 mx-auto animate-pulse"></div>
                  <div className="h-10 bg-muted rounded w-20 mx-auto animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-44 mx-auto animate-pulse"></div>
                  <div className="h-6 bg-muted rounded w-24 mx-auto animate-pulse"></div>
                </CardContent>
              </Card>
            </div>
            {/* 3rd Place */}
            <div className="order-3 md:order-3">
              <Card className="bg-muted/10 border-muted/30">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="h-12 w-12 bg-muted rounded mx-auto animate-pulse"></div>
                  <div className="h-6 bg-muted rounded w-32 mx-auto animate-pulse"></div>
                  <div className="h-8 bg-muted rounded w-16 mx-auto animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-40 mx-auto animate-pulse"></div>
                  <div className="h-6 bg-muted rounded w-20 mx-auto animate-pulse"></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Leaderboard Skeleton */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
                    <div className="h-6 w-6 bg-muted rounded animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-5 bg-muted rounded w-36 animate-pulse"></div>
                      <div className="flex items-center gap-4">
                        <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-8 animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-8 animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-8 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-12 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-dark-surface border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                  <div className="h-6 bg-muted rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
