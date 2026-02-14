import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ComprehensiveManualEventFlow } from "@/components/manual-events/comprehensive-manual-event-flow"
import { Shield, Plus, AlertTriangle, Database } from "lucide-react"
import { ManualEventsList } from "@/components/manual-events/manual-events-list"

export default function ManualEventsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-500" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Manual Event Entry
          </h1>
        </div>
        <p className="text-muted-foreground">
          Comprehensive system for adding historical events with full tournament structure, participants, and results.
        </p>
      </div>

      {/* Create New Manual Event */}
      <Card className="border-border/40">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Manual Event
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Add events that happened offline with complete tournament structure, participants, and results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComprehensiveManualEventFlow />
        </CardContent>
      </Card>

      {/* Existing Manual Events */}
      <Card className="border-border/40">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Manual Events History</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Previously created manual events and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-sm text-muted-foreground">Loading manual events...</div>}>
            <ManualEventsList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}