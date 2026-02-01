"use client"

import { useState, useEffect } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core'
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
import { Progress } from "@/components/ui/progress"
import { 
  Plus, Trash2, Users, CheckCircle, Search, UserPlus, 
  Trophy, Target, ArrowRight, ArrowLeft, Clock, MapPin
} from "lucide-react"
import { 
  createManualEvent, addEventParticipants, addEventTeams, addWorkshopHosts, 
  addEventRounds, setEventProgress, setEventWinners, finalizeManualEvent, 
  getAvailableMembers, getManualEventDetails, updateManualEvent, deleteManualEvent,
  createComprehensiveManualEvent
} from "@/app/actions/manual-events"
import { toast } from "sonner"

interface ManualEventState {
  step: 'details' | 'rounds' | 'participants' | 'progression' | 'results'
  canProceed: boolean
  completionChecklist: {
    hasBasicDetails: boolean
    hasRounds: boolean
    hasParticipants: boolean
    hasProgression: boolean
    hasResults: boolean
  }
}

interface ManualEventForm {
  // Basic Details
  title: string
  description: string
  banner_url?: string
  category: string
  type: 'individual' | 'team'
  
  // Event Configuration
  max_participants: number
  team_size?: number
  
  // Dates (all in past)
  registration_deadline?: string
  start_date: string
  end_date: string
  completed_at: string
  
  // Manual Entry Metadata
  source: 'manual'
  mode: 'event' | 'workshop'
  status: 'completed'
  manual_status: 'draft'
  
  // Additional fields
  meeting_link?: string
  is_tournament: boolean
  duration?: number
}

interface Round {
  id?: string
  round_number: number
  title: string
  description?: string
}

interface Participant {
  id: string
  name: string
  email: string
  attended: boolean
}

interface Team {
  id?: string
  name: string
  members: Participant[]
  attended: boolean
}

interface RoundProgression {
  round_id: string
  participants: {
    id: string
    eliminated: boolean
    position?: number
  }[]
}

interface Result {
  position: number
  participant_id?: string
  team_id?: string
  points_awarded?: number
  prize?: string
}

interface ComprehensiveManualEventFlowProps {
  eventId?: string
  onComplete?: () => void
}

export function ComprehensiveManualEventFlow({ eventId, onComplete }: ComprehensiveManualEventFlowProps) {
  const [state, setState] = useState<ManualEventState>({
    step: 'details',
    canProceed: false,
    completionChecklist: {
      hasBasicDetails: false,
      hasRounds: false,
      hasParticipants: false,
      hasProgression: false,
      hasResults: false
    }
  })

  const [loading, setLoading] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<any>(null)
  
  // Form data
  const [eventForm, setEventForm] = useState<ManualEventForm>({
    title: '',
    description: '',
    banner_url: '',
    category: '',
    type: 'individual',
    max_participants: 50,
    team_size: 2,
    registration_deadline: '',
    start_date: '',
    end_date: '',
    completed_at: '',
    source: 'manual',
    mode: 'event',
    status: 'completed',
    manual_status: 'draft',
    meeting_link: '',
    is_tournament: false,
    duration: undefined
  })

  const [rounds, setRounds] = useState<Round[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [progression, setProgression] = useState<RoundProgression[]>([])
  const [results, setResults] = useState<Result[]>([])

  // Available members for selection
  const [availableMembers, setAvailableMembers] = useState<any[]>([])

  const steps = ['details', 'rounds', 'participants', 'progression', 'results'] as const
  const currentStepIndex = steps.indexOf(state.step)
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100

  const getStepTitle = (step: string) => {
    switch (step) {
      case 'details': return 'Event Details'
      case 'rounds': return 'Configure Rounds'
      case 'participants': return eventForm.type === 'team' ? 'Add Teams' : 'Add Participants'
      case 'progression': return 'Round Progression'
      case 'results': return 'Results & Winners'
      default: return step
    }
  }

  const updateCompletionChecklist = () => {
    const hasProgressionData = progression.length > 0
    const totalParticipants = eventForm.type === 'team' ? teams.length : participants.length
    
    // Check if any progression has participants assigned to rounds
    const hasAnyProgression = hasProgressionData && progression.some(p => 
      p.participants && p.participants.length > 0
    )
    
    // For events with no rounds, progression is automatically complete
    const progressionComplete = hasAnyProgression || eventForm.mode === 'workshop' || rounds.length === 0
    
    console.log('Updating completion checklist:', {
      progression: progression.length,
      hasProgressionData,
      totalParticipants,
      hasAnyProgression,
      progressionComplete,
      eventMode: eventForm.mode,
      roundsCount: rounds.length
    })
    
    setState(prev => ({
      ...prev,
      completionChecklist: {
        hasBasicDetails: !!(eventForm.title && eventForm.description && eventForm.start_date && eventForm.end_date),
        hasRounds: rounds.length > 0 || eventForm.mode === 'workshop',
        hasParticipants: eventForm.type === 'team' ? teams.length > 0 : participants.length > 0,
        hasProgression: progressionComplete,
        hasResults: results.length > 0 || eventForm.mode === 'workshop'
      }
    }))
  }

  useEffect(() => {
    updateCompletionChecklist()
  }, [eventForm, rounds, participants, teams, progression, results])

  // Additional effect to update checklist when progression changes
  useEffect(() => {
    updateCompletionChecklist()
  }, [progression])

  const handleFormChange = (field: keyof ManualEventForm, value: any) => {
    setEventForm(prev => ({ ...prev, [field]: value }))
  }

  const addRound = () => {
    const nextRoundNumber = rounds.length + 1
    const newRound: Round = {
      round_number: nextRoundNumber,
      title: `Round ${nextRoundNumber}`,
      description: ''
    }
    setRounds(prev => [...prev, newRound])
  }

  const removeRound = (roundNumber: number) => {
    setRounds(prev => prev.filter(r => r.round_number !== roundNumber))
    // Renumber remaining rounds
    setRounds(prev => prev.map((r, index) => ({ ...r, round_number: index + 1 })))
  }

  const nextStep = async () => {
    const currentIndex = steps.indexOf(state.step)
    
    // Handle event creation on first step
    if (currentIndex === 0 && !createdEvent) {
      setLoading(true)
      try {
        const result = await createManualEvent({
          ...eventForm,
          meeting_link: eventForm.meeting_link || undefined,
          registration_deadline: eventForm.registration_deadline || undefined
        })
        if (!result.success) {
          toast.error(result.error || 'Failed to create event')
          setLoading(false)
          return
        }
        setCreatedEvent(result.event)
        toast.success('Event created successfully')
      } catch (error) {
        console.error('Create event error:', error)
        toast.error('Failed to create event')
        setLoading(false)
        return
      } finally {
        setLoading(false)
      }
    }
    
    if (currentIndex < steps.length - 1) {
      setState(prev => ({ ...prev, step: steps[currentIndex + 1] }))
    }
  }

  const prevStep = () => {
    const currentIndex = steps.indexOf(state.step)
    if (currentIndex > 0) {
      setState(prev => ({ ...prev, step: steps[currentIndex - 1] }))
    }
  }

  const handleFinalizeEvent = async () => {
    if (!createdEvent) return

    setLoading(true)
    try {
      // Save all data using the comprehensive function
      const result = await createComprehensiveManualEvent({
        eventData: {
          ...eventForm,
          meeting_link: eventForm.meeting_link || undefined,
          registration_deadline: eventForm.registration_deadline || undefined
        },
        rounds: rounds.length > 0 ? rounds : undefined,
        participants: eventForm.type === 'individual' && participants.length > 0 ? participants.map(p => ({
          email: p.email,
          name: p.name,
          role: 'Student'
        })) : undefined,
        teams: eventForm.type === 'team' && teams.length > 0 ? teams.map(t => ({
          name: t.name,
          members: t.members.map(m => ({
            email: m.email,
            name: m.name,
            role: 'Student'
          }))
        })) : undefined,
        hosts: eventForm.mode === 'workshop' ? [] : undefined,
        progress: progression.length > 0 ? progression.map(p => ({
          round_id: p.round_id,
          participants: p.participants.map(pp => ({
            [eventForm.type === 'team' ? 'team_id' : 'user_id']: pp.id,
            eliminated: pp.eliminated
          }))
        })).flat() : undefined,
        winners: results.length > 0 ? results.map(r => ({
          position: r.position,
          team_id: r.team_id,
          user_id: r.participant_id
        })) : undefined
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to finalize event')
        return
      }

      // Finalize the event
      const finalizeResult = await finalizeManualEvent(createdEvent.id)
      if (!finalizeResult.success) {
        toast.error(finalizeResult.error || 'Failed to finalize event')
        return
      }

      toast.success('Event finalized successfully!')
      
      // Reset form
      setState(prev => ({ ...prev, step: 'details' }))
      setCreatedEvent(null)
      setEventForm({
        title: '',
        description: '',
        banner_url: '',
        category: '',
        type: 'individual',
        max_participants: 50,
        team_size: 2,
        registration_deadline: '',
        start_date: '',
        end_date: '',
        completed_at: '',
        source: 'manual',
        mode: 'event',
        status: 'completed',
        manual_status: 'draft',
        meeting_link: '',
        is_tournament: false,
        duration: undefined
      })
      setRounds([])
      setParticipants([])
      setTeams([])
      setProgression([])
      setResults([])
      
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

  const canProceedToNext = () => {
    switch (state.step) {
      case 'details':
        return state.completionChecklist.hasBasicDetails
      case 'rounds':
        return state.completionChecklist.hasRounds
      case 'participants':
        return state.completionChecklist.hasParticipants
      case 'progression':
        return state.completionChecklist.hasProgression
      case 'results':
        return state.completionChecklist.hasResults
      default:
        return false
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Manual Event Entry</h2>
            <p className="text-muted-foreground">
              Add historical events that were conducted offline
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {getStepTitle(state.step)}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {steps.length}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                index <= currentStepIndex
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 w-16 ${
                  index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{getStepTitle(state.step)}</CardTitle>
          <CardDescription>
            {state.step === 'details' && 'Enter basic event information and configuration'}
            {state.step === 'rounds' && 'Configure tournament rounds and structure'}
            {state.step === 'participants' && 'Add participants who attended the event'}
            {state.step === 'progression' && 'Track participant movement through rounds'}
            {state.step === 'results' && 'Record final results and winners'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Event Details */}
          {state.step === 'details' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={eventForm.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="Enter event title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={eventForm.category} onValueChange={(value) => handleFormChange('category', value)}>
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
                  value={eventForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Enter event description"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mode">Event Mode *</Label>
                  <Select value={eventForm.mode} onValueChange={(value: 'event' | 'workshop') => handleFormChange('mode', value)}>
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
                  <Select value={eventForm.type} onValueChange={(value: 'individual' | 'team') => handleFormChange('type', value)}>
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
                  <Label htmlFor="max_participants">Max Participants *</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    min="1"
                    value={eventForm.max_participants}
                    onChange={(e) => handleFormChange('max_participants', parseInt(e.target.value))}
                  />
                </div>

                {eventForm.type === 'team' && (
                  <div className="space-y-2">
                    <Label htmlFor="team_size">Team Size *</Label>
                    <Input
                      id="team_size"
                      type="number"
                      min="2"
                      value={eventForm.team_size || 2}
                      onChange={(e) => handleFormChange('team_size', parseInt(e.target.value))}
                    />
                  </div>
                )}
              </div>

              {/* Date Fields */}
              <div className="space-y-4">
                <h4 className="font-medium">Event Dates (All must be in the past)</h4>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="registration_deadline">Registration Deadline *</Label>
                    <Input
                      id="registration_deadline"
                      type="datetime-local"
                      value={eventForm.registration_deadline}
                      onChange={(e) => handleFormChange('registration_deadline', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={eventForm.start_date}
                      onChange={(e) => handleFormChange('start_date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={eventForm.end_date}
                      onChange={(e) => handleFormChange('end_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="completed_at">Completion Date *</Label>
                    <Input
                      id="completed_at"
                      type="datetime-local"
                      value={eventForm.completed_at}
                      onChange={(e) => handleFormChange('completed_at', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      When the event was actually completed (same as end date or later)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Rounds Configuration */}
          {state.step === 'rounds' && (
            <div className="space-y-6">
              {eventForm.mode === 'workshop' ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Rounds for Workshops</h3>
                  <p className="text-muted-foreground">
                    Workshops don't have competitive rounds. Click continue to proceed.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Tournament Rounds</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure the rounds for this tournament
                      </p>
                    </div>
                    <Button onClick={addRound}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Round
                    </Button>
                  </div>

                  {rounds.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                      <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Rounds Added</h3>
                      <p className="text-muted-foreground mb-4">
                        Add rounds to structure your tournament
                      </p>
                      <Button onClick={addRound}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Round
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rounds.map((round, index) => (
                        <Card key={index} className="border-border/40">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label>Round Title</Label>
                                    <Input
                                      value={round.title}
                                      onChange={(e) => {
                                        const updatedRounds = [...rounds]
                                        updatedRounds[index].title = e.target.value
                                        setRounds(updatedRounds)
                                      }}
                                      placeholder={`Round ${round.round_number}`}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Round Number</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={round.round_number}
                                      onChange={(e) => {
                                        const updatedRounds = [...rounds]
                                        updatedRounds[index].round_number = parseInt(e.target.value)
                                        setRounds(updatedRounds)
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Description (Optional)</Label>
                                  <Textarea
                                    value={round.description || ''}
                                    onChange={(e) => {
                                      const updatedRounds = [...rounds]
                                      updatedRounds[index].description = e.target.value
                                      setRounds(updatedRounds)
                                    }}
                                    placeholder="Describe this round..."
                                    rows={2}
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRound(round.round_number)}
                                className="ml-4 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Participants Management */}
          {state.step === 'participants' && (
            <div className="space-y-6">
              {eventForm.type === 'individual' ? (
                <IndividualParticipantsStep 
                  participants={participants}
                  setParticipants={setParticipants}
                  availableMembers={availableMembers}
                  setAvailableMembers={setAvailableMembers}
                  maxParticipants={eventForm.max_participants}
                />
              ) : (
                <TeamParticipantsStep 
                  teams={teams}
                  setTeams={setTeams}
                  availableMembers={availableMembers}
                  setAvailableMembers={setAvailableMembers}
                  teamSize={eventForm.team_size || 2}
                  maxParticipants={eventForm.max_participants}
                />
              )}
            </div>
          )}

          {/* Step 4: Round Progression */}
          {state.step === 'progression' && (
            <div className="space-y-6">
              {eventForm.mode === 'workshop' ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Progression for Workshops</h3>
                  <p className="text-muted-foreground">
                    Workshops don't have competitive rounds. Click continue to set winners.
                  </p>
                </div>
              ) : (
                <RoundProgressionStep 
                  eventId={createdEvent?.id}
                  eventType={eventForm.type}
                  rounds={rounds}
                  participants={participants}
                  teams={teams}
                  progression={progression}
                  setProgression={setProgression}
                />
              )}
            </div>
          )}

          {/* Step 5: Results & Winners */}
          {state.step === 'results' && (
            <div className="space-y-6">
              <SetWinnersStep 
                eventId={createdEvent?.id}
                eventType={eventForm.type}
                eventMode={eventForm.mode}
                participants={participants}
                teams={teams}
                rounds={rounds}
                progression={progression}
                results={results}
                setResults={setResults}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-4">
          {/* Completion Checklist */}
          <div className="text-sm text-muted-foreground">
            {Object.entries(state.completionChecklist).filter(([_, completed]) => completed).length} / {Object.keys(state.completionChecklist).length} completed
          </div>

          {currentStepIndex === steps.length - 1 ? (
            <Button
              onClick={handleFinalizeEvent}
              disabled={!canProceedToNext() || loading}
            >
              {loading ? 'Finalizing...' : 'Finalize Event'}
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceedToNext()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Individual Participants Step Component
interface IndividualParticipantsStepProps {
  participants: Participant[]
  setParticipants: (participants: Participant[]) => void
  availableMembers: any[]
  setAvailableMembers: (members: any[]) => void
  maxParticipants: number
}

function IndividualParticipantsStep({ 
  participants, 
  setParticipants, 
  availableMembers, 
  setAvailableMembers,
  maxParticipants 
}: IndividualParticipantsStepProps) {
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [showMemberList, setShowMemberList] = useState(false)
  const [participantMode, setParticipantMode] = useState<'select' | 'manual'>('select')
  const [newParticipant, setNewParticipant] = useState<Participant>({
    id: '',
    name: '',
    email: '',
    attended: true
  })

  // Load available members
  useEffect(() => {
    const fetchMembers = async () => {
      const result = await getAvailableMembers()
      if (result.success && result.members) {
        setAvailableMembers(result.members)
      }
    }
    fetchMembers()
  }, [setAvailableMembers])

  const filteredMembers = availableMembers.filter(member =>
    member.full_name?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(memberSearchQuery.toLowerCase())
  )

  const addMemberAsParticipant = (member: any) => {
    if (participants.some(p => p.id === member.id)) {
      toast.error('Member already added as participant')
      return
    }

    if (participants.length >= maxParticipants) {
      toast.error('Maximum participants reached')
      return
    }

    const participant: Participant = {
      id: member.id,
      name: member.full_name,
      email: member.email,
      attended: true
    }

    setParticipants([...participants, participant])
    setMemberSearchQuery('')
    setShowMemberList(false)
    toast.success('Member added')
  }

  const addManualParticipant = () => {
    if (!newParticipant.email || !newParticipant.name) {
      toast.error('Email and name are required')
      return
    }

    if (participants.some(p => p.email === newParticipant.email)) {
      toast.error('Participant already added')
      return
    }

    if (participants.length >= maxParticipants) {
      toast.error('Maximum participants reached')
      return
    }

    const participant: Participant = {
      ...newParticipant,
      id: `manual-${Date.now()}` // Temporary ID for manual entries
    }

    setParticipants([...participants, participant])
    setNewParticipant({ id: '', name: '', email: '', attended: true })
    toast.success('Participant added')
  }

  const removeParticipant = (participantId: string) => {
    setParticipants(participants.filter(p => p.id !== participantId))
    toast.success('Participant removed')
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Add Individual Participants</h3>
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
                  placeholder="Search by name or email..."
                  value={memberSearchQuery}
                  onChange={(e) => {
                    setMemberSearchQuery(e.target.value)
                    setShowMemberList(e.target.value.length > 0)
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
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>

              <Button onClick={addManualParticipant} className="w-full">
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
            <CardTitle className="text-base">Added Participants ({participants.length}/{maxParticipants})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{participant.name}</p>
                    <p className="text-sm text-muted-foreground">{participant.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParticipant(participant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {participants.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Participants Added</h3>
          <p className="text-muted-foreground">
            Add participants using the tabs above
          </p>
        </div>
      )}
    </div>
  )
}

// Team Participants Step Component
interface TeamParticipantsStepProps {
  teams: Team[]
  setTeams: (teams: Team[]) => void
  availableMembers: any[]
  setAvailableMembers: (members: any[]) => void
  teamSize: number
  maxParticipants: number
}

function TeamParticipantsStep({ 
  teams, 
  setTeams, 
  availableMembers, 
  setAvailableMembers,
  teamSize,
  maxParticipants 
}: TeamParticipantsStepProps) {
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [showMemberList, setShowMemberList] = useState(false)
  const [currentTeam, setCurrentTeam] = useState<Team>({
    id: '',
    name: '',
    members: [],
    attended: true
  })
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)

  // Load available members
  useEffect(() => {
    const fetchMembers = async () => {
      const result = await getAvailableMembers()
      if (result.success && result.members) {
        setAvailableMembers(result.members)
      }
    }
    fetchMembers()
  }, [setAvailableMembers])

  const filteredMembers = availableMembers.filter(member => {
    const searchMatch = member.full_name?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                       member.email?.toLowerCase().includes(memberSearchQuery.toLowerCase())
    
    // Exclude members already in current team
    const notInCurrentTeam = !currentTeam.members.some(m => m.id === member.id)
    
    // Exclude members already in other teams
    const notInOtherTeams = !teams.some(team => 
      team.members.some(m => m.id === member.id)
    )
    
    return searchMatch && notInCurrentTeam && notInOtherTeams
  })

  const addMemberToTeam = (member: any) => {
    if (currentTeam.members.length >= teamSize) {
      toast.error(`Team can only have ${teamSize} members`)
      return
    }

    const participant: Participant = {
      id: member.id,
      name: member.full_name,
      email: member.email,
      attended: true
    }

    setCurrentTeam(prev => ({
      ...prev,
      members: [...prev.members, participant]
    }))

    setMemberSearchQuery('')
    setShowMemberList(false)
    toast.success('Member added to team')
  }

  const removeMemberFromTeam = (memberId: string) => {
    setCurrentTeam(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== memberId)
    }))
    toast.success('Member removed from team')
  }

  const createTeam = () => {
    if (!currentTeam.name.trim()) {
      toast.error('Team name is required')
      return
    }

    if (currentTeam.members.length !== teamSize) {
      toast.error(`Team must have exactly ${teamSize} members`)
      return
    }

    if (teams.some(t => t.name.toLowerCase() === currentTeam.name.toLowerCase())) {
      toast.error('Team name already exists')
      return
    }

    const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0)
    if (totalMembers + currentTeam.members.length > maxParticipants) {
      toast.error('Adding this team would exceed maximum participants')
      return
    }

    const newTeam: Team = {
      ...currentTeam,
      id: `team-${Date.now()}` // Temporary ID
    }

    setTeams([...teams, newTeam])
    setCurrentTeam({ id: '', name: '', members: [], attended: true })
    setIsCreatingTeam(false)
    toast.success('Team created successfully')
  }

  const removeTeam = (teamId: string) => {
    setTeams(teams.filter(t => t.id !== teamId))
    toast.success('Team removed')
  }

  const totalParticipants = teams.reduce((sum, team) => sum + team.members.length, 0)
  const maxTeams = Math.floor(maxParticipants / teamSize)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Add Team Participants</h3>
        <p className="text-sm text-muted-foreground">
          Create teams with exactly {teamSize} members each. Maximum {maxTeams} teams allowed.
        </p>
      </div>

      {/* Create New Team */}
      {!isCreatingTeam ? (
        <div className="text-center">
          <Button 
            onClick={() => setIsCreatingTeam(true)}
            disabled={teams.length >= maxTeams}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Team
          </Button>
          {teams.length >= maxTeams && (
            <p className="text-xs text-muted-foreground mt-2">
              Maximum number of teams reached
            </p>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New Team</CardTitle>
            <CardDescription>
              Add team name and select {teamSize} members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                value={currentTeam.name}
                onChange={(e) => setCurrentTeam(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter team name"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Team Members ({currentTeam.members.length}/{teamSize})</Label>
                {currentTeam.members.length < teamSize && (
                  <Badge variant="secondary">
                    Need {teamSize - currentTeam.members.length} more
                  </Badge>
                )}
              </div>

              {/* Member Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members to add..."
                  value={memberSearchQuery}
                  onChange={(e) => {
                    setMemberSearchQuery(e.target.value)
                    setShowMemberList(e.target.value.length > 0)
                  }}
                  className="pl-10"
                  disabled={currentTeam.members.length >= teamSize}
                />
              </div>

              {showMemberList && memberSearchQuery && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredMembers.length > 0 ? (
                    <div className="p-2">
                      {filteredMembers.slice(0, 8).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer"
                          onClick={() => addMemberToTeam(member)}
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
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No available members found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Current Team Members */}
              {currentTeam.members.length > 0 && (
                <div className="space-y-2">
                  {currentTeam.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMemberFromTeam(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreatingTeam(false)
                  setCurrentTeam({ id: '', name: '', members: [], attended: true })
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={createTeam}
                disabled={!currentTeam.name.trim() || currentTeam.members.length !== teamSize}
                className="flex-1"
              >
                Create Team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Created Teams List */}
      {teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Created Teams ({teams.length}/{maxTeams}) - {totalParticipants} participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teams.map((team) => (
                <div key={team.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{team.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTeam(team.id!)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {team.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {teams.length === 0 && !isCreatingTeam && (
        <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Teams Created</h3>
          <p className="text-muted-foreground">
            Create teams with {teamSize} members each
          </p>
        </div>
      )}
    </div>
  )
}

// Round Progression Step Component
interface RoundProgressionStepProps {
  eventId?: string
  eventType: 'individual' | 'team'
  rounds: Round[]
  participants: Participant[]
  teams: Team[]
  progression: RoundProgression[]
  setProgression: (progression: RoundProgression[]) => void
}

function RoundProgressionStep({ 
  eventId, 
  eventType, 
  rounds, 
  participants, 
  teams, 
  progression, 
  setProgression 
}: RoundProgressionStepProps) {
  const [roundColumns, setRoundColumns] = useState<RoundColumn[]>([])
  const [unassigned, setUnassigned] = useState<ProgressParticipant[]>([])
  const [eliminated, setEliminated] = useState<ProgressParticipant[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  interface RoundColumn {
    id: string
    title: string
    round_number: number
    participants: ProgressParticipant[]
  }

  interface ProgressParticipant {
    id: string
    team_id?: string
    user_id?: string
    team_name?: string
    user_name?: string
    type: 'team' | 'individual'
    members?: string[]
    current_round_id?: string
    eliminated?: boolean
  }

  useEffect(() => {
    initializeProgressionData()
  }, [rounds, participants, teams, progression])

  const initializeProgressionData = () => {
    // Initialize round columns
    const columns: RoundColumn[] = rounds.map(round => ({
      id: round.id || `round-${round.round_number}`,
      title: round.title,
      round_number: round.round_number,
      participants: []
    }))

    // Initialize participants
    const allParticipants: ProgressParticipant[] = eventType === 'team' 
      ? teams.map(team => ({
          id: team.id || `team-${team.name}`,
          team_id: team.id,
          team_name: team.name,
          type: 'team' as const,
          members: team.members.map(m => m.name)
        }))
      : participants.map(participant => ({
          id: participant.id,
          user_id: participant.id,
          user_name: participant.name,
          type: 'individual' as const
        }))

    // Organize participants based on progression
    const unassignedList: ProgressParticipant[] = []
    const eliminatedList: ProgressParticipant[] = []

    allParticipants.forEach(participant => {
      const participantProgress = progression.find(p => 
        (eventType === 'team' && p.participants.some(pp => pp.id === participant.team_id)) ||
        (eventType === 'individual' && p.participants.some(pp => pp.id === participant.user_id))
      )

      if (participantProgress) {
        const participantData = participantProgress.participants.find(pp => 
          pp.id === (eventType === 'team' ? participant.team_id : participant.user_id)
        )

        if (participantData?.eliminated) {
          eliminatedList.push({ ...participant, eliminated: true })
        } else {
          const roundColumn = columns.find(c => c.id === participantProgress.round_id)
          if (roundColumn) {
            roundColumn.participants.push(participant)
          } else {
            unassignedList.push(participant)
          }
        }
      } else {
        unassignedList.push(participant)
      }
    })

    setRoundColumns(columns)
    setUnassigned(unassignedList)
    setEliminated(eliminatedList)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    const participantId = active.id as string
    const targetColumnId = over.id as string

    await moveParticipant(participantId, targetColumnId)
    setActiveId(null)
  }

  const moveParticipant = async (participantId: string, targetColumnId: string) => {
    setSaving(true)

    try {
      // Find the participant
      const allParticipants = [...unassigned, ...eliminated, ...roundColumns.flatMap(c => c.participants)]
      const participant = allParticipants.find(p => p.id === participantId)
      
      if (!participant) {
        toast.error('Participant not found')
        return
      }

      console.log('Moving participant:', {
        participantId,
        targetColumnId,
        participant: participant.team_name || participant.user_name
      })

      // Calculate new state values
      let newUnassigned = unassigned.filter(p => p.id !== participantId)
      let newEliminated = eliminated.filter(p => p.id !== participantId)
      let newRoundColumns = roundColumns.map(col => ({
        ...col,
        participants: col.participants.filter(p => p.id !== participantId)
      }))

      // Add to new location
      if (targetColumnId === 'eliminated') {
        newEliminated = [...newEliminated, { ...participant, eliminated: true }]
        toast.success(`${participant.team_name || participant.user_name} marked as eliminated`)
      } else if (targetColumnId === 'unassigned') {
        newUnassigned = [...newUnassigned, { ...participant, eliminated: false }]
        toast.success(`${participant.team_name || participant.user_name} moved to unassigned`)
      } else {
        // Moving to a round
        newRoundColumns = newRoundColumns.map(col => 
          col.id === targetColumnId 
            ? { ...col, participants: [...col.participants, { ...participant, eliminated: false }] }
            : col
        )
        
        const targetRound = roundColumns.find(c => c.id === targetColumnId)
        toast.success(`${participant.team_name || participant.user_name} moved to ${targetRound?.title}`)
      }

      // Update local state
      setUnassigned(newUnassigned)
      setEliminated(newEliminated)
      setRoundColumns(newRoundColumns)

      // Calculate progression based on new state
      const newProgression: RoundProgression[] = []

      newRoundColumns.forEach(column => {
        if (column.participants.length > 0) {
          newProgression.push({
            round_id: column.id,
            participants: column.participants.map(p => ({
              id: eventType === 'team' ? p.team_id! : p.user_id!,
              eliminated: false
            }))
          })
        }
      })

      // Add eliminated participants to progression data
      if (newEliminated.length > 0) {
        newProgression.push({
          round_id: 'eliminated',
          participants: newEliminated.map(p => ({
            id: eventType === 'team' ? p.team_id! : p.user_id!,
            eliminated: true
          }))
        })
      }

      console.log('Calculated new progression:', {
        roundColumns: newRoundColumns.length,
        eliminated: newEliminated.length,
        newProgression: newProgression.length,
        progressionData: newProgression
      })

      // Update parent progression state immediately
      setProgression(newProgression)

    } catch (error) {
      console.error('Error moving participant:', error)
      toast.error('Failed to move participant')
    } finally {
      setSaving(false)
    }
  }

  const updateProgressionState = () => {
    const newProgression: RoundProgression[] = []

    roundColumns.forEach(column => {
      if (column.participants.length > 0) {
        newProgression.push({
          round_id: column.id,
          participants: column.participants.map(p => ({
            id: eventType === 'team' ? p.team_id! : p.user_id!,
            eliminated: false
          }))
        })
      }
    })

    // Add eliminated participants
    if (eliminated.length > 0) {
      newProgression.push({
        round_id: 'eliminated',
        participants: eliminated.map(p => ({
          id: eventType === 'team' ? p.team_id! : p.user_id!,
          eliminated: true
        }))
      })
    }

    console.log('Updating progression state:', {
      roundColumns: roundColumns.length,
      eliminated: eliminated.length,
      newProgression: newProgression.length,
      progressionData: newProgression
    })

    // Update the parent state immediately
    setProgression(newProgression)
    
    // Return the progression data
    return newProgression
  }

  const getTotalParticipants = () => {
    return unassigned.length + eliminated.length + roundColumns.reduce((sum, col) => sum + col.participants.length, 0)
  }

  const getAssignedCount = () => {
    return eliminated.length + roundColumns.reduce((sum, col) => sum + col.participants.length, 0)
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Round Progression</h3>
          <p className="text-sm text-muted-foreground">
            Track participant movement through tournament rounds
          </p>
        </div>

        {/* Instructions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium mb-2">How to track progression:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Drag and drop {eventType === 'team' ? 'teams' : 'participants'} between rounds</li>
                  <li>• Move to "Eliminated" column to mark as eliminated</li>
                  <li>• Participants can move between any rounds</li>
                  <li>• Changes are tracked automatically</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {/* Unassigned Column */}
            <ProgressRoundColumn
              id="unassigned"
              title="Not Started"
              count={unassigned.length}
              participants={unassigned}
              color="gray"
            />

            {/* Round Columns */}
            {roundColumns.map((round) => (
              <ProgressRoundColumn
                key={round.id}
                id={round.id}
                title={round.title}
                count={round.participants.length}
                participants={round.participants}
                color="blue"
              />
            ))}

            {/* Eliminated Column */}
            <ProgressRoundColumn
              id="eliminated"
              title="Eliminated"
              count={eliminated.length}
              participants={eliminated}
              color="red"
            />
          </div>
        </div>

        {/* Progress Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Progress: {getAssignedCount()} / {getTotalParticipants()} {eventType === 'team' ? 'teams' : 'participants'} assigned
              </div>
              {saving && (
                <div className="text-sm text-muted-foreground">
                  Saving changes...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="p-3 bg-background border rounded-lg shadow-lg opacity-90">
              <div className="flex items-center gap-2">
                {eventType === 'team' ? <Users className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                <span className="font-medium">
                  {(() => {
                    const allParticipants = [...unassigned, ...eliminated, ...roundColumns.flatMap(c => c.participants)]
                    const participant = allParticipants.find(p => p.id === activeId)
                    return participant?.team_name || participant?.user_name || 'Unknown'
                  })()}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}

// Set Winners Step Component
interface SetWinnersStepProps {
  eventId?: string
  eventType: 'individual' | 'team'
  eventMode: 'event' | 'workshop'
  participants: Participant[]
  teams: Team[]
  rounds: Round[]
  progression: RoundProgression[]
  results: Result[]
  setResults: (results: Result[]) => void
}

function SetWinnersStep({ 
  eventId, 
  eventType, 
  eventMode,
  participants, 
  teams, 
  rounds, 
  progression, 
  results, 
  setResults 
}: SetWinnersStepProps) {
  const [finalists, setFinalists] = useState<ProgressParticipant[]>([])
  const [winners, setWinners] = useState<Winner[]>([
    { position: 1, points: 100 },
    { position: 2, points: 75 },
    { position: 3, points: 50 }
  ])
  const [saving, setSaving] = useState(false)

  interface Winner {
    position: 1 | 2 | 3
    participantId?: string
    participantName?: string
    participantType?: 'team' | 'individual'
    points: number
    prize?: string
  }

  interface ProgressParticipant {
    id: string
    team_id?: string
    user_id?: string
    team_name?: string
    user_name?: string
    type: 'team' | 'individual'
    members?: string[]
  }

  useEffect(() => {
    initializeFinalists()
  }, [participants, teams, rounds, progression])

  const initializeFinalists = () => {
    let finalistsList: ProgressParticipant[] = []

    if (eventMode === 'workshop') {
      // For workshops, all participants are potential winners
      finalistsList = eventType === 'team' 
        ? teams.map(team => ({
            id: team.id || `team-${team.name}`,
            team_id: team.id,
            team_name: team.name,
            type: 'team' as const,
            members: team.members.map(m => m.name)
          }))
        : participants.map(participant => ({
            id: participant.id,
            user_id: participant.id,
            user_name: participant.name,
            type: 'individual' as const
          }))
    } else {
      // For tournaments, get finalists from final round or all participants
      const finalRound = rounds.sort((a, b) => b.round_number - a.round_number)[0]
      
      if (finalRound && progression.length > 0) {
        const finalRoundProgression = progression.find(p => p.round_id === (finalRound.id || `round-${finalRound.round_number}`))
        
        if (finalRoundProgression) {
          finalistsList = finalRoundProgression.participants
            .filter(p => !p.eliminated)
            .map(p => {
              if (eventType === 'team') {
                const team = teams.find(t => t.id === p.id)
                return {
                  id: p.id,
                  team_id: p.id,
                  team_name: team?.name || 'Unknown Team',
                  type: 'team' as const,
                  members: team?.members.map(m => m.name) || []
                }
              } else {
                const participant = participants.find(part => part.id === p.id)
                return {
                  id: p.id,
                  user_id: p.id,
                  user_name: participant?.name || 'Unknown Participant',
                  type: 'individual' as const
                }
              }
            })
        }
      }
      
      // Fallback to all participants if no final round data
      if (finalistsList.length === 0) {
        finalistsList = eventType === 'team' 
          ? teams.map(team => ({
              id: team.id || `team-${team.name}`,
              team_id: team.id,
              team_name: team.name,
              type: 'team' as const,
              members: team.members.map(m => m.name)
            }))
          : participants.map(participant => ({
              id: participant.id,
              user_id: participant.id,
              user_name: participant.name,
              type: 'individual' as const
            }))
      }
    }

    setFinalists(finalistsList)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const participantId = active.id as string
    const position = parseInt(over.id as string) as 1 | 2 | 3

    const participant = finalists.find(f => f.id === participantId)
    if (!participant) return

    // Set winner for this position
    setWinners(prev => prev.map(w =>
      w.position === position
        ? {
            ...w,
            participantId: participant.id,
            participantName: participant.type === 'team' ? participant.team_name : participant.user_name,
            participantType: participant.type
          }
        : w
    ))

    toast.success(`${participant.team_name || participant.user_name} set as ${getPositionText(position)} place`)
  }

  const handleManualSelect = (position: 1 | 2 | 3, participantId: string) => {
    const participant = finalists.find(f => f.id === participantId)
    if (!participant) return

    setWinners(prev => prev.map(w =>
      w.position === position
        ? {
            ...w,
            participantId: participant.id,
            participantName: participant.type === 'team' ? participant.team_name : participant.user_name,
            participantType: participant.type
          }
        : w
    ))
  }

  const updatePoints = (position: 1 | 2 | 3, points: number) => {
    setWinners(prev => prev.map(w =>
      w.position === position ? { ...w, points } : w
    ))
  }

  const updatePrize = (position: 1 | 2 | 3, prize: string) => {
    setWinners(prev => prev.map(w =>
      w.position === position ? { ...w, prize } : w
    ))
  }

  const getPositionText = (position: number) => {
    switch (position) {
      case 1: return '1st'
      case 2: return '2nd'
      case 3: return '3rd'
      default: return `${position}th`
    }
  }

  const handleSave = async () => {
    setSaving(true)

    const validWinners = winners.filter(w => w.participantId)

    if (validWinners.length === 0) {
      toast.error("Please select at least one winner")
      setSaving(false)
      return
    }

    try {
      // Convert to results format
      const newResults: Result[] = validWinners.map(w => ({
        position: w.position,
        participant_id: w.participantType === 'team' ? undefined : w.participantId,
        team_id: w.participantType === 'team' ? w.participantId : undefined,
        points_awarded: w.points,
        prize: w.prize
      }))

      setResults(newResults)
      toast.success("Winners saved successfully")
    } catch (error) {
      console.error('Error saving winners:', error)
      toast.error('Failed to save winners')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Set Event Winners</h3>
          <p className="text-sm text-muted-foreground">
            Declare the final standings and winners
          </p>
        </div>

        {/* Instructions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Trophy className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium mb-2">How to set winners:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Drag finalists to podium positions OR use dropdown selectors</li>
                  <li>• Adjust points allocation for each position (optional)</li>
                  <li>• Add prize information (optional)</li>
                  <li>• At least 1st place must be selected</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finalists Pool */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Finalists ({finalists.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {finalists
                .filter(f => !winners.some(w => w.participantId === f.id))
                .map(finalist => (
                  <DraggableFinalist key={finalist.id} finalist={finalist} />
                ))}
            </div>
            {finalists.filter(f => !winners.some(w => w.participantId === f.id)).length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                All finalists have been assigned to podium positions
              </div>
            )}
          </CardContent>
        </Card>

        {/* Podium */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-center">🏆 Podium</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* 2nd Place */}
            <div className="md:order-1 md:mt-12">
              <PodiumPosition
                position={2}
                winner={winners[1]}
                color="silver"
                finalists={finalists}
                winners={winners}
                onChange={(participantId) => handleManualSelect(2, participantId)}
                onPointsChange={(points) => updatePoints(2, points)}
                onPrizeChange={(prize) => updatePrize(2, prize)}
              />
            </div>

            {/* 1st Place */}
            <div className="md:order-2">
              <PodiumPosition
                position={1}
                winner={winners[0]}
                color="gold"
                finalists={finalists}
                winners={winners}
                onChange={(participantId) => handleManualSelect(1, participantId)}
                onPointsChange={(points) => updatePoints(1, points)}
                onPrizeChange={(prize) => updatePrize(1, prize)}
              />
            </div>

            {/* 3rd Place */}
            <div className="md:order-3 md:mt-16">
              <PodiumPosition
                position={3}
                winner={winners[2]}
                color="bronze"
                finalists={finalists}
                winners={winners}
                onChange={(participantId) => handleManualSelect(3, participantId)}
                onPointsChange={(points) => updatePoints(3, points)}
                onPrizeChange={(prize) => updatePrize(3, prize)}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button onClick={handleSave} disabled={saving} className="px-8">
            {saving ? "Saving Winners..." : "Save Winners"}
            <Trophy className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </DndContext>
  )
}

// Progress Round Column Component (renamed to avoid conflicts)
interface ProgressRoundColumnProps {
  id: string
  title: string
  count: number
  participants: any[]
  color: 'gray' | 'blue' | 'red' | 'yellow'
}

function ProgressRoundColumn({ id, title, count, participants, color }: ProgressRoundColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  const colorClasses = {
    gray: 'border-gray-500/30 bg-gray-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    red: 'border-red-500/30 bg-red-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
  }

  return (
    <Card
      ref={setNodeRef}
      className={`min-w-[280px] h-[600px] flex flex-col ${colorClasses[color]} ${
        isOver ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="secondary">{count}</Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {participants.map((participant) => (
          <ProgressDraggableParticipant key={participant.id} participant={participant} />
        ))}

        {participants.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            No participants
          </div>
        )}
      </div>
    </Card>
  )
}

// Progress Draggable Participant Component (renamed to avoid conflicts)
interface ProgressDraggableParticipantProps {
  participant: any
}

function ProgressDraggableParticipant({ participant }: ProgressDraggableParticipantProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: participant.id,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-colors ${
        isDragging ? 'opacity-50 ring-2 ring-primary' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 text-muted-foreground">⋮⋮</div>
        {participant.type === 'team' ? (
          <Users className="h-4 w-4" />
        ) : (
          <Users className="h-4 w-4" />
        )}
        <span className="font-medium flex-1">
          {participant.type === 'team' ? participant.team_name : participant.user_name}
        </span>
      </div>

      {participant.type === 'team' && participant.members && (
        <div className="flex flex-wrap gap-1 mt-2">
          {participant.members.slice(0, 3).map((member: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {member}
            </Badge>
          ))}
          {participant.members.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{participant.members.length - 3}
            </Badge>
          )}
        </div>
      )}
    </Card>
  )
}

// Draggable Finalist Component
interface DraggableFinalistProps {
  finalist: any
}

function DraggableFinalist({ finalist }: DraggableFinalistProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: finalist.id,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-colors ${
        isDragging ? 'opacity-50 ring-2 ring-primary' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-2">
        {finalist.type === 'team' ? (
          <Users className="h-4 w-4" />
        ) : (
          <Users className="h-4 w-4" />
        )}
        <span className="font-medium text-sm">
          {finalist.type === 'team' ? finalist.team_name : finalist.user_name}
        </span>
      </div>

      {finalist.type === 'team' && finalist.members && (
        <div className="flex flex-wrap gap-1 mt-2">
          {finalist.members.slice(0, 2).map((member: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {member}
            </Badge>
          ))}
          {finalist.members.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{finalist.members.length - 2}
            </Badge>
          )}
        </div>
      )}
    </Card>
  )
}

// Podium Position Component
interface PodiumPositionProps {
  position: 1 | 2 | 3
  winner: any
  color: 'gold' | 'silver' | 'bronze'
  finalists: any[]
  winners: any[]
  onChange: (participantId: string) => void
  onPointsChange: (points: number) => void
  onPrizeChange: (prize: string) => void
}

function PodiumPosition({
  position,
  winner,
  color,
  finalists,
  winners,
  onChange,
  onPointsChange,
  onPrizeChange
}: PodiumPositionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: position.toString() })

  const colorClasses = {
    gold: 'border-yellow-500/50 bg-yellow-500/10',
    silver: 'border-gray-400/50 bg-gray-400/10',
    bronze: 'border-orange-600/50 bg-orange-600/10'
  }

  const getIcon = () => {
    switch (position) {
      case 1: return '👑'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '🏆'
    }
  }

  return (
    <Card
      ref={setNodeRef}
      className={`${colorClasses[color]} ${isOver ? 'ring-2 ring-primary' : ''}`}
    >
      <CardContent className="p-6 space-y-4">
        {/* Position Badge */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">{getIcon()}</span>
          <span className="text-xl font-bold">
            {position === 1 ? '1st' : position === 2 ? '2nd' : '3rd'} Place
          </span>
        </div>

        {/* Selected Winner or Dropzone */}
        {winner.participantId ? (
          <div className="p-3 rounded-lg border border-border bg-muted/20">
            <p className="font-medium text-center">{winner.participantName}</p>
            {winner.participantType === 'team' && (
              <Badge variant="secondary" className="mt-2">Team</Badge>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-lg border-2 border-dashed border-muted-foreground/30 text-center text-muted-foreground">
            Drag finalist here or select below
          </div>
        )}

        {/* Manual Selection Dropdown */}
        <div className="space-y-2">
          <Label>Select Winner</Label>
          <Select value={winner.participantId || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {finalists
                .filter(f => !winners.some(w => w.participantId === f.id && w.position !== position))
                .map(finalist => (
                  <SelectItem key={finalist.id} value={finalist.id}>
                    {finalist.type === 'team' ? finalist.team_name : finalist.user_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Points */}
        <div className="space-y-2">
          <Label>Points Awarded</Label>
          <Input
            type="number"
            value={winner.points}
            onChange={(e) => onPointsChange(parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>

        {/* Prize (Optional) */}
        <div className="space-y-2">
          <Label>Prize (Optional)</Label>
          <Input
            type="text"
            value={winner.prize || ''}
            onChange={(e) => onPrizeChange(e.target.value)}
            placeholder="e.g., Trophy, Gift Card"
          />
        </div>
      </CardContent>
    </Card>
  )
}