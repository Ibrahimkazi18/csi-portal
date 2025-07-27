"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateGuideSection } from "../actions"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { set } from "date-fns"

interface EditGuideSectionModalProps {
  isOpen: boolean
  onClose: () => void
  section: any
  onSuccess: () => void
}

export function EditGuideSectionModal({ isOpen, onClose, section, onSuccess }: EditGuideSectionModalProps) {
  const [title, setTitle] = useState("")
  const [icon, setIcon] = useState("")
  const [order, setOrder] = useState(0)
  const [contentItems, setContentItems] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)

  const availableIcons = [
    { value: "Info", label: "Info" },
    { value: "BookOpen", label: "Book Open" },
    { value: "Settings", label: "Settings" },
    // Add more icons as needed
  ]

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
      onClose()
    } catch (error: any) {
      toast.error("Error Updating Section", {
        description: error.message || "Failed to update section.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] border-border text-foreground max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Guide Section</DialogTitle>
          <DialogDescription>Make changes to the guide section. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3 bg-input border-border"
              placeholder="e.g., Community Guidelines"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">
              Icon *
            </Label>
            <Select value={icon} onValueChange={setIcon} required>
              <SelectTrigger className="col-span-3 bg-input border-border">
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent className="border-border">
                {availableIcons.map((iconOption) => (
                  <SelectItem key={iconOption.value} value={iconOption.value}>
                    {iconOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="order" className="text-right">
            Order *
            </Label>
            <Input
                type="number"
                min={0}
                placeholder="Enter order (e.g., 1, 2, 3...)"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="col-span-3 bg-input border-border"
                required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Content Items *</Label>
            {contentItems.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  value={item}
                  onChange={(e) => handleContentItemChange(index, e.target.value)}
                  className="bg-input border-border resize-none"
                  placeholder={`Content item ${index + 1}`}
                  rows={2}
                />
                {contentItems.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveContentItem(index)}
                    className="px-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddContentItem} className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Add Content Item
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="glow-blue">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
