"use client"

import { Button } from "@/components/ui/button"
import { Plus, AlertCircle, Settings } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getAnnouncements, updateLastSeenAnnoucement, deleteAnnouncement } from "./actions"
import { CreateAnnouncementModal } from "./components/create-announcement-modal"
import { EditAnnouncementModal } from "./components/edit-announcement-modal"
import { DeleteAnnouncementDialog } from "./components/delete-announcement-modal"
import { AnnouncementBentoGrid } from "@/components/ui/announcement-bento-grid"
import { CtaCard, CtaCardContent } from "@/components/ui/cta-card"
import Preloader from "@/components/ui/preloader"

export default function AnnouncementsPage() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null)
  const [isManagementMode, setIsManagementMode] = useState(false)

  const handleAllAnnouncementsOnLoad = useCallback(async () => {
    setLoadingData(true)
    try {
      const [responseLastSeen, responseAnnouncements] = await Promise.all([
        updateLastSeenAnnoucement(),
        getAnnouncements(),
      ])
      if (responseLastSeen.error) {
        throw new Error(responseLastSeen.error)
      }
      if (responseAnnouncements.error) {
        throw new Error(responseAnnouncements.error)
      } else if (responseAnnouncements.data) {
        setAnnouncements(responseAnnouncements.data)
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error)
      toast.error("Error", {
        description: "Failed to load announcements. Please try again.",
      })
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    handleAllAnnouncementsOnLoad()
  }, [handleAllAnnouncementsOnLoad])

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

  const handleEditAnnouncement = (announcement: any) => {
    setSelectedAnnouncement(announcement)
    setIsEditModalOpen(true)
  }

  const handleDeleteAnnouncement = (announcement: any) => {
    setSelectedAnnouncement(announcement)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedAnnouncement) return

    try {
      const response = await deleteAnnouncement(selectedAnnouncement.id)
      if (!response.success) {
        throw new Error(response.error)
      }

      toast.success("Announcement deleted successfully")
      handleAllAnnouncementsOnLoad()
      setIsDeleteDialogOpen(false)
      setSelectedAnnouncement(null)
    } catch (error: any) {
      toast.error("Error deleting announcement", {
        description: error.message || "Failed to delete announcement.",
      })
    }
  }

  // Separate announcements by importance for better layout
  const importantAnnouncements = announcements.filter(a => a.is_important)
  const regularAnnouncements = announcements.filter(a => !a.is_important)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Manage CSI announcements and notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsManagementMode(!isManagementMode)}
            className={isManagementMode ? "border-primary" : ""}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isManagementMode ? "Exit Management" : "Manage Announcements"}
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loadingData && (
        <div className="text-center py-12 text-muted-foreground">Loading announcements...</div>
      )}

      {/* Empty State */}
      {!loadingData && announcements.length === 0 && (
        <CtaCard>
          <CtaCardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No announcements yet</h3>
            <p className="text-muted-foreground mb-4">Create your first announcement to get started!</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Announcement
            </Button>
          </CtaCardContent>
        </CtaCard>
      )}

      {/* Important Announcements */}
      {!loadingData && importantAnnouncements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-semibold">Important Announcements</h2>
          </div>
          <AnnouncementBentoGrid
            items={importantAnnouncements.map(a => ({
              ...a,
              colSpan: importantAnnouncements.length === 1 ? 2 : undefined,
              hasPersistentHover: true
            }))}
            onEdit={isManagementMode ? handleEditAnnouncement : undefined}
            onDelete={isManagementMode ? handleDeleteAnnouncement : undefined}
            showActions={isManagementMode}
          />
        </div>
      )}

      {/* Regular Announcements */}
      {!loadingData && regularAnnouncements.length > 0 && (
        <div>
          {importantAnnouncements.length > 0 && (
            <div className="flex items-center gap-2 mb-4 mt-8">
              <h2 className="text-xl font-semibold">All Announcements</h2>
            </div>
          )}
          <AnnouncementBentoGrid
            items={regularAnnouncements}
            onEdit={isManagementMode ? handleEditAnnouncement : undefined}
            onDelete={isManagementMode ? handleDeleteAnnouncement : undefined}
            showActions={isManagementMode}
          />
        </div>
      )}

      {/* Modals */}
      <CreateAnnouncementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleAllAnnouncementsOnLoad}
      />
      <EditAnnouncementModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        announcement={selectedAnnouncement}
        onSuccess={handleAllAnnouncementsOnLoad}
      />
      <DeleteAnnouncementDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        announcement={selectedAnnouncement}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
