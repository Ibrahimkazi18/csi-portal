"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Check, Loader2, Users, Trophy, FileText, Target, Trash2, Search, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createComprehensiveManualEvent, getAvailableMembers } from "@/app/actions/manual-events"

const steps = [
  { id: "basic", title: "Basic Info", icon: FileText },
  { id: "config", title: "Configuration", icon: Target },
  { id: "participants", title: "Participants", icon: Users },
  { id: "results", title: "Results", icon: Trophy },
]

interface FormData {
  // Basic Info
  title: string
  description: string
  category: string
  mode: "event" | "workshop"
  type: "individual" | "team"
  banner_url: string
  meeting_link: string
  
  // Configuration
  registration_deadline: string
  start_date: string
  end_date: string
  completed_at: string
  venue: string
  duration: number
  max_participants: number
  team_size: number
  is_tournament: boolean
  
  // Participants
  participants: Array<{ id: string; name: string; email: string; attended: boolean }>
  teams: Array<{ id: string; name: string; members: Array<{ id: string; name: string; email: string }>; attended: boolean }>
  
  // Results
  winners: Array<{ position: number; participant_id: string; participant_name: string }>
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

interface SimpleManualEventFormProps {
  onComplete?: () => void
  eventId?: string
}

export function SimpleManualEventForm({ onComplete, eventId }: SimpleManualEventFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(!!eventId)
  const [availableMembers, setAvailableMembers] = useState<any[]>([])
  const [memberSearchQuery, setMemberSearchQuery] = useState("")
  const [showMemberList, setShowMemberList] = useState(false)
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "",
    mode: "event",
    type: "individual",
    banner_url: "",
    meeting_link: "",
    registration_deadline: "",
    start_date: "",
    end_date: "",
    completed_at: "",
    venue: "",
    duration: 60,
    max_participants: 50,
    team_size: 2,
    is_tournament: false,
    participants: [],
    teams: [],
    winners: [],
  })

  // Load event data if editing
  useEffect(() => {
    if (eventId) {
      loadEventData()
    }
  }, [eventId])

  const loadEventData = async () => {
    setIsLoading(true)
    try {
      const { getManualEventDetails } = await import("@/app/actions/manual-events")
      const result = await getManualEventDetails(eventId!)
      
      if (result.success && result.data) {
        const event = result.data.event
        const registrations = result.data.registrations || []
        
        // Populate form with event data
        setFormData({
          title: event.title || "",
          description: event.description || "",
          category: event.category || "",
          mode: event.mode || "event",
          type: event.type || "individual",
          banner_url: event.banner_url || "",
          meeting_link: event.meeting_link || "",
          registration_deadline: event.registration_deadline || "",
          start_date: event.start_date || "",
          end_date: event.end_date || "",
          completed_at: event.completed_at || event.end_date || "",
          venue: event.venue || "",
          duration: event.duration || 60,
          max_participants: event.max_participants || 50,
          team_size: event.team_size || 2,
          is_tournament: event.is_tournament || false,
          participants: event.type === "individual" 
            ? registrations
                .filter((r: any) => r.registration_type === "individual")
                .map((r: any) => ({
                  id: r.user_id || `temp-${Date.now()}`,
                  name: r.profiles?.full_name || "",
                  email: r.profiles?.email || "",
                  attended: true
                }))
            : [],
          teams: event.type === "team"
            ? registrations
                .filter((r: any) => r.registration_type === "team" && r.teams)
                .map((r: any) => ({
                  id: r.teams.id,
                  name: r.teams.name,
                  members: r.teams.team_members?.map((tm: any) => ({
                    id: tm.member_id,
                    name: tm.profiles?.full_name || "",
                    email: tm.profiles?.email || ""
                  })) || [],
                  attended: true
                }))
            : [],
          winners: result.data.winners?.map((w: any) => ({
            position: w.position,
            participant_id: w.user_id || "",
            participant_name: w.profiles?.full_name || w.teams?.name || "",
          })) || [],
        })
      } else {
        toast.error("Failed to load event data")
      }
    } catch (error) {
      console.error("Error loading event:", error)
      toast.error("Failed to load event data")
    } finally {
      setIsLoading(false)
    }
  }

  // Load available members
  useEffect(() => {
    const fetchMembers = async () => {
      const result = await getAvailableMembers()
      if (result.success && result.members) {
        setAvailableMembers(result.members)
      }
    }
    fetchMembers()
  }, [])

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addParticipant = () => {
    setFormData((prev) => ({
      ...prev,
      participants: [...prev.participants, { id: `temp-${Date.now()}`, name: "", email: "", attended: false }],
    }))
  }

  const removeParticipant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index),
    }))
  }

  const updateParticipant = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }))
  }

  const addMemberToParticipants = (member: any) => {
    const participant = {
      id: member.id,
      name: member.full_name,
      email: member.email,
      attended: true
    }
    
    setFormData((prev) => ({
      ...prev,
      participants: [...prev.participants, participant]
    }))
    
    setMemberSearchQuery("")
    setShowMemberList(false)
    toast.success("Member added")
  }

  const addTeam = () => {
    const newTeam = { 
      id: `temp-${Date.now()}`, 
      name: "", 
      members: [], 
      attended: true 
    }
    setFormData((prev) => ({
      ...prev,
      teams: [...prev.teams, newTeam],
    }))
  }

  const removeTeam = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      teams: prev.teams.filter((_, i) => i !== index),
    }))
  }

  const updateTeam = (teamIndex: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      teams: prev.teams.map((t, i) =>
        i === teamIndex ? { ...t, [field]: value } : t
      ),
    }))
  }

  const addTeamMember = (teamIndex: number) => {
    const team = formData.teams[teamIndex]
    if (team.members.length >= formData.team_size) {
      toast.error(`Team can only have ${formData.team_size} members`)
      return
    }
    
    setFormData((prev) => ({
      ...prev,
      teams: prev.teams.map((t, i) =>
        i === teamIndex
          ? { ...t, members: [...t.members, { id: `temp-${Date.now()}`, name: "", email: "" }] }
          : t
      ),
    }))
  }

  const addMemberToTeam = (teamIndex: number, member: any) => {
    const team = formData.teams[teamIndex]
    if (team.members.length >= formData.team_size) {
      toast.error(`Team can only have ${formData.team_size} members`)
      return
    }

    // Check if member is already in this team
    if (team.members.some(m => m.id === member.id)) {
      toast.error("Member already in this team")
      return
    }

    // Check if member is in any other team
    if (formData.teams.some((t, i) => i !== teamIndex && t.members.some(m => m.id === member.id))) {
      toast.error("Member already in another team")
      return
    }

    const newMember = {
      id: member.id,
      name: member.full_name,
      email: member.email
    }

    setFormData((prev) => ({
      ...prev,
      teams: prev.teams.map((t, i) =>
        i === teamIndex
          ? { ...t, members: [...t.members, newMember] }
          : t
      ),
    }))

    setMemberSearchQuery("")
    setShowMemberList(false)
    setCurrentTeamIndex(null)
    toast.success("Member added to team")
  }

  const removeTeamMember = (teamIndex: number, memberIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      teams: prev.teams.map((t, i) =>
        i === teamIndex
          ? { ...t, members: t.members.filter((_, mi) => mi !== memberIndex) }
          : t
      ),
    }))
  }

  const updateTeamMember = (teamIndex: number, memberIndex: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      teams: prev.teams.map((t, i) =>
        i === teamIndex
          ? {
              ...t,
              members: t.members.map((m, mi) =>
                mi === memberIndex ? { ...m, [field]: value } : m
              ),
            }
          : t
      ),
    }))
  }

  const filteredMembers = availableMembers.filter(member => {
    const searchMatch = member.full_name?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                       member.email?.toLowerCase().includes(memberSearchQuery.toLowerCase())
    
    if (formData.type === "individual") {
      // Exclude members already in participants
      const notInParticipants = !formData.participants.some(p => p.id === member.id)
      return searchMatch && notInParticipants
    } else {
      // Exclude members already in any team
      const notInTeams = !formData.teams.some(team => 
        team.members.some(m => m.id === member.id)
      )
      return searchMatch && notInTeams
    }
  })

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      if (eventId) {
        // Update existing event
        const { updateManualEvent } = await import("@/app/actions/manual-events")
        const result = await updateManualEvent(eventId, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          mode: formData.mode,
          type: formData.type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          max_participants: formData.max_participants,
          team_size: formData.type === "team" ? formData.team_size : 1,
          is_tournament: formData.is_tournament,
          duration: formData.duration,
          meeting_link: formData.meeting_link || "",
          registration_deadline: formData.registration_deadline || "",
        })
        
        if (result.success) {
          toast.success("Manual event updated successfully!")
          onComplete?.()
        } else {
          throw new Error(result.error || "Failed to update event")
        }
      } else {
        // Create new event
        const submissionData = {
          eventData: {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            mode: formData.mode,
            type: formData.type,
            start_date: formData.start_date,
            end_date: formData.end_date,
            max_participants: formData.max_participants,
            team_size: formData.type === "team" ? formData.team_size : 1,
            is_tournament: formData.is_tournament,
            duration: formData.duration,
            meeting_link: formData.meeting_link || "",
            registration_deadline: formData.registration_deadline || "",
          },
          participants: formData.type === "individual" && formData.participants.length > 0 
            ? formData.participants.map(p => ({
                email: p.email,
                name: p.name,
                role: "Student"
              }))
            : undefined,
          teams: formData.type === "team" && formData.teams.length > 0
            ? formData.teams.map(t => ({
                name: t.name,
                members: t.members.map(m => ({
                  email: m.email,
                  name: m.name,
                  role: "Student"
                }))
              }))
            : undefined,
          winners: formData.winners.length > 0 
            ? formData.winners.map(w => ({
                position: w.position,
                team_id: formData.type === "team" ? w.participant_id : undefined,
                user_id: formData.type === "individual" ? w.participant_id : undefined,
              }))
            : undefined,
        }

        const result = await createComprehensiveManualEvent(submissionData)
        
        if (result.success) {
          toast.success("Manual event created successfully!")
          onComplete?.()
        } else {
          throw new Error(result.error || "Failed to create event")
        }
      }
    } catch (error: any) {
      console.error("Failed to save manual event:", error)
      toast.error("Error", {
        description: error.message || "Failed to save manual event. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          formData.title.trim() !== "" &&
          formData.description.trim() !== "" &&
          formData.category.trim() !== ""
        )
      case 1: // Configuration
        return (
          formData.start_date !== "" &&
          formData.end_date !== "" &&
          formData.max_participants > 0
        )
      case 2: // Participants
        if (formData.type === "individual") {
          return formData.participants.length > 0 && formData.participants.every(p => p.name.trim() !== "" && p.email.trim() !== "")
        } else {
          return formData.teams.length > 0 && formData.teams.every(t => 
            t.name.trim() !== "" && 
            t.members.length === formData.team_size &&
            t.members.every(m => m.name.trim() !== "" && m.email.trim() !== "")
          )
        }
      case 3: // Results
        return true // Optional
      default:
        return true
    }
  }

  const StepIcon = steps[currentStep].icon

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="border shadow-md rounded-3xl">
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">Loading event data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      {eventId && (
        <div className="mb-4">
          <Badge variant="outline" className="text-sm">
            Editing Event
          </Badge>
        </div>
      )}
      
      {/* Progress indicator */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={index}
                className="flex flex-col items-center flex-1"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  className={cn(
                    "w-12 h-12 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center",
                    index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  )}
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index)
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                <motion.span
                  className={cn(
                    "text-xs mt-2 text-center",
                    index === currentStep
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </motion.span>
              </motion.div>
            )
          })}
        </div>
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-4">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border shadow-md rounded-3xl overflow-hidden">
          <div key={currentStep}>
              {/* Step 1: Basic Info */}
              {currentStep === 0 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>
                      Let's start with the essential details about your event
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="title">Event Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Annual Coding Competition 2024"
                        value={formData.title}
                        onChange={(e) => updateFormData("title", e.target.value)}
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      />
                    </motion.div>

                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what happened at this event..."
                        value={formData.description}
                        onChange={(e) => updateFormData("description", e.target.value)}
                        className="min-h-[100px] transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      />
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => updateFormData("category", value)}
                        >
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
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="mode">Mode *</Label>
                        <Select
                          value={formData.mode}
                          onValueChange={(value: "event" | "workshop") => updateFormData("mode", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="workshop">Workshop</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    </div>

                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label>Event Type *</Label>
                      <RadioGroup
                        value={formData.type}
                        onValueChange={(value: "individual" | "team") => updateFormData("type", value)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent flex-1">
                          <RadioGroupItem value="individual" id="individual" />
                          <Label htmlFor="individual" className="cursor-pointer flex-1">
                            Individual
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent flex-1">
                          <RadioGroupItem value="team" id="team" />
                          <Label htmlFor="team" className="cursor-pointer flex-1">
                            Team
                          </Label>
                        </div>
                      </RadioGroup>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="flex items-center space-x-2">
                      <Checkbox
                        id="is_tournament"
                        checked={formData.is_tournament}
                        onCheckedChange={(checked) => updateFormData("is_tournament", checked)}
                      />
                      <Label htmlFor="is_tournament" className="cursor-pointer">
                        This is a tournament event
                      </Label>
                    </motion.div>
                  </CardContent>
                </>
              )}

              {/* Step 2: Configuration */}
              {currentStep === 1 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Event Configuration
                    </CardTitle>
                    <CardDescription>
                      Set up dates, venue, and capacity details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Event Dates (All must be in the past)</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="registration_deadline">Registration Deadline</Label>
                          <Input
                            id="registration_deadline"
                            type="datetime-local"
                            value={formData.registration_deadline}
                            onChange={(e) => updateFormData("registration_deadline", e.target.value)}
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                          />
                        </motion.div>

                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="start_date">Start Date *</Label>
                          <Input
                            id="start_date"
                            type="datetime-local"
                            value={formData.start_date}
                            onChange={(e) => updateFormData("start_date", e.target.value)}
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                          />
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="end_date">End Date *</Label>
                          <Input
                            id="end_date"
                            type="datetime-local"
                            value={formData.end_date}
                            onChange={(e) => updateFormData("end_date", e.target.value)}
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                          />
                        </motion.div>

                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="completed_at">Completion Date</Label>
                          <Input
                            id="completed_at"
                            type="datetime-local"
                            value={formData.completed_at}
                            onChange={(e) => updateFormData("completed_at", e.target.value)}
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                          />
                          <p className="text-xs text-muted-foreground">
                            When the event was actually completed (same as end date or later)
                          </p>
                        </motion.div>
                      </div>
                    </div>

                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="venue">Venue</Label>
                      <Input
                        id="venue"
                        placeholder="e.g., Main Auditorium, Room 301"
                        value={formData.venue}
                        onChange={(e) => updateFormData("venue", e.target.value)}
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      />
                    </motion.div>

                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="meeting_link">Meeting Link (Optional)</Label>
                      <Input
                        id="meeting_link"
                        type="url"
                        placeholder="https://meet.google.com/..."
                        value={formData.meeting_link}
                        onChange={(e) => updateFormData("meeting_link", e.target.value)}
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      />
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          value={formData.duration}
                          onChange={(e) => updateFormData("duration", parseInt(e.target.value) || 60)}
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                        />
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="max_participants">Max Participants *</Label>
                        <Input
                          id="max_participants"
                          type="number"
                          min="1"
                          value={formData.max_participants}
                          onChange={(e) => updateFormData("max_participants", parseInt(e.target.value) || 50)}
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                        />
                      </motion.div>
                    </div>

                    {formData.type === "team" && (
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="team_size">Team Size *</Label>
                        <Input
                          id="team_size"
                          type="number"
                          min="2"
                          value={formData.team_size}
                          onChange={(e) => updateFormData("team_size", parseInt(e.target.value) || 2)}
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                        />
                        <p className="text-xs text-muted-foreground">
                          Each team must have exactly {formData.team_size} members
                        </p>
                      </motion.div>
                    )}
                  </CardContent>
                </>
              )}

              {/* Step 3: Participants */}
              {currentStep === 2 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {formData.type === "individual" ? "Participants" : "Teams"}
                    </CardTitle>
                    <CardDescription>
                      Add {formData.type === "individual" ? "participants" : "teams"} who attended this event
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                    {formData.type === "individual" ? (
                      <>
                        {/* Member Search for Individual */}
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label>Search Members</Label>
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
                            />
                          </div>
                          
                          {showMemberList && memberSearchQuery && (
                            <div className="border rounded-lg max-h-48 overflow-y-auto bg-card">
                              {filteredMembers.length > 0 ? (
                                <div className="p-2">
                                  {filteredMembers.slice(0, 8).map((member) => (
                                    <div
                                      key={member.id}
                                      className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer"
                                      onClick={() => addMemberToParticipants(member)}
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
                        </motion.div>

                        {formData.participants.map((participant, index) => (
                          <motion.div
                            key={index}
                            variants={fadeInUp}
                            className="p-4 border rounded-lg space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Participant {index + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeParticipant(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Name *</Label>
                                <Input
                                  placeholder="Full name"
                                  value={participant.name}
                                  onChange={(e) => updateParticipant(index, "name", e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Email *</Label>
                                <Input
                                  type="email"
                                  placeholder="email@example.com"
                                  value={participant.email}
                                  onChange={(e) => updateParticipant(index, "email", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`attended-${index}`}
                                checked={participant.attended}
                                onCheckedChange={(checked) => updateParticipant(index, "attended", checked)}
                              />
                              <Label htmlFor={`attended-${index}`} className="cursor-pointer">
                                Attended
                              </Label>
                            </div>
                          </motion.div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addParticipant}
                          className="w-full"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Add Participant Manually
                        </Button>
                      </>
                    ) : (
                      <>
                        {formData.teams.map((team, teamIndex) => (
                          <motion.div
                            key={teamIndex}
                            variants={fadeInUp}
                            className="p-4 border rounded-lg space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Team {teamIndex + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTeam(teamIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <Label>Team Name *</Label>
                              <Input
                                placeholder="Team name"
                                value={team.name}
                                onChange={(e) => updateTeam(teamIndex, "name", e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Team Members ({team.members.length}/{formData.team_size})</Label>
                                {team.members.length < formData.team_size && (
                                  <Badge variant="secondary" className="text-xs">
                                    Need {formData.team_size - team.members.length} more
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Member Search for this team */}
                              {team.members.length < formData.team_size && (
                                <div className="relative">
                                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search members to add..."
                                    value={currentTeamIndex === teamIndex ? memberSearchQuery : ""}
                                    onChange={(e) => {
                                      setCurrentTeamIndex(teamIndex)
                                      setMemberSearchQuery(e.target.value)
                                      setShowMemberList(e.target.value.length > 0)
                                    }}
                                    onFocus={() => setCurrentTeamIndex(teamIndex)}
                                    className="pl-10"
                                  />
                                  
                                  {showMemberList && currentTeamIndex === teamIndex && memberSearchQuery && (
                                    <div className="absolute z-10 w-full mt-1 border rounded-lg max-h-48 overflow-y-auto bg-card shadow-lg">
                                      {filteredMembers.length > 0 ? (
                                        <div className="p-2">
                                          {filteredMembers.slice(0, 8).map((member) => (
                                            <div
                                              key={member.id}
                                              className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer"
                                              onClick={() => addMemberToTeam(teamIndex, member)}
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
                                </div>
                              )}
                              
                              {team.members.map((member, memberIndex) => (
                                <div key={memberIndex} className="flex gap-2 items-start">
                                  <Input
                                    placeholder="Member name *"
                                    value={member.name}
                                    onChange={(e) => updateTeamMember(teamIndex, memberIndex, "name", e.target.value)}
                                    className="flex-1"
                                  />
                                  <Input
                                    type="email"
                                    placeholder="Email *"
                                    value={member.email}
                                    onChange={(e) => updateTeamMember(teamIndex, memberIndex, "email", e.target.value)}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTeamMember(teamIndex, memberIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              {team.members.length < formData.team_size && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addTeamMember(teamIndex)}
                                  className="w-full"
                                >
                                  Add Member Manually
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addTeam}
                          className="w-full"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Add Team
                        </Button>
                      </>
                    )}
                  </CardContent>
                </>
              )}

              {/* Step 4: Results */}
              {currentStep === 3 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Event Results
                    </CardTitle>
                    <CardDescription>
                      Set winners and final results (optional - can be added later)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Instructions */}
                    <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
                      <Trophy className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Set the top 3 winners:</p>
                        <ul className="text-muted-foreground space-y-1">
                          <li>• Select winners from the dropdown for each position</li>
                          <li>• At least 1st place should be selected for finalized events</li>
                          <li>• You can skip this and add results later from the event page</li>
                        </ul>
                      </div>
                    </div>

                    {/* Winner Selection */}
                    {(formData.participants.length > 0 || formData.teams.length > 0) ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((position) => {
                          const currentWinner = formData.winners.find(w => w.position === position)
                          const availableOptions = formData.type === "individual" 
                            ? formData.participants.filter(p => 
                                !formData.winners.some(w => w.participant_id === p.id && w.position !== position)
                              )
                            : formData.teams.filter(t => 
                                !formData.winners.some(w => w.participant_id === t.id && w.position !== position)
                              )

                          return (
                            <motion.div
                              key={position}
                              variants={fadeInUp}
                              className={cn(
                                "p-4 border-2 rounded-lg",
                                position === 1 && "border-yellow-500/50 bg-yellow-500/5",
                                position === 2 && "border-gray-400/50 bg-gray-400/5",
                                position === 3 && "border-orange-600/50 bg-orange-600/5"
                              )}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className={cn(
                                  "flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg",
                                  position === 1 && "bg-yellow-500 text-yellow-950",
                                  position === 2 && "bg-gray-400 text-gray-950",
                                  position === 3 && "bg-orange-600 text-orange-950"
                                )}>
                                  {position}
                                </div>
                                <div>
                                  <h4 className="font-semibold">
                                    {position === 1 && "1st Place - Winner"}
                                    {position === 2 && "2nd Place - Runner Up"}
                                    {position === 3 && "3rd Place"}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {position === 1 ? "Required for finalized events" : "Optional"}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>
                                  Select {formData.type === "individual" ? "Participant" : "Team"}
                                </Label>
                                <Select
                                  value={currentWinner?.participant_id || undefined}
                                  onValueChange={(value) => {
                                    if (value === "none") {
                                      // Remove winner
                                      setFormData(prev => ({
                                        ...prev,
                                        winners: prev.winners.filter(w => w.position !== position)
                                      }))
                                    } else {
                                      // Add or update winner
                                      const selected = formData.type === "individual"
                                        ? formData.participants.find(p => p.id === value)
                                        : formData.teams.find(t => t.id === value)
                                      
                                      if (selected) {
                                        setFormData(prev => ({
                                          ...prev,
                                          winners: [
                                            ...prev.winners.filter(w => w.position !== position),
                                            {
                                              position,
                                              participant_id: value,
                                              participant_name: formData.type === "individual" 
                                                ? (selected as any).name 
                                                : (selected as any).name
                                            }
                                          ]
                                        }))
                                      }
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={`Select ${position === 1 ? "winner" : "position"}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {availableOptions.map((option: any) => (
                                      <SelectItem key={option.id} value={option.id}>
                                        {option.name}
                                        {formData.type === "team" && option.members.length > 0 && (
                                          <span className="text-xs text-muted-foreground ml-2">
                                            ({option.members.length} members)
                                          </span>
                                        )}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {currentWinner && (
                                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                                    <p className="text-sm font-medium">{currentWinner.participant_name}</p>
                                    {formData.type === "team" && (
                                      <div className="mt-2">
                                        <p className="text-xs text-muted-foreground mb-1">Team Members:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {formData.teams
                                            .find(t => t.id === currentWinner.participant_id)
                                            ?.members.map((member, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-xs">
                                                {member.name}
                                              </Badge>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="text-sm font-medium mb-2">No Participants Added Yet</p>
                        <p className="text-xs">
                          Go back to Step 3 to add {formData.type === "individual" ? "participants" : "teams"} before setting winners
                        </p>
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </div>

          <CardFooter className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>

            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>

            <Button
              type="button"
              onClick={currentStep === steps.length - 1 ? handleSubmit : nextStep}
              disabled={!isStepValid() || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {eventId ? "Updating..." : "Submitting..."}
                </>
              ) : (
                <>
                  {currentStep === steps.length - 1 ? (eventId ? "Update" : "Submit") : "Next"}
                  {currentStep === steps.length - 1 ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
