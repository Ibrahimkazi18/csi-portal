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

      {/* Database Migration Warning */}
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">Database Migration Required</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          <div className="space-y-2">
            <p>
              If you're experiencing issues with participant counts showing as 0 or database errors, 
              you need to apply the database migration to create the required tables.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4" />
              <span className="font-medium">Migration file:</span>
              <code className="bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded text-xs">
                database/migrations/001_add_event_features.sql
              </code>
            </div>
            <p className="text-sm">
              Apply this migration to your Supabase database to enable full manual event functionality.
            </p>
          </div>
        </AlertDescription>
      </Alert>

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