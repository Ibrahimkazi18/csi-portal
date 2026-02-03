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
  Trophy, Target, Edit, Save, X, AlertTriangle, Crown, Medal, Award
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
  eventId?: string
  onComplete?: () => void
}

export function ComprehensiveManualEventCreator({ eventId, onComplete }: ManualEventCreatorProps) {
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
  const [registrations, setRegistrations] = useState<any[]>([])

  const getStepCount = () => {
    if (eventData.mode === 'workshop') return 4
    if (eventData.is_tournament) return 6
    return 4
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "Event Details"
      case 2: return eventData.type === 'team' ? "Add Teams" : "Add Participants"
      case 3: return eventData.mode === 'workshop' ? "Workshop Hosts" : "Event Rounds"
      case 4: return eventData.mode === 'workshop' ? "Review & Finalize" : "Set Progress"
      case 5: return "Set Winners"
      case 6: return "Review & Finalize"
      default: return "Step " + step
    }
  }

  // Load existing event data if editing
  useEffect(() => {
    if (eventId && isEditing) {
      const loadEventData = async () => {
        setLoading(true)
        const result = await getManualEventDetails(eventId)
        if (result.success && result.data) {
          const { event, rounds: eventRounds, registrations: eventRegs, hosts: eventHosts, progress, winners: eventWinners } = result.data
          
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
          setRegistrations(eventRegs)
          
          // Set participants/teams based on registrations
          if (event.type === 'individual') {
            const individualParticipants = eventRegs
              .filter(r => r.registration_type === 'individual')
              .map(r => ({
                email: r.profiles?.email || '',
                name: r.profiles?.full_name || '',
                role: 'Student'
              }))
            setParticipants(individualParticipants)
          } else {
            const teamData = eventRegs
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
          
          if (event.manual_status === 'finalized') {
            setCurrentStep(getStepCount())
          } else {
            setCurrentStep(2)
          }
        } else {
          toast.error('Failed to load event data')
        }
        setLoading(false)
      }
      loadEventData()
    }
  }, [eventId, isEditing])

  // Fetch available members
  useEffect(() => {
    const fetchMembers = async () => {
      const result = await getAvailableMembers()
      if (result.success && result.members) {
        setAvailableMembers(result.members)
      }
    }
    fetchMembers()
  }, [])

  const handleEventDataChange = (field: keyof EventData, value: any) => {
    setEventData(prev => ({ ...prev, [field]: value }))
  }

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

  const addTeamMember = () => {
    if (!newParticipant.email || !newParticipant.name) {
      toast.error('Email and name are required')
      return
    }

    if (newTeam.members.some(m => m.email === newParticipant.email)) {
      toast.error('Member already added to team')
      return
    }

    setNewTeam(prev => ({
      ...prev,
      members: [...prev.members, newParticipant]
    }))
    setNewParticipant({ email: '', name: '', role: '' })
    toast.success('Team member added')
  }

  const removeTeamMember = (email: string) => {
    setNewTeam(prev => ({
      ...prev,
      members: prev.members.filter(m => m.email !== email)
    }))
  }

  const saveTeam = () => {
    if (!newTeam.name || newTeam.members.length === 0) {
      toast.error('Team name and at least one member are required')
      return
    }

    if (newTeam.members.length > eventData.team_size!) {
      toast.error(`Team size cannot exceed ${eventData.team_size}`)
      return
    }

    if (teams.some(t => t.name === newTeam.name)) {
      toast.error('Team name already exists')
      return
    }

    setTeams(prev => [...prev, newTeam])
    setNewTeam({ name: '', members: [] })
    toast.success('Team added')
  }

  const removeTeam = (teamName: string) => {
    setTeams(prev => prev.filter(t => t.name !== teamName))
    toast.success('Team removed')
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

  const addRound = () => {
    if (!newRound.title) {
      toast.error('Round title is required')
      return
    }

    if (rounds.some(r => r.round_number === newRound.round_number)) {
      toast.error('Round number already exists')
      return
    }

    setRounds(prev => [...prev, newRound])
    setNewRound({
      title: '',
      description: '',
      round_number: Math.max(...rounds.map(r => r.round_number), 0) + 1
    })
    toast.success('Round added')
  }

  const removeRound = (roundNumber: number) => {
    setRounds(prev => prev.filter(r => r.round_number !== roundNumber))
    toast.success('Round removed')
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
    if (!createdEvent) return

    setLoading(true)
    try {
      let result
      if (eventData.type === 'individual') {
        result = await addEventParticipants(createdEvent.id, participants)
      } else {
        result = await addEventTeams(createdEvent.id, teams)
      }
      
      if (!result.success) {
        toast.error(result.error || 'Failed to add participants')
        return
      }

      if ('message' in result && result.message) {
        toast.success(result.message)
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
    if (!createdEvent) return

    if (eventData.mode === 'workshop' && hosts.length === 0) {
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

  const handleAddRounds = async () => {
    if (!createdEvent) return

    if (rounds.length === 0) {
      setCurrentStep(eventData.is_tournament ? 5 : 6)
      return
    }

    setLoading(true)
    try {
      const result = await addEventRounds(createdEvent.id, rounds)
      
      if (!result.success) {
        toast.error(result.error || 'Failed to add rounds')
        return
      }

      toast.success('Rounds added successfully')
      setCurrentStep(5)
    } catch (error) {
      console.error('Add rounds error:', error)
      toast.error('Failed to add rounds')
    } finally {
      setLoading(false)
    }
  }

  const handleSetWinners = async () => {
    if (!createdEvent) return

    if (winners.length === 0) {
      setCurrentStep(6)
      return
    }

    setLoading(true)
    try {
      const result = await setEventWinners(createdEvent.id, winners)
      
      if (!result.success) {
        toast.error(result.error || 'Failed to set winners')
        return
      }

      toast.success('Winners set successfully')
      setCurrentStep(6)
    } catch (error) {
      console.error('Set winners error:', error)
      toast.error('Failed to set winners')
    } finally {
      setLoading(false)
    }
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
      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Finalize event error:', error)
      toast.error('Failed to finalize event')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!createdEvent) return

    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const result = await deleteManualEvent(createdEvent.id)
      
      if (!result.success) {
        toast.error(result.error || 'Failed to delete event')
        return
      }

      toast.success('Event deleted successfully')
      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Delete event error:', error)
      toast.error('Failed to delete event')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
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
    setTeams([])
    setHosts([])
    setRounds([])
    setWinners([])
    setMemberSearchQuery('')
    setShowMemberList(false)
    setParticipantMode('select')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Edit Manual Event' : 'Create Manual Event'}
          </h2>
          <p className="text-muted-foreground">
            Add events that were completed but not originally recorded in the portal
          </p>
        </div>
        
        {createdEvent && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
            <Button variant="destructive" onClick={handleDeleteEvent} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Event
            </Button>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {Array.from({ length: getStepCount() }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              currentStep >= step 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {step}
            </div>
            {step < getStepCount() && (
              <div className={`h-0.5 w-16 ${
                currentStep > step ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="text-sm text-muted-foreground text-center">
        {getStepTitle(currentStep)}
      </div>

      {/* Step 1: Event Details */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Basic information about the completed event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="meeting_link">Meeting Link (Optional)</Label>
              <Input
                id="meeting_link"
                type="url"
                value={eventData.meeting_link || ''}
                onChange={(e) => handleEventDataChange('meeting_link', e.target.value || undefined)}
                placeholder="https://meet.google.com/... (leave empty if not applicable)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_deadline">Registration Deadline (Optional)</Label>
              <Input
                id="registration_deadline"
                type="datetime-local"
                value={eventData.registration_deadline || ''}
                onChange={(e) => handleEventDataChange('registration_deadline', e.target.value || undefined)}
              />
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
              <Button 
                onClick={isEditing ? handleUpdateEvent : handleCreateEvent} 
                disabled={loading || !eventData.title || !eventData.description || !eventData.start_date || !eventData.end_date || !eventData.category}
                className="flex-1"
              >
                {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Event' : 'Create Event')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remaining steps will be added in the next part due to length constraints */}
      {currentStep > 1 && (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">
            Additional steps are being implemented...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Current step: {currentStep} of {getStepCount()}
          </p>
        </div>
      )}
    </div>
  )
}