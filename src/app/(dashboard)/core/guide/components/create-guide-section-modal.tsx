"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Trash2, BookOpen, PlusIcon, FileText, Settings } from "lucide-react"
import { createGuideSection } from "../actions"
import { iconMap } from "../constants"
import { ModernCreateModal } from "@/components/ui/modern-modal"
import { ModernForm, FormSection } from "@/components/ui/modern-form"

interface CreateGuideSectionModalProps {
  onSuccess: () => void
}

export function CreateGuideSectionModal({ onSuccess }: CreateGuideSectionModalProps) {
  const [title, setTitle] = useState("")
  const [order, setOrder] = useState(0)
  const [icon, setIcon] = useState("")
  const [contentItems, setContentItems] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)

  const availableIcons = Object.entries(iconMap).map(([key, IconComponent]) => ({
    value: key,
    label: key.replace(/([A-Z])/g, " $1").trim(), 
    icon: <IconComponent className="w-4 h-4 mr-2" />,
  }));

  const handleAddContentItem = () => {
    setContentItems([...contentItems, ""])
  }

  const handleRemoveContentItem = (index: number) => {
    setContentItems(contentItems.filter((_, i) => i !== index))
  }

  const handleContentItemChange = (index: number, value: string) => {
    const newItems = [...contentItems]
    newItems[index] = value
    setContentItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!title || !icon || contentItems.filter((item) => item.trim()).length === 0) {
      toast.error("Missing Information", {
        description: "Please fill in all required fields.",
      })
      setLoading(false)
      return
    }

    try {
      const filteredContent = contentItems.filter((item) => item.trim())
      const response = await createGuideSection({
        title,
        icon,
        content: filteredContent,
        order,
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      toast.success("Section Created", {
        description: `${title} has been added to the guide.`,
      })

      // Reset form
      setTitle("")
      setIcon("")
      setContentItems([""])
      setOrder(0)
      onSuccess()
    } catch (error: any) {
      toast.error("Error Creating Section", {
        description: error.message || "Failed to create section.",
      })
    } finally {
      setLoading(false)
    }
  }

  const triggerButton = (
    <Button>
      <PlusIcon className="mr-1 size-4" />
      Add Section
    </Button>
  )

  return (
    <ModernCreateModal
      title="Create New Guide Section"
      description="Add a new section to the CSI guide with title, icon, and content items"
      icon={BookOpen}
      onSuccess={onSuccess}
      triggerButton={triggerButton}
    >
      {({ onSuccess: handleSuccess }) => (
        <ModernForm
          onSubmit={(e) => {
            handleSubmit(e).then(() => handleSuccess())
          }}
          loading={loading}
          submitText="Create Section"
        >
          <FormSection title="Basic Information" icon={FileText}>
            <div className="space-y-2">
              <Label htmlFor="title">Section Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 rounded-lg"
                placeholder="e.g., Community Guidelines"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon *</Label>
                <Select value={icon} onValueChange={setIcon} required>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {availableIcons.map((iconOption) => (
                      <SelectItem key={iconOption.value} value={iconOption.value}>
                        <div className="flex items-center">
                          {iconOption.icon}
                          <span>{iconOption.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Display Order *</Label>
                <Input
                  id="order"
                  type="number"
                  min={0}
                  placeholder="e.g., 1, 2, 3..."
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="h-10 rounded-lg"
                  required
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Content Items" icon={Settings}>
            <div className="space-y-3">
              {contentItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={item}
                    onChange={(e) => handleContentItemChange(index, e.target.value)}
                    className="rounded-lg resize-none"
                    placeholder={`Content item ${index + 1}`}
                    rows={2}
                  />
                  {contentItems.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveContentItem(index)}
                      className="px-2 h-10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddContentItem} 
                className="w-full h-10 rounded-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Content Item
              </Button>
            </div>
          </FormSection>
        </ModernForm>
      )}
    </ModernCreateModal>
  )
}
