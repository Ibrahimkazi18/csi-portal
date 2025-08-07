"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { BookOpen, ChevronDown, Info } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { fetchGuideSections } from "./actions"
import { PostgrestError } from "@supabase/supabase-js"
import { iconMap } from "../../core/guide/constants"
import GuideLoadingSkeleton from "./components/guide-skeleton"

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
          <h1 className="text-3xl font-bold text-neon text-lavender">CSI Guide</h1>
          <p className="text-muted-foreground">Rules, guidelines, and frequently asked questions</p>
        </div>
        <div className="flex items-center gap-3">
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
    </div>
  )
}
