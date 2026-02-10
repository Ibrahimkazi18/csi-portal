"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Calendar, Users, Edit, Trash2 } from "lucide-react"
import { getWorkshops } from "./actions"
import { CreateWorkshopModal } from "@/components/workshops/create-workshop-modal"
import { toast } from "sonner"

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadWorkshops()
  }, [])

  const loadWorkshops = async () => {
    setLoading(true)
    const response = await getWorkshops()
    
    if (response.success && response.data) {
      setWorkshops(response.data.workshops)
    } else {
      toast.error("Failed to load workshops")
    }
    
    setLoading(false)
  }

  const filteredWorkshops = workshops.filter(w => {
    const matchesSearch = w.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || w.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "secondary"
      case "ongoing": return "default"
      case "registration_open": return "default"
      case "upcoming": return "outline"
      default: return "outline"
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading workshops...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workshops</h1>
          <p className="text-muted-foreground">
            Manage all workshops and seminars
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/core/workshops/manual">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </Link>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workshop
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Workshops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workshops.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workshops.filter(w => w.status === "upcoming").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workshops.filter(w => w.status === "ongoing").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workshops.filter(w => w.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workshops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-input border border-border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="registration_open">Registration Open</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Workshop List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkshops.map(workshop => (
          <Card key={workshop.id} className="hover:shadow-lg transition-shadow">
            {workshop.banner_url && (
              <img
                src={workshop.banner_url}
                alt={workshop.title}
                className="w-full h-40 object-cover rounded-t-lg"
              />
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{workshop.title}</CardTitle>
                <div className="flex flex-col gap-1">
                  <Badge variant={getStatusColor(workshop.status)}>
                    {workshop.status}
                  </Badge>
                  {workshop.source === "manual" && (
                    <Badge variant="outline" className="text-xs">Manual</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {workshop.description}
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(workshop.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {workshop.registration_count || 0} / {workshop.max_participants} registered
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/core/workshops/${workshop.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                {workshop.status !== "completed" && (
                  <Link href={`/core/workshops/${workshop.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkshops.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No workshops found</p>
          <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Workshop
          </Button>
        </div>
      )}

      {/* Create Workshop Modal */}
      <CreateWorkshopModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadWorkshops}
      />
    </div>
  )
}