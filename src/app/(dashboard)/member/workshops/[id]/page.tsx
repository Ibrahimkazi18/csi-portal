"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Calendar, Users,
  Link as LinkIcon, CheckCircle, ArrowLeft
} from "lucide-react"
import { toast } from "sonner"
import { getWorkshopDetails, registerForWorkshop, cancelRegistration } from "./actions"
import Link from "next/link"
import Preloader from "@/components/ui/preloader"

export default function MemberWorkshopDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const workshopId = params.id as string

  const [showPreloader, setShowPreloader] = useState(true)
  const [loading, setLoading] = useState(true)
  const [workshop, setWorkshop] = useState<any>(null)
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    loadWorkshop()
  }, [workshopId])

  const loadWorkshop = async () => {
    setLoading(true)
    const response = await getWorkshopDetails(workshopId)
    
    if (!response.success) {
      toast.error(response.error)
      router.push("/member/workshops")
      return
    }

    setWorkshop(response.data)
    setLoading(false)
  }

  const handleRegister = async () => {
    setRegistering(true)
    const response = await registerForWorkshop(workshopId)
    
    if (response.success) {
      toast.success("Registration successful!")
      loadWorkshop()
    } else {
      toast.error(response.error)
    }
    
    setRegistering(false)
  }

  const handleCancelRegistration = async () => {
    if (!confirm("Are you sure you want to cancel your registration?")) return

    const response = await cancelRegistration(workshopId)
    
    if (response.success) {
      toast.success("Registration cancelled")
      loadWorkshop()
    } else {
      toast.error(response.error)
    }
  }

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
  
  const {
    event,
    hosts,
    isRegistered,
    registrationCount,
    canRegister,
    canCancelRegistration
  } = workshop

  const spotsLeft = event.max_participants - registrationCount
  const isFull = spotsLeft <= 0

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/member/workshops">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workshops
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <Badge variant={
                event.status === "completed" ? "secondary" :
                event.status === "ongoing" ? "default" :
                "outline"
              }>
                {event.status}
              </Badge>
              {isRegistered && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Registered
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{event.description}</p>
          </div>
        </div>
      </div>

      {/* Registration Action */}
      {!isRegistered && canRegister && (
        <Card className="border-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Register for this workshop</h3>
                <p className="text-sm text-muted-foreground">
                  {spotsLeft} / {event.max_participants} spots available
                </p>
              </div>
              <Button onClick={handleRegister} disabled={registering || isFull}>
                {registering ? "Registering..." : isFull ? "Full" : "Register Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isRegistered && canCancelRegistration && (
        <Card className="border-orange-500/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">You're registered!</h3>
                <p className="text-sm text-muted-foreground">
                  You can cancel your registration before the deadline
                </p>
              </div>
              <Button variant="destructive" onClick={handleCancelRegistration}>
                Cancel Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workshop Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Workshop Date</Label>
              <p className="font-medium">
                {new Date(event.start_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Time</Label>
              <p className="font-medium">
                {new Date(event.start_date).toLocaleTimeString()} - 
                {new Date(event.end_date).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Registration Deadline</Label>
              <p className="font-medium">
                {new Date(event.registration_deadline).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Participation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Capacity</Label>
              <p className="font-medium">{event.max_participants} participants</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Registered</Label>
              <p className="font-medium">
                {registrationCount} / {event.max_participants}
                {spotsLeft > 0 && spotsLeft <= 10 && (
                  <span className="text-orange-500 text-sm ml-2">
                    (Only {spotsLeft} left!)
                  </span>
                )}
              </p>
            </div>
            {event.category && (
              <div>
                <Label className="text-sm text-muted-foreground">Category</Label>
                <Badge variant="outline">{event.category}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meeting Link (for registered users only) */}
      {isRegistered && event.meeting_link && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Virtual Meeting Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={event.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <LinkIcon className="h-4 w-4" />
              {event.meeting_link}
            </a>
            <p className="text-sm text-muted-foreground mt-2">
              Click to join the workshop when it starts
            </p>
          </CardContent>
        </Card>
      )}

      {/* Hosts/Speakers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Hosts & Speakers ({hosts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hosts.map((host: any) => (
              <div key={host.id} className="flex items-start gap-3 p-3 rounded-lg border">
                {host.photo_url && (
                  <img
                    src={host.photo_url}
                    alt={host.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{host.name}</p>
                  {host.designation && (
                    <p className="text-sm text-muted-foreground">{host.designation}</p>
                  )}
                  {host.bio && (
                    <p className="text-xs text-muted-foreground mt-1">{host.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}