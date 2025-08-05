import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@radix-ui/react-separator";

export default function ProfileLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Section Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header Card Skeleton */}
          <Card className="bg-dark-surface border-border">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 bg-muted rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
                    <div className="h-6 bg-muted rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-56 animate-pulse"></div>
                  <div className="flex items-center gap-4">
                    <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview Skeleton */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
              </div>
              <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="text-center space-y-2">
                    <div className="h-8 bg-muted rounded w-12 mx-auto animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-20 mx-auto animate-pulse"></div>
                  </div>
                ))}
              </div>
              <Separator className="my-6" />
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-8 animate-pulse"></div>
                </div>
                <div className="h-2 bg-muted rounded w-full animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          {/* Events Participated Skeleton */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-36 animate-pulse"></div>
              </div>
              <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-6 bg-muted rounded w-20 animate-pulse"></div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Teams Skeleton */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-44 animate-pulse"></div>
              </div>
              <div className="h-4 bg-muted rounded w-40 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                  <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-28 animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-36 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-6 bg-muted rounded w-16 animate-pulse"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          {/* Achievements Skeleton */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-28 animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg">
                  <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-32 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Performance Skeleton */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                    <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Skeleton */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-28 animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded w-full animate-pulse"></div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}