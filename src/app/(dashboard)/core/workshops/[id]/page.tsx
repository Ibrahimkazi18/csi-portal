"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Edit, Users, Calendar,
  Link as LinkIcon, CheckCircle, UserCheck, ArrowLeft
} from "lucide-react"
import { EditWorkshopModal } from "@/components/workshops/edit-workshop-modal"
import Link from "next/link"
import { toast } from "sonner"
import { completeWorkshop, getWorkshopDetails } from "./actions"
import { DeleteWorkshopButton } from "@/components/workshops/DeleteWorkshopButton"
import Preloader from "@/components/ui/preloader"

export default function WorkshopDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const workshopId = params.id as string

  const [showPreloader, setShowPreloader] = useState(true)
  const [loading, setLoading] = useState(true)
  const [workshop, setWorkshop] = useState<any>(null)
  const [completing, setCompleting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  const loadWorkshop = async () => {
    setLoading(true)
    const response = await getWorkshopDetails(workshopId)
    
    if (!response.success) {
      toast.error("Error", { description: response.error })
      router.push("/core/workshops")
      return
    }

    setWorkshop(response.data)
    setLoading(false)
  }

  useEffect(() => {
    loadWorkshop()
  }, [workshopId])

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

  const handleCompleteWorkshop = async () => {
    if (!confirm("Are you sure you want to complete this workshop? This action cannot be undone.")) {
      return
    }

    setCompleting(true)
    const response = await completeWorkshop(workshopId)
    
    if (response.success) {
      toast.success("Workshop completed successfully")
      loadWorkshop()
    } else {
      toast.error(response.error)
    }
    
    setCompleting(false)
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const {
    event,
    hosts,
    registrationCount,
    attendanceCount,
    recentRegistrations
  } = workshop

  const attendanceRate = registrationCount > 0
    ? Math.round((attendanceCount / registrationCount) * 100)
    : 0

  const spotsLeft = event.max_participants - registrationCount
  const isFull = spotsLeft <= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/core/workshops">
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
                event.status === "registration_open" ? "default" :
                "outline"
              }>
                {event.status}
              </Badge>
              {event.source === "manual" && (
                <Badge variant="outline">Manual Entry</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{event.description}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {event.status !== "completed" && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <DeleteWorkshopButton
                workshopId={workshopId}
                workshopTitle={event.title}
                onDeleted={() => router.push("/core/workshops")}
              />
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registrationCount} / {event.max_participants}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {attendanceRate}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(event.start_date).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(event.start_date).toLocaleTimeString()} - 
              {new Date(event.end_date).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {event.category || "General"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workshop Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Schedule & Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Registration Deadline</Label>
              <p className="font-medium">
                {new Date(event.registration_deadline).toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Workshop Date</Label>
              <p className="font-medium">
                {new Date(event.start_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Time</Label>
              <p className="font-medium">
                {new Date(event.start_date).toLocaleTimeString()} - 
                {new Date(event.end_date).toLocaleTimeString()}
              </p>
            </div>
            {event.meeting_link && (
              <div>
                <Label className="text-sm text-muted-foreground">Meeting Link</Label>
                <a
                  href={event.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <LinkIcon className="h-4 w-4" />
                  Join Workshop
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hosts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Hosts/Speakers ({hosts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hosts.map((host: any) => (
                <div key={host.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  {host.photo_url && (
                    <img
                      src={host.photo_url}
                      alt={host.name}
                      className="w-10 h-10 rounded-full object-cover"
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

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Workshop Management</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Link href={`/core/workshops/${workshopId}/registrations`}>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              View Registrations ({registrationCount})
            </Button>
          </Link>

          {registrationCount > 0 && (
            <Link href={`/core/workshops/${workshopId}/attendance`}>
              <Button variant="outline">
                <UserCheck className="h-4 w-4 mr-2" />
                Mark Attendance
              </Button>
            </Link>
          )}

          {event.status !== "completed" && new Date(event.start_date) < new Date() && (
            <Button onClick={handleCompleteWorkshop} disabled={completing}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {completing ? "Completing..." : "Complete Workshop"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Registrations */}
      {recentRegistrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRegistrations.map((reg: any) => (
                <div key={reg.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{reg.user?.full_name || "Unknown User"}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(reg.registered_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Workshop Modal */}
      {workshop && (
        <EditWorkshopModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          workshop={workshop.event}
          hosts={workshop.hosts}
          onSuccess={loadWorkshop}
        />
      )}
    </div>
  )
}