"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Download, Search, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import * as registrationActions from "./actions"
import { toast } from "sonner"
import Link from "next/link"

export default function WorkshopRegistrationsPage() {
  const params = useParams()
  const workshopId = params.id as string

  const [loading, setLoading] = useState(true)
  const [workshop, setWorkshop] = useState<any>(null)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadRegistrations()
  }, [workshopId])

  const loadRegistrations = async () => {
    setLoading(true)
    const response = await registrationActions.getWorkshopRegistrations(workshopId)
    
    if (response.success && response.data) {
      setWorkshop(response.data.workshop)
      setRegistrations(response.data.registrations)
    } else {
      toast.error(response.error)
    }
    
    setLoading(false)
  }

  const handleExport = async () => {
    setExporting(true)
    const response = await registrationActions.exportRegistrationsToCsv(workshopId)
    
    if (response.success && response.data) {
      // Trigger download
      const blob = new Blob([response.data.csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `workshop-registrations-${workshopId}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Exported successfully")
    } else {
      toast.error(response.error)
    }
    
    setExporting(false)
  }

  const filteredRegistrations = registrations.filter(reg =>
    (reg.user?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (reg.user?.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-8">Loading registrations...</div>
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
            <h1 className="text-2xl font-bold">Workshop Registrations</h1>
            <p className="text-muted-foreground">
              {workshop?.title} - {registrations.length} participant(s) registered
            </p>
          </div>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? "Exporting..." : "Export to CSV"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registered At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attended</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((reg, index) => (
                <TableRow key={reg.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {reg.user?.full_name}
                  </TableCell>
                  <TableCell>{reg.user?.email}</TableCell>
                  <TableCell>
                    {new Date(reg.registered_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      reg.status === "confirmed" ? "default" :
                      reg.status === "cancelled" ? "destructive" :
                      "secondary"
                    }>
                      {reg.status || "registered"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {reg.attended ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRegistrations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No registrations found matching your search" : "No registrations found"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}