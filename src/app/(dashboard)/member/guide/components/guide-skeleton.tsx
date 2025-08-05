import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function GuideLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Introduction Card Skeleton */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-4 bg-muted rounded w-80 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* Guide Sections Skeleton */}
      <div className="space-y-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="bg-dark-surface border-border">
            <CardHeader className="cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
                  <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
                </div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {[...Array(4)].map((_, itemIndex) => (
                  <div key={itemIndex} className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-muted rounded-full mt-2 animate-pulse"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                      {itemIndex % 2 === 0 && <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Information Skeleton */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-40 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}