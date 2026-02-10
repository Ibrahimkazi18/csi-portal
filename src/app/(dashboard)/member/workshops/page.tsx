"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Calendar, Users, CheckCircle } from "lucide-react"
import { getAvailableWorkshops, getMyWorkshops, registerForWorkshop } from "./actions"
import { toast } from "sonner"

export default function MemberWorkshopsPage() {
  const [availableWorkshops, setAvailableWorkshops] = useState<any[]>([])
  const [myWorkshops, setMyWorkshops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadWorkshops()
  }, [])

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

  const filteredAvailable = availableWorkshops.filter(w =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredMine = myWorkshops.filter(w =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-8">Loading workshops...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workshops & Seminars</h1>
        <p className="text-muted-foreground">
          Browse and register for upcoming workshops
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workshops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available">
            Available Workshops ({availableWorkshops.length})
          </TabsTrigger>
          <TabsTrigger value="my-workshops">
            My Workshops ({myWorkshops.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAvailable.map(workshop => (
              <WorkshopCard
                key={workshop.id}
                workshop={workshop}
                onRegister={loadWorkshops}
              />
            ))}
          </div>

          {filteredAvailable.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No workshops available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-workshops" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMine.map(workshop => (
              <MyWorkshopCard key={workshop.id} workshop={workshop} />
            ))}
          </div>

          {filteredMine.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                You haven't registered for any workshops yet
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function WorkshopCard({ workshop, onRegister }: any) {
  const [registering, setRegistering] = useState(false)

  const spotsLeft = workshop.max_participants - (workshop.registration_count || 0)
  const isFull = spotsLeft <= 0
  const isPastDeadline = new Date(workshop.registration_deadline) < new Date()
  const canRegister = !isFull && !isPastDeadline && !workshop.is_registered

  const handleRegister = async () => {
    setRegistering(true)
    const response = await registerForWorkshop(workshop.id)
    
    if (response.success) {
      toast.success("Registration successful!")
      onRegister()
    } else {
      toast.error(response.error)
    }
    
    setRegistering(false)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      {workshop.banner_url && (
        <img
          src={workshop.banner_url}
          alt={workshop.title}
          className="w-full h-40 object-cover rounded-t-lg"
        />
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{workshop.title}</CardTitle>
          {workshop.is_registered && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Registered
            </Badge>
          )}
          {isFull && !workshop.is_registered && (
            <Badge variant="destructive">Full</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {workshop.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(workshop.start_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {workshop.registration_count || 0} / {workshop.max_participants} registered
            </span>
          </div>
          {spotsLeft > 0 && spotsLeft <= 10 && !workshop.is_registered && (
            <p className="text-orange-500 text-xs">
              Only {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left!
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Link href={`/member/workshops/${workshop.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          {canRegister && (
            <Button
              onClick={handleRegister}
              disabled={registering}
              className="flex-1"
            >
              {registering ? "Registering..." : "Register"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MyWorkshopCard({ workshop }: any) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{workshop.title}</CardTitle>
          <div className="flex flex-col gap-2">
            <Badge variant={
              workshop.status === "completed" ? "secondary" : "default"
            }>
              {workshop.status}
            </Badge>
            {workshop.attended && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Attended
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(workshop.start_date).toLocaleDateString()}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Registered on</p>
            <p className="text-sm">{new Date(workshop.registered_at).toLocaleDateString()}</p>
          </div>
        </div>

        <Link href={`/member/workshops/${workshop.id}`}>
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}