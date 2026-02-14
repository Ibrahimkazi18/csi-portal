"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Upload, Users, Calendar as CalendarIcon, ArrowLeft } from "lucide-react"
import * as workshopActions from "./actions"
import Link from "next/link"
import Preloader from "@/components/ui/preloader"

const workshopSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title too long"),
  description: z.string().min(20, "Description must be at least 20 characters").max(5000, "Description too long"),
  banner_url: z.string().url().optional().or(z.literal("")),
  category: z.string().optional(),
  max_participants: z.number().int().min(1, "Must have at least 1 participant").max(500, "Too many participants"),
  meeting_link: z.string().url().optional().or(z.literal("")),
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
}).refine(data => data.start_date > new Date(), {
  message: "Start date must be in the future",
  path: ["start_date"]
})

type WorkshopFormData = z.infer<typeof workshopSchema>

export default function CreateWorkshopPage() {
  const router = useRouter()

  const [showPreloader, setShowPreloader] = useState(true)
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
      registration_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
      hosts: [{ name: "", designation: "", profile_id: "" }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "hosts"
  })

  const onSubmit = async (data: WorkshopFormData) => {
    setIsSubmitting(true)

    try {
      console.log('Submitting workshop data:', data)
      console.log('Hosts data:', data.hosts)
      
      const response = await workshopActions.createWorkshop(data)

      if (!response.success) {
        toast.error("Error", { description: response.error })
        return
      }

      toast.success("Success", {
        description: "Workshop created successfully"
      })

      router.push(`/core/workshops/${response.data.id}`)
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error("Error", {
        description: error.message || "Failed to create workshop"
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/core/workshops">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workshops
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Workshop</h1>
          <p className="text-muted-foreground mt-2">
            Create a new educational workshop or seminar
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Details */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Workshop Title *</Label>
              <Input
                {...form.register("title")}
                placeholder="e.g., Introduction to Machine Learning"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                {...form.register("description")}
                placeholder="Describe what participants will learn..."
                rows={5}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select onValueChange={(value) => form.setValue("category", value)}>
                  <SelectTrigger>
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

              <div>
                <Label>Max Participants *</Label>
                <Input
                  type="number"
                  {...form.register("max_participants", { valueAsNumber: true })}
                  min={1}
                  max={500}
                />
                {form.formState.errors.max_participants && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.max_participants.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Banner Image URL (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  {...form.register("banner_url")}
                  placeholder="https://example.com/banner.jpg"
                />
                <Button type="button" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
              {form.formState.errors.banner_url && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.banner_url.message}
                </p>
              )}
            </div>

            <div>
              <Label>Meeting Link (Optional - for virtual workshops)</Label>
              <Input
                {...form.register("meeting_link")}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
              {form.formState.errors.meeting_link && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.meeting_link.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Registration Deadline *</Label>
                <Input
                  type="datetime-local"
                  {...form.register("registration_deadline", {
                    setValueAs: (v) => v ? new Date(v) : undefined
                  })}
                  defaultValue={formatDateTimeLocal(form.getValues("registration_deadline"))}
                />
                {form.formState.errors.registration_deadline && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.registration_deadline.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Start Date & Time *</Label>
                <Input
                  type="datetime-local"
                  {...form.register("start_date", {
                    setValueAs: (v) => v ? new Date(v) : undefined
                  })}
                  defaultValue={formatDateTimeLocal(form.getValues("start_date"))}
                />
                {form.formState.errors.start_date && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.start_date.message}
                  </p>
                )}
              </div>

              <div>
                <Label>End Date & Time *</Label>
                <Input
                  type="datetime-local"
                  {...form.register("end_date", {
                    setValueAs: (v) => v ? new Date(v) : undefined
                  })}
                  defaultValue={formatDateTimeLocal(form.getValues("end_date"))}
                />
                {form.formState.errors.end_date && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.end_date.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hosts/Speakers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Hosts/Speakers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-3">
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      {...form.register(`hosts.${index}.name`)}
                      placeholder="Speaker name"
                    />
                    {form.formState.errors.hosts?.[index]?.name && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.hosts[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Designation (Optional)</Label>
                    <Input
                      {...form.register(`hosts.${index}.designation`)}
                      placeholder="e.g., AI Researcher"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>CSI Member (Optional)</Label>
                    <select
                      {...form.register(`hosts.${index}.profile_id`)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md"
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
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Host
            </Button>

            {form.formState.errors.hosts && (
              <p className="text-sm text-destructive">
                {form.formState.errors.hosts.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Workshop"}
          </Button>
        </div>
      </form>
    </div>
  )
}