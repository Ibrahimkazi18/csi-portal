"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Users, Calendar as CalendarIcon, Edit, FileText, Settings } from "lucide-react"
import { ModernEditModal } from "@/components/ui/modern-modal"
import { ModernForm, FormSection } from "@/components/ui/modern-form"

const workshopSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title too long"),
  description: z.string().min(20, "Description must be at least 20 characters").max(5000, "Description too long"),
  banner_url: z.string().url().optional().or(z.literal("")),
  category: z.string().optional(),
  max_participants: z.number().int().min(1, "Must have at least 1 participant").max(500, "Too many participants"),
  meeting_link: z.string().url().optional().or(z.literal("")),
  status: z.string().optional(),
  registration_deadline: z.date({
    message: "Registration deadline is required"
  }),
  start_date: z.date({
    message: "Start date is required"
  }),
  end_date: z.date({
    message: "End date is required"
  }),
  hosts: z.array(z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    designation: z.string().optional(),
    profile_id: z.string().optional()
  })).min(1, "At least one host is required").max(10, "Too many hosts")
}).refine(data => data.registration_deadline < data.start_date, {
  message: "Registration deadline must be before start date",
  path: ["registration_deadline"]
}).refine(data => data.start_date <= data.end_date, {
  message: "End date must be after or equal to start date",
  path: ["end_date"]
})

type WorkshopFormData = z.infer<typeof workshopSchema>

interface EditWorkshopModalProps {
  workshop: any
  hosts: any[]
  onSuccess: () => void
  children: React.ReactNode
}

export function EditWorkshopModal({ workshop, hosts, onSuccess, children }: EditWorkshopModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<WorkshopFormData>({
    resolver: zodResolver(workshopSchema),
    defaultValues: {
      title: "",
      description: "",
      banner_url: "",
      category: "",
      max_participants: 50,
      meeting_link: "",
      status: "upcoming",
      registration_deadline: new Date(),
      start_date: new Date(),
      end_date: new Date(),
      hosts: [{ name: "", designation: "", profile_id: "" }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "hosts"
  })

  useEffect(() => {
    if (workshop && hosts) {
      form.reset({
        title: workshop.title || "",
        description: workshop.description || "",
        banner_url: workshop.banner_url || "",
        category: workshop.category || "",
        max_participants: workshop.max_participants || 50,
        meeting_link: workshop.meeting_link || "",
        status: workshop.status || "upcoming",
        registration_deadline: new Date(workshop.registration_deadline),
        start_date: new Date(workshop.start_date),
        end_date: new Date(workshop.end_date),
        hosts: hosts.length > 0 ? hosts.map(host => ({
          name: host.name || "",
          designation: host.designation || "",
          profile_id: host.profile_id || ""
        })) : [{ name: "", designation: "", profile_id: "" }]
      })
    }
  }, [workshop, hosts, form])

  const onSubmit = async (data: WorkshopFormData) => {
    setIsSubmitting(true)

    try {
      // Import the updateWorkshop function dynamically
      const { updateWorkshop } = await import("../../app/(dashboard)/core/workshops/[id]/actions")
      
      console.log('Updating workshop:', data)
      
      const response = await updateWorkshop(workshop.id, data)

      if (!response.success) {
        toast.error("Error Updating Workshop", { description: response.error })
        return
      }
      
      toast.success("Workshop Updated", {
        description: "Workshop updated successfully"
      })

      onSuccess()
    } catch (error: any) {
      console.error('Update error:', error)
      toast.error("Error Updating Workshop", {
        description: error.message || "Failed to update workshop"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  return (
    <ModernEditModal
      title="Edit Workshop"
      description="Update workshop details and hosts"
      icon={Edit}
      onSuccess={onSuccess}
      triggerElement={children}
      maxWidth="md:max-w-4xl"
    >
      {({ onSuccess: handleSuccess }) => (
        <ModernForm
          onSubmit={async (e) => {
            await form.handleSubmit(onSubmit)(e)
            handleSuccess()
          }}
          loading={isSubmitting}
          submitText="Update Workshop"
        >
          <FormSection title="Basic Details" icon={FileText}>
            <div className="space-y-2">
              <Label>Workshop Title *</Label>
              <Input
                {...form.register("title")}
                className="h-10 rounded-lg"
                placeholder="e.g., Introduction to Machine Learning"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                {...form.register("description")}
                className="rounded-lg resize-none"
                placeholder="Describe what participants will learn..."
                rows={4}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select onValueChange={(value) => form.setValue("category", value)} value={form.watch("category")}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                    <SelectItem value="Career">Career</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                    <SelectItem value="Industry">Industry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select onValueChange={(value) => form.setValue("status", value)} value={form.watch("status")}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="registration_open">Registration Open</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max Participants *</Label>
              <Input
                type="number"
                {...form.register("max_participants", { valueAsNumber: true })}
                className="h-10 rounded-lg"
                min={1}
                max={500}
              />
              {form.formState.errors.max_participants && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.max_participants.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Banner Image URL (Optional)</Label>
              <Input
                {...form.register("banner_url")}
                className="h-10 rounded-lg"
                placeholder="https://example.com/banner.jpg"
              />
              {form.formState.errors.banner_url && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.banner_url.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Meeting Link (Optional)</Label>
              <Input
                {...form.register("meeting_link")}
                className="h-10 rounded-lg"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
              {form.formState.errors.meeting_link && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.meeting_link.message}
                </p>
              )}
            </div>
          </FormSection>

          <FormSection title="Schedule" icon={CalendarIcon}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Registration Deadline *</Label>
                <Input
                  type="datetime-local"
                  {...form.register("registration_deadline", {
                    setValueAs: (v) => v ? new Date(v) : undefined
                  })}
                  className="h-10 rounded-lg"
                  defaultValue={formatDateTimeLocal(form.getValues("registration_deadline"))}
                />
                {form.formState.errors.registration_deadline && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.registration_deadline.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Start Date & Time *</Label>
                <Input
                  type="datetime-local"
                  {...form.register("start_date", {
                    setValueAs: (v) => v ? new Date(v) : undefined
                  })}
                  className="h-10 rounded-lg"
                  defaultValue={formatDateTimeLocal(form.getValues("start_date"))}
                />
                {form.formState.errors.start_date && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.start_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>End Date & Time *</Label>
                <Input
                  type="datetime-local"
                  {...form.register("end_date", {
                    setValueAs: (v) => v ? new Date(v) : undefined
                  })}
                  className="h-10 rounded-lg"
                  defaultValue={formatDateTimeLocal(form.getValues("end_date"))}
                />
                {form.formState.errors.end_date && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.end_date.message}
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          <FormSection title="Hosts/Speakers" icon={Users}>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-3 bg-muted/20">
                  <div className="flex justify-between items-center">
                    <Label>Host {index + 1}</Label>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        {...form.register(`hosts.${index}.name`)}
                        className="h-10 rounded-lg"
                        placeholder="Speaker name"
                      />
                      {form.formState.errors.hosts?.[index]?.name && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.hosts[index]?.name?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Designation (Optional)</Label>
                      <Input
                        {...form.register(`hosts.${index}.designation`)}
                        className="h-10 rounded-lg"
                        placeholder="e.g., AI Researcher"
                      />
                    </div>

                    <div className="col-span-full space-y-2">
                      <Label>CSI Member (Optional)</Label>
                      <select
                        {...form.register(`hosts.${index}.profile_id`)}
                        className="w-full h-10 px-3 py-2 bg-input border border-border rounded-lg"
                      >
                        <option value="">Not a CSI member</option>
                        {/* TODO: Populate with CSI members */}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => append({ name: "", designation: "", profile_id: "" })}
                className="w-full h-10 rounded-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Host
              </Button>

              {form.formState.errors.hosts && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.hosts.message}
                </p>
              )}
            </div>
          </FormSection>
        </ModernForm>
      )}
    </ModernEditModal>
  )
}