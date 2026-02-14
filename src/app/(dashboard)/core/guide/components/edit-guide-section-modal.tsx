"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateGuideSection } from "../actions"
import { toast } from "sonner"
import { Plus, Trash2, Edit, FileText, Settings } from "lucide-react"
import { iconMap } from "../constants"
import { ModernEditModal } from "@/components/ui/modern-modal"
import { ModernForm, FormSection } from "@/components/ui/modern-form"

interface EditGuideSectionModalProps {
  section: any
  onSuccess: () => void
  children: React.ReactNode
}

export function EditGuideSectionModal({ section, onSuccess, children }: EditGuideSectionModalProps) {
  const [title, setTitle] = useState("")
  const [icon, setIcon] = useState("")
  const [order, setOrder] = useState(0)
  const [contentItems, setContentItems] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)

  const availableIcons = Object.entries(iconMap).map(([key, IconComponent]) => ({
    value: key,
    label: key.replace(/([A-Z])/g, " $1").trim(), 
    icon: <IconComponent className="w-4 h-4 mr-2" />,
  }));

  useEffect(() => {
    if (section) {
      setTitle(section.title || "")
      setIcon(section.icon || "")
      setContentItems(section.content && section.content.length > 0 ? section.content : [""])
      setOrder(section.order || 0)
    }
  }, [section])

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

    if (!section || !title || !icon || contentItems.filter((item) => item.trim()).length === 0) {
      toast.error("Missing Information", {
        description: "Please fill in all required fields.",
      })
      setLoading(false)
      return
    }

    try {
      const filteredContent = contentItems.filter((item) => item.trim())
      const response = await updateGuideSection({
        id: section.id,
        title,
        icon,
        content: filteredContent,
        order,
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      toast.success("Section Updated", {
        description: `${title} has been updated successfully.`,
      })

      onSuccess()
    } catch (error: any) {
      toast.error("Error Updating Section", {
        description: error.message || "Failed to update section.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModernEditModal
      title="Edit Guide Section"
      description="Make changes to the guide section. Click save when you're done."
      icon={Edit}
      onSuccess={onSuccess}
      triggerElement={children}
    >
      {({ onSuccess: handleSuccess }) => (
        <ModernForm
          onSubmit={(e) => {
            handleSubmit(e).then(() => handleSuccess())
          }}
          loading={loading}
          submitText="Save Changes"
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
    </ModernEditModal>
  )
}
