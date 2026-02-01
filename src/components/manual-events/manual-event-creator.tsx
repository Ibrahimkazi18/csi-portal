"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, Trash2, Users, Calendar, CheckCircle, Search, UserPlus, 
  Trophy, Target, Edit, Save, X, AlertTriangle 
} from "lucide-react"
import { 
  createManualEvent, addEventParticipants, addEventTeams, addWorkshopHosts, 
  addEventRounds, setEventProgress, setEventWinners, finalizeManualEvent, 
  getAvailableMembers, getManualEventDetails, updateManualEvent, deleteManualEvent 
} from "@/app/actions/manual-events"
import { toast } from "sonner"

interface Member {
  id: string
  full_name: string
  email: string
}

interface Participant {
  email: string
  name: string
  role?: string
}

interface Team {
  name: string
  members: Participant[]
}

interface WorkshopHost {
  name: string
  designation?: string
}

interface Round {
  title: string
  description?: string
  round_number: number
}

interface Winner {
  position: number
  team_id?: string
  user_id?: string
  name?: string
}

interface EventData {
  title: string
  description: string
  start_date: string
  end_date: string
  meeting_link: string | undefined
  type: 'individual' | 'team'
  category: string
  max_participants: number
  registration_deadline: string | undefined
  mode: 'event' | 'workshop'
  duration: number | undefined
  team_size: number | undefined
  is_tournament: boolean
}

interface ManualEventCreatorProps {
  eventId?: string // For editing existing events
  onComplete?: () => void
}

export function ManualEventCreator({ eventId, onComplete }: ManualEventCreatorProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(!!eventId)
  
  // Member selection
  const [availableMembers, setAvailableMembers] = useState<Member[]>([])
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [showMemberList, setShowMemberList] = useState(false)
  const [participantMode, setParticipantMode] = useState<'select' | 'manual'>('select')
  
  // Event data
  const [eventData, setEventData] = useState<EventData>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    meeting_link: undefined,
    type: 'individual',
    category: '',
    max_participants: 50,
    registration_deadline: undefined,
    mode: 'event',
    duration: undefined,
    team_size: undefined,
    is_tournament: false,
  })

  // Participants and teams
  const [participants, setParticipants] = useState<Participant[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [newParticipant, setNewParticipant] = useState<Participant>({
    email: '',
    name: '',
    role: '',
  })
  const [newTeam, setNewTeam] = useState<Team>({
    name: '',
    members: []
  })

  // Workshop hosts
  const [hosts, setHosts] = useState<WorkshopHost[]>([])
  const [newHost, setNewHost] = useState<WorkshopHost>({
    name: '',
    designation: '',
  })

  // Rounds and results
  const [rounds, setRounds] = useState<Round[]>([])
  const [newRound, setNewRound] = useState<Round>({
    title: '',
    description: '',
    round_number: 1
  })
  const [winners, setWinners] = useState<Winner[]>([])
  const [eventProgress, setEventProgressState] = useState<any[]>([])

  const totalSteps = eventData.mode === 'workshop' ? 4 : (eventData.is_tournament ? 6 : 4)

  const handleEventDataChange = (field: keyof EventData, value: any) => {
    setEventData(prev => ({ ...prev, [field]: value }))
  }

  // Load existing event data if editing
  useEffect(() => {
    if (eventId && isEditing) {
      const loadEventData = async () => {
        setLoading(true)
        const result = await getManualEventDetails(eventId)
        if (result.success && result.data) {
          const { event, rounds: eventRounds, registrations, hosts: eventHosts, progress, winners: eventWinners } = result.data
          
          // Set event data
          setEventData({
            title: event.title,
            description: event.description,
            start_date: event.start_date,
            end_date: event.end_date,
            meeting_link: event.meeting_link,
            type: event.type,
            category: event.category,
            max_participants: event.max_participants,
            registration_deadline: event.registration_deadline,
            mode: event.mode,
            duration: event.duration,
            team_size: event.team_size,
            is_tournament: event.is_tournament,
          })
          
          setCreatedEvent(event)
          setRounds(eventRounds)
          setHosts(eventHosts)
          setWinners(eventWinners)
          setEventProgressState(progress)
          
          // Set participants/teams based on registrations
          if (event.type === 'individual') {
            const individualParticipants = registrations
              .filter(r => r.registration_type === 'individual')
              .map(r => ({
                email: r.profiles?.email || '',
                name: r.profiles?.full_name || '',
                role: 'Student'
              }))
            setParticipants(individualParticipants)
          } else {
            const teamData = registrations
              .filter(r => r.registration_type === 'team' && r.teams)
              .map(r => ({
                name: r.teams.name,
                members: r.teams.team_members?.map((tm: any) => ({
                  email: tm.profiles?.email || '',
                  name: tm.profiles?.full_name || '',
                  role: 'Student'
                })) || []
              }))
            setTeams(teamData)
          }
          
          // Set appropriate step based on event status
          if (event.manual_status === 'finalized') {
            setCurrentStep(totalSteps) // Show final step
          } else {
            setCurrentStep(2) // Start from participants step
          }
        } else {
          toast.error('Failed to load event data')
        }
        setLoading(false)
      }
      loadEventData()
    }
  }, [eventId, isEditing, totalSteps])

  // Fetch available members when component mounts
  useEffect(() => {
    const fetchMembers = async () => {
      const result = await getAvailableMembers()
      if (result.success && result.members) {
        setAvailableMembers(result.members)
      }
    }
    fetchMembers()
  }, [])

  // Filter members based on search query
  const filteredMembers = availableMembers.filter(member =>
    member.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
  )

  const addMemberAsParticipant = (member: Member) => {
    if (eventData.type === 'individual') {
      if (participants.some(p => p.email === member.email)) {
        toast.error('Member already added as participant')
        return
      }

      const participant: Participant = {
        email: member.email,
        name: member.full_name,
        role: 'Student'
      }

      setParticipants(prev => [...prev, participant])
    } else {
      // Add to current team being created
      if (newTeam.members.some(m => m.email === member.email)) {
        toast.error('Member already added to team')
        return
      }

      const teamMember: Participant = {
        email: member.email,
        name: member.full_name,
        role: 'Student'
      }

      setNewTeam(prev => ({
        ...prev,
        members: [...prev.members, teamMember]
      }))
    }

    setMemberSearchQuery('')
    setShowMemberList(false)
    toast.success('Member added')
  }

  const addParticipant = () => {
    if (!newParticipant.email || !newParticipant.name) {
      toast.error('Email and name are required')
      return
    }

    if (participants.some(p => p.email === newParticipant.email)) {
      toast.error('Participant already added')
      return
    }

    setParticipants(prev => [...prev, newParticipant])
    setNewParticipant({ email: '', name: '', role: '' })
    toast.success('Participant added')
  }

  const removeParticipant = (email: string) => {
    setParticipants(prev => prev.filter(p => p.email !== email))
    toast.success('Participant removed')
  }

  const addHost = () => {
    if (!newHost.name) {
      toast.error('Host name is required')
      return
    }

    setHosts(prev => [...prev, newHost])
    setNewHost({ name: '', designation: '' })
    toast.success('Host added')
  }

  const removeHost = (index: number) => {
    setHosts(prev => prev.filter((_, i) => i !== index))
    toast.success('Host removed')
  }

  const handleCreateEvent = async () => {
    setLoading(true)
    try {
      const result = await createManualEvent(eventData as any)
      if (!result.success) {
        toast.error(result.error || 'Failed to create event')
        return
      }

      setCreatedEvent(result.event)
      setCurrentStep(2)
      toast.success('Event created successfully')
    } catch (error) {
      console.error('Create event error:', error)
      toast.error('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEvent = async () => {
    if (!createdEvent) return
    
    setLoading(true)
    try {
      const result = await updateManualEvent(createdEvent.id, eventData)
      if (!result.success) {
        toast.error(result.error || 'Failed to update event')
        return
      }

      toast.success('Event updated successfully')
    } catch (error) {
      console.error('Update event error:', error)
      toast.error('Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  const handleAddParticipants = async () => {
    if (!createdEvent || participants.length === 0) {
      setCurrentStep(3)
      return
    }

    setLoading(true)
    try {
      const result = await addEventParticipants(createdEvent.id, participants)
      
      if (!result.success) {
        toast.error(result.error || 'Failed to add participants')
        return
      }

      if (result.success) {
        toast.success("Success")
      } else {
        toast.success('Participants added successfully')
      }

      setCurrentStep(3)
    } catch (error) {
      console.error('Add participants error:', error)
      toast.error('Failed to add participants')
    } finally {
      setLoading(false)
    }
  }

  const handleAddHosts = async () => {
    if (!createdEvent || (eventData.mode === 'workshop' && hosts.length === 0)) {
      toast.error('At least one host is required for workshops')
      return
    }

    if (eventData.mode === 'workshop' && hosts.length > 0) {
      setLoading(true)
      try {
        const result = await addWorkshopHosts(createdEvent.id, hosts)
        
        if (!result.success) {
          toast.error(result.error || 'Failed to add hosts')
          return
        }

        toast.success('Hosts added successfully')
      } catch (error) {
        console.error('Add hosts error:', error)
        toast.error('Failed to add hosts')
      } finally {
        setLoading(false)
      }
    }

    setCurrentStep(4)
  }

  const handleFinalizeEvent = async () => {
    if (!createdEvent) return

    setLoading(true)
    try {
      const result = await finalizeManualEvent(createdEvent.id)
      
      if (!result.success) {
        toast.error(result.error || 'Failed to finalize event')
        return
      }

      toast.success('Event finalized and is now live!')
      // Reset form
      setCurrentStep(1)
      setCreatedEvent(null)
      setEventData({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        meeting_link: undefined,
        type: 'individual',
        category: '',
        max_participants: 50,
        registration_deadline: undefined,
        mode: 'event',
        duration: undefined,
        team_size: undefined,
        is_tournament: false,
      })
      setParticipants([])
      setHosts([])
      setMemberSearchQuery('')
      setShowMemberList(false)
      setParticipantMode('select')
    } catch (error) {
      console.error('Finalize event error:', error)
      toast.error('Failed to finalize event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              currentStep >= step 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {step}
            </div>
            {step < 4 && (
              <div className={`h-0.5 w-16 ${
                currentStep > step ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="text-sm text-muted-foreground text-center">
        {currentStep === 1 && "Event Details"}
        {currentStep === 2 && "Add Participants"}
        {currentStep === 3 && "Workshop Hosts"}
        {currentStep === 4 && "Review & Finalize"}
      </div>

      {/* Step 1: Event Details */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={eventData.title}
                onChange={(e) => handleEventDataChange('title', e.target.value)}
                placeholder="Enter event title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={eventData.category} onValueChange={(value) => handleEventDataChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="non-technical">Non-Technical</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="competition">Competition</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={eventData.description}
              onChange={(e) => handleEventDataChange('description', e.target.value)}
              placeholder="Enter event description"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mode">Event Mode *</Label>
              <Select value={eventData.mode} onValueChange={(value: 'event' | 'workshop') => handleEventDataChange('mode', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Regular Event</SelectItem>
                  <SelectItem value="workshop">Workshop/Seminar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Participation Type *</Label>
              <Select value={eventData.type} onValueChange={(value: 'individual' | 'team') => handleEventDataChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date & Time *</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={eventData.start_date}
                onChange={(e) => handleEventDataChange('start_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date & Time *</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={eventData.end_date}
                onChange={(e) => handleEventDataChange('end_date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Participants *</Label>
              <Input
                id="max_participants"
                type="number"
                min="1"
                value={eventData.max_participants}
                onChange={(e) => handleEventDataChange('max_participants', parseInt(e.target.value))}
              />
            </div>

            {eventData.type === 'team' && (
              <div className="space-y-2">
                <Label htmlFor="team_size">Team Size *</Label>
                <Input
                  id="team_size"
                  type="number"
                  min="2"
                  value={eventData.team_size || 2}
                  onChange={(e) => handleEventDataChange('team_size', parseInt(e.target.value))}
                />
              </div>
            )}
          </div>

          {eventData.mode === 'workshop' && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duration in Minutes (Optional)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                value={eventData.duration || ''}
                onChange={(e) => handleEventDataChange('duration', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 120 for 2 hours"
              />
              <p className="text-xs text-muted-foreground">
                Specify workshop duration. Leave empty if duration is flexible.
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meeting_link">Meeting Link (Optional)</Label>
              <Input
                id="meeting_link"
                type="url"
                value={eventData.meeting_link || ''}
                onChange={(e) => handleEventDataChange('meeting_link', e.target.value || undefined)}
                placeholder="https://meet.google.com/... (leave empty if not applicable)"
              />
              <p className="text-xs text-muted-foreground">
                Only required for online events. Leave empty for offline events.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="registration_deadline">Registration Deadline (Optional)</Label>
            <Input
              id="registration_deadline"
              type="datetime-local"
              value={eventData.registration_deadline || ''}
              onChange={(e) => handleEventDataChange('registration_deadline', e.target.value || undefined)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty if there's no specific registration deadline.
            </p>
          </div>

          {eventData.mode === 'event' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_tournament"
                checked={eventData.is_tournament}
                onCheckedChange={(checked) => handleEventDataChange('is_tournament', checked)}
              />
              <Label htmlFor="is_tournament">
                This was a tournament with rounds and elimination
              </Label>
            </div>
          )}

          <div className="flex gap-4">
            {isEditing ? (
              <>
                <Button 
                  onClick={handleUpdateEvent} 
                  disabled={loading || !eventData.title || !eventData.description || !eventData.start_date || !eventData.end_date || !eventData.category}
                  className="flex-1"
                >
                  {loading ? 'Updating Event...' : 'Update Event'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={!createdEvent}
                >
                  Continue to Participants
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleCreateEvent} 
                disabled={loading || !eventData.title || !eventData.description || !eventData.start_date || !eventData.end_date || !eventData.category}
                className="w-full"
              >
                {loading ? 'Creating Event...' : 'Create Event'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Add Participants */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Add Participants</h3>
            <p className="text-sm text-muted-foreground">
              Add participants who attended this event. You can select from existing members or add new participants manually.
            </p>
          </div>

          {/* Participant Mode Toggle */}
          <Tabs value={participantMode} onValueChange={(value) => setParticipantMode(value as 'select' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select">Select Members</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            {/* Select from Members */}
            <TabsContent value="select" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Select from Existing Members</CardTitle>
                  <CardDescription>
                    Search and select members from the CSI portal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or roll number..."
                      value={memberSearchQuery}
                      onChange={(e) => {
                        setMemberSearchQuery(e.target.value)
                        setShowMemberList(e.target.value.length > 0)
                        getAvailableMembers()
                      }}
                      className="pl-10"
                    />
                  </div>

                  {showMemberList && memberSearchQuery && (
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                      {filteredMembers.length > 0 ? (
                        <div className="p-2">
                          {filteredMembers.slice(0, 10).map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer"
                              onClick={() => addMemberAsParticipant(member)}
                            >
                              <div>
                                <p className="font-medium">{member.full_name}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                              </div>
                              <Button size="sm" variant="ghost">
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {filteredMembers.length > 10 && (
                            <p className="text-xs text-muted-foreground text-center p-2">
                              Showing first 10 results. Refine your search for more specific results.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No members found matching your search</p>
                          <p className="text-xs">Try searching with a different term or use manual entry</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!showMemberList && availableMembers.length > 0 && (
                    <div className="text-center p-4 border rounded-lg bg-muted/50">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Start typing to search from {availableMembers.length} available members
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manual Entry */}
            <TabsContent value="manual" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add New Participant</CardTitle>
                  <CardDescription>
                    Manually add participants who are not in the system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="participant-email">Email *</Label>
                      <Input
                        id="participant-email"
                        type="email"
                        value={newParticipant.email}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="participant@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="participant-name">Name *</Label>
                      <Input
                        id="participant-name"
                        value={newParticipant.name}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Full Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="participant-role">Role</Label>
                      <Input
                        id="participant-role"
                        value={newParticipant.role}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="Student, Faculty, etc."
                      />
                    </div>
                  </div>

                  <Button onClick={addParticipant} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Participant
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Added Participants List */}
          {participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Added Participants ({participants.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-sm text-muted-foreground">{participant.email}</p>
                        {participant.role && (
                          <Badge variant="secondary" className="text-xs mt-1">{participant.role}</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParticipant(participant.email)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button onClick={handleAddParticipants} disabled={loading} className="flex-1">
              {loading ? 'Adding Participants...' : 'Continue'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Workshop Hosts (only for workshops) */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              {eventData.mode === 'workshop' ? 'Add Workshop Hosts' : 'Workshop Hosts'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {eventData.mode === 'workshop' 
                ? 'Add speakers or hosts for this workshop. At least one host is required.'
                : 'This step is only for workshops. Click continue to proceed.'
              }
            </p>
          </div>

          {eventData.mode === 'workshop' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add New Host</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="host-name">Name *</Label>
                      <Input
                        id="host-name"
                        value={newHost.name}
                        onChange={(e) => setNewHost(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Host Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="host-designation">Designation</Label>
                      <Input
                        id="host-designation"
                        value={newHost.designation}
                        onChange={(e) => setNewHost(prev => ({ ...prev, designation: e.target.value }))}
                        placeholder="Professor, Engineer, etc."
                      />
                    </div>
                  </div>

                  <Button onClick={addHost} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Host
                  </Button>
                </CardContent>
              </Card>

              {hosts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Added Hosts ({hosts.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {hosts.map((host, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{host.name}</p>
                            {host.designation && (
                              <p className="text-sm text-muted-foreground">{host.designation}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHost(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Back
            </Button>
            <Button 
              onClick={handleAddHosts} 
              disabled={loading || (eventData.mode === 'workshop' && hosts.length === 0)} 
              className="flex-1"
            >
              {loading ? 'Adding Hosts...' : 'Continue'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Finalize */}
      {currentStep === 4 && createdEvent && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Review & Finalize</h3>
            <p className="text-sm text-muted-foreground">
              Review the event details and finalize to make it live
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <p className="font-medium">{eventData.title}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <p className="font-medium">{eventData.category}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Mode</Label>
                  <Badge variant="secondary">{eventData.mode}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Badge variant="outline">{eventData.type}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Participants</Label>
                  <p className="font-medium">{participants.length} added</p>
                </div>
                {eventData.mode === 'workshop' && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Hosts</Label>
                    <p className="font-medium">{hosts.length} added</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              Back
            </Button>
            <Button onClick={handleFinalizeEvent} disabled={loading} className="flex-1">
              {loading ? 'Finalizing...' : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalize Event
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}