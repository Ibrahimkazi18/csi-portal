"use client"

import { BookOpen, Edit, Info, Plus, Settings, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { fetchGuideSections, deleteGuideSection } from "./actions"
import { PostgrestError } from "@supabase/supabase-js"
import { CreateGuideSectionModal } from "./components/create-guide-section-modal"
import { EditGuideSectionModal } from "./components/edit-guide-section-modal"
import { DeleteGuideSectionDialog } from "./components/delete-guide-section-modal"
import { iconMap } from "./constants"
import { ExpandableGuideSection } from "@/components/ui/expandable-guide-section"
import { CtaCard, CtaCardHeader, CtaCardTitle, CtaCardDescription, CtaCardContent } from "@/components/ui/cta-card"
import { Button } from "@/components/ui/button"
import Preloader from "@/components/ui/preloader"

export default function GuidePage() {
  const [showPreloader, setShowPreloader] = useState(true)
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
          <h1 className="text-3xl font-bold">CSI Guide</h1>
          <p className="text-muted-foreground">Rules, guidelines, and frequently asked questions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsManagementMode(!isManagementMode)}
            className={isManagementMode ? "border-primary" : ""}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isManagementMode ? "Exit Management" : "Manage Sections"}
          </Button>
          {isManagementMode && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-5 w-5" />
            <span className="hidden sm:inline">Official Documentation</span>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <CtaCard variant="accent">
        <CtaCardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CtaCardTitle>Welcome to CSI</CtaCardTitle>
          </div>
          <CtaCardDescription>Computer Science Institute - Building the future of technology together</CtaCardDescription>
        </CtaCardHeader>
        <CtaCardContent>
          <p className="text-foreground leading-relaxed">
            The Computer Science Institute (CSI) is dedicated to fostering a community of passionate developers,
            designers, and technology enthusiasts. Our mission is to provide a platform for learning, collaboration, and
            innovation while building lasting connections within the tech community.
          </p>
        </CtaCardContent>
      </CtaCard>

      {/* Loading State */}
      {loading && <div className="text-center py-8 text-muted-foreground">Loading guide sections...</div>}

      {/* Guide Sections */}
      <div className="space-y-4">
        {guideContents.map((section, index) => {
          const Icon = iconMap[section.icon] || Info
          return (
            <div key={section.id} className="relative group">
              {/* Management Actions */}
              {isManagementMode && (
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditSection(section)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteSection(section)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <ExpandableGuideSection
                title={section.title}
                icon={<Icon className="h-6 w-6" />}
                content={section.content}
                index={index}
              />
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {!loading && guideContents.length === 0 && (
        <CtaCard>
          <CtaCardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No guide sections found</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first guide section.</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Section
            </Button>
          </CtaCardContent>
        </CtaCard>
      )}

      {/* Contact Information */}
      <CtaCard>
        <CtaCardHeader>
          <CtaCardTitle>Need Help?</CtaCardTitle>
          <CtaCardDescription>Contact the core team for any questions or concerns</CtaCardDescription>
        </CtaCardHeader>
        <CtaCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
              <h4 className="font-medium mb-2">General Inquiries</h4>
              <p className="text-sm text-muted-foreground">csi@college.edu</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
              <h4 className="font-medium mb-2">Technical Support</h4>
              <p className="text-sm text-muted-foreground">tech@csi.college.edu</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
              <h4 className="font-medium mb-2">Event Registration</h4>
              <p className="text-sm text-muted-foreground">events@csi.college.edu</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
              <h4 className="font-medium mb-2">Team Formation</h4>
              <p className="text-sm text-muted-foreground">teams@csi.college.edu</p>
            </div>
          </div>
        </CtaCardContent>
      </CtaCard>

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
