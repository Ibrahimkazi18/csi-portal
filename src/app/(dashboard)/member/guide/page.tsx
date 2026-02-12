"use client"

import { BookOpen, Info } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { fetchGuideSections } from "./actions"
import { PostgrestError } from "@supabase/supabase-js"
import { iconMap } from "../../core/guide/constants"
import GuideLoadingSkeleton from "./components/guide-skeleton"
import { ExpandableGuideSection } from "@/components/ui/expandable-guide-section"
import { CtaCard, CtaCardHeader, CtaCardTitle, CtaCardDescription, CtaCardContent } from "@/components/ui/cta-card"

export default function GuidePage() {
  const [guideContents, setGuideContents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

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


  if(loading) {
    return <GuideLoadingSkeleton />  
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CSI Guide</h1>
          <p className="text-muted-foreground">Rules, guidelines, and frequently asked questions</p>
        </div>
        <div className="flex items-center gap-3">
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
            <ExpandableGuideSection
              key={section.id}
              title={section.title}
              icon={<Icon className="h-6 w-6" />}
              content={section.content}
              index={index}
            />
          )
        })}
      </div>

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
    </div>
  )
}
