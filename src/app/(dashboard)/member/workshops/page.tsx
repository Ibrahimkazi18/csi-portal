"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, GraduationCap, RefreshCcw, X } from "lucide-react"
import { getAvailableWorkshops, getMyWorkshops } from "./actions"
import { MorphingCardStack } from "@/components/ui/morphing-card-stack"
import { WorkshopCardModern } from "@/components/workshops/workshop-card-modern"
import { CtaCard, CtaCardHeader, CtaCardTitle, CtaCardDescription, CtaCardContent } from "@/components/ui/cta-card"
import Preloader from "@/components/ui/preloader"

export default function MemberWorkshopsPage() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [availableWorkshops, setAvailableWorkshops] = useState<any[]>([])
  const [myWorkshops, setMyWorkshops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const loadWorkshops = async () => {
    setLoading(true)
    
    const [available, mine] = await Promise.all([
      getAvailableWorkshops(),
      getMyWorkshops()
    ])

    if (available.success && available.data) {
      setAvailableWorkshops(available.data.workshops)
    }

    if (mine.success && mine.data) {
      setMyWorkshops(mine.data.workshops)
    }

    setLoading(false)
  }
  
  useEffect(() => {
    loadWorkshops()
  }, [])

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


  const filteredAvailable = availableWorkshops.filter(w =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredMine = myWorkshops.filter(w =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workshops & Seminars</h1>
          <p className="text-muted-foreground">
            Browse and register for upcoming educational workshops
          </p>
        </div>
        <Button variant="outline" onClick={loadWorkshops}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Modern Search Bar */}
      <CtaCard variant="accent">
        <CtaCardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search workshops by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredAvailable.length + filteredMine.length} workshop(s) matching "{searchQuery}"
            </p>
          )}
        </CtaCardContent>
      </CtaCard>

      {/* Tabs */}
      <Tabs defaultValue="available" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="available" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Available
            <Badge variant="secondary" className="ml-1">
              {availableWorkshops.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="my-workshops" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            My Workshops
            <Badge variant="secondary" className="ml-1">
              {myWorkshops.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <CtaCard>
            <CtaCardHeader>
              <CtaCardTitle>Available Workshops</CtaCardTitle>
              <CtaCardDescription>
                Register for upcoming workshops and seminars
              </CtaCardDescription>
            </CtaCardHeader>
            <CtaCardContent>
              {filteredAvailable.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No workshops match your search" : "No workshops available"}
                  </p>
                </div>
              ) : (
                <MorphingCardStack
                  cards={filteredAvailable.map((workshop: any) => ({
                    id: workshop.id,
                    title: workshop.title,
                    description: workshop.description,
                    content: (
                      <WorkshopCardModern
                        workshop={workshop}
                        onRegister={loadWorkshops}
                      />
                    )
                  }))}
                  defaultLayout="grid"
                />
              )}
            </CtaCardContent>
          </CtaCard>
        </TabsContent>

        <TabsContent value="my-workshops">
          <CtaCard variant="accent">
            <CtaCardHeader>
              <CtaCardTitle>My Workshops</CtaCardTitle>
              <CtaCardDescription>
                Workshops you've registered for
              </CtaCardDescription>
            </CtaCardHeader>
            <CtaCardContent>
              {filteredMine.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? "No registered workshops match your search" 
                      : "You haven't registered for any workshops yet"}
                  </p>
                </div>
              ) : (
                <MorphingCardStack
                  cards={filteredMine.map((workshop: any) => ({
                    id: workshop.id,
                    title: workshop.title,
                    description: workshop.description,
                    content: (
                      <WorkshopCardModern
                        workshop={workshop}
                        isRegistered={true}
                      />
                    )
                  }))}
                  defaultLayout="list"
                />
              )}
            </CtaCardContent>
          </CtaCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}