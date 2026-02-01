import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, MapPin, Users, ExternalLink, UserCheck } from "lucide-react"
import { createClient } from "../../../utils/supabase/server"
import Link from "next/link"

async function getWorkshops() {
  const supabase = await createClient()
  
  try {
    const { data: workshops, error } = await supabase
      .from('events')
      .select(`
        *,
        event_participants(count),
        workshop_hosts(*)
      `)
      .eq('mode', 'workshop')
      .eq('status', 'active')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Get workshops error:', error)
      return { success: false, error: 'Failed to fetch workshops' }
    }

    return { success: true, workshops }
  } catch (error) {
    console.error('Get workshops error:', error)
    return { success: false, error: 'Failed to fetch workshops' }
  }
}

async function getUserRegistrations() {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, registrations: [] }

    const { data: registrations, error } = await supabase
      .from('event_participants')
      .select('event_id')
      .eq('user_id', user.id)

    if (error) {
      console.error('Get registrations error:', error)
      return { success: false, registrations: [] }
    }

    return { success: true, registrations: registrations.map(r => r.event_id) }
  } catch (error) {
    console.error('Get registrations error:', error)
    return { success: false, registrations: [] }
  }
}

export async function WorkshopsList() {
  const [workshopsResult, registrationsResult] = await Promise.all([
    getWorkshops(),
    getUserRegistrations()
  ])

  if (!workshopsResult.success) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">{workshopsResult.error}</p>
      </div>
    )
  }

  const workshops = workshopsResult.workshops || []
  const userRegistrations = registrationsResult.registrations || []

  if (workshops.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
          <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-2">No Workshops Available</h3>
        <p className="text-sm text-muted-foreground">
          Check back later for upcoming workshops and seminars
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {workshops.map((workshop: any) => {
        const participantCount = workshop.event_participants?.[0]?.count || 0
        const isRegistered = userRegistrations.includes(workshop.id)
        const isFull = participantCount >= workshop.max_participants
        const registrationDeadlinePassed = workshop.registration_deadline 
          ? new Date(workshop.registration_deadline) < new Date()
          : false

        return (
          <Card key={workshop.id} className="border-border/40">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-semibold">{workshop.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">Workshop</Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {workshop.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {isRegistered && (
                    <Badge variant="default" className="text-xs">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Registered
                    </Badge>
                  )}
                  {isFull && !isRegistered && (
                    <Badge variant="destructive" className="text-xs">
                      Seats Full
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Workshop Details */}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(workshop.start_date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(workshop.start_date).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    {workshop.duration && ` (${workshop.duration}m)`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{participantCount}/{workshop.max_participants} seats</span>
                </div>

                {workshop.venue && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{workshop.venue}</span>
                  </div>
                )}
              </div>

              {/* Workshop Hosts */}
              {workshop.workshop_hosts && workshop.workshop_hosts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Hosts:</p>
                  <div className="flex flex-wrap gap-2">
                    {workshop.workshop_hosts.map((host: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{host.name}</span>
                        {host.designation && (
                          <Badge variant="outline" className="text-xs">
                            {host.designation}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registration Deadline */}
              {workshop.registration_deadline && (
                <div className="text-sm text-muted-foreground">
                  Registration deadline: {new Date(workshop.registration_deadline).toLocaleString()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{workshop.category}</Badge>
                  {workshop.meeting_link && (
                    <Badge variant="secondary" className="text-xs">Online</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/member/workshops/${workshop.id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                  
                  {!isRegistered && !isFull && !registrationDeadlinePassed && (
                    <Button size="sm" asChild>
                      <Link href={`/member/workshops/${workshop.id}/register`}>
                        Register Now
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}