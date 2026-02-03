"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Save, Download, ArrowLeft, Users } from "lucide-react"
import { toast } from "sonner"
import * as attendanceActions from "./actions"
import Link from "next/link"

export default function WorkshopAttendancePage() {
  const params = useParams()
  const router = useRouter()
  const workshopId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workshop, setWorkshop] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadAttendance()
  }, [workshopId])

  const loadAttendance = async () => {
    setLoading(true)
    const response = await attendanceActions.getAttendanceSheet(workshopId)
    
    if (response.success && response.data) {
      setWorkshop(response.data.workshop)
      setParticipants(response.data.participants)
      
      // Initialize attendance map
      const map: Record<string, boolean> = {}
      response.data.participants.forEach((p: any) => {
        map[p.id] = p.attended || false
      })
      setAttendanceMap(map)
    } else {
      toast.error(response.error)
    }
    
    setLoading(false)
  }

  const toggleAttendance = (participantId: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [participantId]: !prev[participantId]
    }))
  }

  const markAllAttended = () => {
    const map: Record<string, boolean> = {}
    participants.forEach(p => {
      map[p.id] = true
    })
    setAttendanceMap(map)
  }

  const clearAll = () => {
    const map: Record<string, boolean> = {}
    participants.forEach(p => {
      map[p.id] = false
    })
    setAttendanceMap(map)
  }

  const handleSave = async () => {
    setSaving(true)

    const attendanceData = Object.entries(attendanceMap).map(([id, attended]) => ({
      participantId: id,
      attended
    }))

    const response = await attendanceActions.updateAttendance(workshopId, attendanceData)

    if (response.success) {
      toast.success("Attendance saved successfully")
      loadAttendance() // Refresh data
    } else {
      toast.error(response.error)
    }

    setSaving(false)
  }

  const attendedCount = Object.values(attendanceMap).filter(Boolean).length
  const totalCount = participants.length
  const attendanceRate = totalCount > 0
    ? Math.round((attendedCount / totalCount) * 100)
    : 0

  if (loading) {
    return <div className="text-center py-8">Loading attendance sheet...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/core/workshops/${workshopId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workshop
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Mark Attendance</h1>
            <p className="text-muted-foreground">
              {workshop?.title} - {attendedCount} / {totalCount} attended ({attendanceRate}%)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAttended}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All
          </Button>
          <Button variant="outline" onClick={clearAll}>
            Clear All
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{attendedCount}</div>
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalCount - attendedCount}</div>
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{attendanceRate}%</div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Sheet */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <div
                key={participant.id}
                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={attendanceMap[participant.id] || false}
                  onCheckedChange={() => toggleAttendance(participant.id)}
                />
                <span className="text-sm text-muted-foreground w-8">
                  {index + 1}.
                </span>
                <div className="flex-1">
                  <p className="font-medium">
                    {participant.user?.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {participant.user?.email}
                  </p>
                </div>
                {attendanceMap[participant.id] && (
                  <Badge variant="default" className="bg-green-500">
                    Present
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {participants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No participants registered yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}