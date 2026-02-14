"use client"

import { Button } from "@/components/ui/button"
import { UserPlus, Clock, Trophy, AlertCircle, RefreshCcw, Disc } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getAllEvents } from "./actions"
import { MorphingCardStack, type LayoutMode } from "@/components/ui/morphing-card-stack"
import { EventCardModern } from "@/components/events/event-card-modern"
import { CtaCard, CtaCardHeader, CtaCardTitle, CtaCardDescription, CtaCardContent } from "@/components/ui/cta-card"
import Preloader from "@/components/ui/preloader"

export default function MemberEventsPage() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [eventsData, setEventsData] = useState<any>({
    registrationOpen: [],
    upcoming: [],
    completed: [],
    ongoing: [],
  })

  const handleAllEventsOnLoad = useCallback(async () => {
    setLoadingData(true)
    try {
      const response = await getAllEvents()
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch events")
      }
      console.log(response.data)
      setEventsData(response.data || { registrationOpen: [], upcoming: [], completed: [] })
    } catch (error: any) {
      console.error("Failed to fetch events:", error)
      toast.error("Error", {
        description: "Failed to load events. Please try again.",
      })
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    handleAllEventsOnLoad()
  }, [handleAllEventsOnLoad])

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false)
  }, [])

  if (showPreloader) {
    return (
      <div className="relative w-full h-screen">
        <Preloader onComplete={handlePreloaderComplete} />
      </div>
    )
  }

  // if(loadingData) {
  //   return <EventsPageSkeleton />
  // }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Discover and register for CSI events and competitions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleAllEventsOnLoad()}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Registration Open Events */}
      <CtaCard variant="accent">
        <CtaCardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-400" />
            <CtaCardTitle>Registration Open</CtaCardTitle>
          </div>
          <CtaCardDescription>Events currently accepting registrations</CtaCardDescription>
        </CtaCardHeader>
        <CtaCardContent>
          {eventsData.registrationOpen.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No events open for registration</h3>
              <p className="text-muted-foreground mb-4">Check back later for new events!</p>
              <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 max-w-md mx-auto">
                <p className="text-sm text-yellow-400">
                  <Trophy className="h-4 w-4 inline mr-1" />
                  To see tournament events, you need to be part of a tournament-registered team.
                </p>
              </div>
            </div>
          ) : (
            <MorphingCardStack 
              cards={eventsData.registrationOpen.map((event: any) => ({
                id: event.id,
                title: event.title,
                description: event.description,
                content: <EventCardModern event={event} showRegisterButton={true} />
              }))}
              defaultLayout="stack"
            />
          )}
        </CtaCardContent>
      </CtaCard>

      {/* Upcoming Events */}
      {eventsData.upcoming.length > 0 && (
        <CtaCard>
          <CtaCardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <CtaCardTitle>Upcoming Events</CtaCardTitle>
            </div>
            <CtaCardDescription>Events scheduled to start soon</CtaCardDescription>
          </CtaCardHeader>
          <CtaCardContent>
            <MorphingCardStack 
              cards={eventsData.upcoming.map((event: any) => ({
                id: event.id,
                title: event.title,
                description: event.description,
                content: <EventCardModern event={event} />
              }))}
              defaultLayout="grid"
            />
          </CtaCardContent>
        </CtaCard>
      )}

      {/* Live Events */}
      {eventsData.ongoing.length > 0 && (
        <CtaCard variant="accent">
          <CtaCardHeader>
            <div className="flex items-center gap-2">
              <Disc className="h-5 w-5 text-red-400 animate-pulse" />
              <CtaCardTitle>Live Events</CtaCardTitle>
            </div>
            <CtaCardDescription>Events happening right now</CtaCardDescription>
          </CtaCardHeader>
          <CtaCardContent>
            <MorphingCardStack 
              cards={eventsData.ongoing.map((event: any) => ({
                id: event.id,
                title: event.title,
                description: event.description,
                content: <EventCardModern event={event} />
              }))}
              defaultLayout="grid"
            />
          </CtaCardContent>
        </CtaCard>
      )}

      {/* Completed Events */}
      {eventsData.completed.length > 0 && (
        <CtaCard>
          <CtaCardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-gray-400" />
              <CtaCardTitle>Completed Events</CtaCardTitle>
            </div>
            <CtaCardDescription>Past events and their results</CtaCardDescription>
          </CtaCardHeader>
          <CtaCardContent>
            <MorphingCardStack 
              cards={eventsData.completed.map((event: any) => ({
                id: event.id,
                title: event.title,
                description: event.description,
                content: <EventCardModern event={event} />
              }))}
              defaultLayout="list"
            />
          </CtaCardContent>
        </CtaCard>
      )}
    </div>
  )
}
