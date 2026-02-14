"use client"

import { Suspense, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SimpleManualEventForm } from "@/components/manual-events/simple-manual-event-form"
import { Shield, Plus } from "lucide-react"
import { ManualEventsList } from "@/components/manual-events/manual-events-list"
import Preloader from "@/components/ui/preloader"

export default function ManualEventsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleFormComplete = () => {
    // Refresh the events list
    setRefreshKey(prev => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="relative w-full h-screen">
        <Preloader onComplete={() => setIsLoading(false)} />
      </div>
    )
  }

  return (
    <>
      {!isLoading && (
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Manual Event Entry
              </h1>
            </div>
            <p className="text-muted-foreground">
              Add historical events with participants and results using our simplified form.
            </p>
          </div>

          {/* Create New Manual Event */}
          <Card className="border-border/40">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Manual Event
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Add events that happened offline with participants and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleManualEventForm onComplete={handleFormComplete} />
            </CardContent>
          </Card>

          {/* Existing Manual Events */}
          <Card className="border-border/40">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Manual Events History</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Previously created manual events and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="text-sm text-muted-foreground">Loading manual events...</div>}>
                <ManualEventsList key={refreshKey} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}