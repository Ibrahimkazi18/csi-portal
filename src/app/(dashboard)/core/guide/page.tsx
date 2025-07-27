"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronDown, Edit, Info, Plus, Settings, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { fetchGuideSections, deleteGuideSection } from "./actions"
import { PostgrestError } from "@supabase/supabase-js"
import { CreateGuideSectionModal } from "./components/create-guide-section-modal"
import { EditGuideSectionModal } from "./components/edit-guide-section-modal"
import { DeleteGuideSectionDialog } from "./components/delete-guide-section-modal"
import { iconMap } from "./constants"

export default function GuidePage() {
  const [guideContents, setGuideContents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<any>(null)
  const [isManagementMode, setIsManagementMode] = useState(false)

  const fetchGuides = useCallback(async () => {
    setLoading(true)
    try {
      const [response] = await Promise.all([fetchGuideSections()])
      if (response.error) {
        throw new PostgrestError(response.error)
      } else if (response.success) {
        setGuideContents(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch guides:", error)
      toast.error("Error", {
        description: "Failed to load guides. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGuides()
  }, [fetchGuides])

  const handleEditSection = (section: any) => {
    setSelectedSection(section)
    setIsEditModalOpen(true)
  }

  const handleDeleteSection = (section: any) => {
    setSelectedSection(section)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedSection) return

    try {
      const response = await deleteGuideSection(selectedSection.id)
      if (response.error) {
        throw new Error(response.error.message)
      }

      toast.success("Section deleted successfully")
      fetchGuides()
      setIsDeleteDialogOpen(false)
      setSelectedSection(null)
    } catch (error: any) {
      toast.error("Error deleting section", {
        description: error.message || "Failed to delete section.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">CSI Guide</h1>
          <p className="text-muted-foreground">Rules, guidelines, and frequently asked questions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsManagementMode(!isManagementMode)}
            className={isManagementMode ? "glow-purple" : ""}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isManagementMode ? "Exit Management" : "Manage Sections"}
          </Button>
          {isManagementMode && (
            <Button className="glow-blue" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-5 w-5" />
            <span>Official Documentation</span>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <Card className="bg-dark-surface border-border glow-blue">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Welcome to CSI
          </CardTitle>
          <CardDescription>Computer Science Institute - Building the future of technology together</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">
            The Computer Science Institute (CSI) is dedicated to fostering a community of passionate developers,
            designers, and technology enthusiasts. Our mission is to provide a platform for learning, collaboration, and
            innovation while building lasting connections within the tech community.
          </p>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && <div className="text-center py-8 text-muted-foreground">Loading guide sections...</div>}

      {/* Guide Sections */}
      <div className="space-y-4">
        {guideContents.map((section) => {
          const Icon = iconMap[section.icon] || Info
          return (
            <Card key={section.id} className="bg-dark-surface border-border hover:bg-muted/50 transition-colors relative group ">
              {/* Management Actions */}
              {isManagementMode && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditSection(section)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteSection(section)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        {section.title}
                      </CardTitle>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <ul className="space-y-3">
                      {section.content.map((item: any, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-foreground leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {!loading && guideContents.length === 0 && (
        <Card className="bg-dark-surface border-border">
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No guide sections found</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first guide section.</p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="glow-blue">
              <Plus className="h-4 w-4 mr-2" />
              Create First Section
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>Contact the core team for any questions or concerns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">General Inquiries</h4>
              <p className="text-sm text-muted-foreground">csi@college.edu</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Technical Support</h4>
              <p className="text-sm text-muted-foreground">tech@csi.college.edu</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Event Registration</h4>
              <p className="text-sm text-muted-foreground">events@csi.college.edu</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Team Formation</h4>
              <p className="text-sm text-muted-foreground">teams@csi.college.edu</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateGuideSectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchGuides}
      />
      <EditGuideSectionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        section={selectedSection}
        onSuccess={fetchGuides}
      />
      <DeleteGuideSectionDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        section={selectedSection}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
