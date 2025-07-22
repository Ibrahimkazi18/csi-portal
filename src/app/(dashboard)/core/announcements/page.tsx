import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">Announcements</h1>
          <p className="text-muted-foreground">Manage CSI announcements and notifications</p>
        </div>
        <Button className="glow-blue">
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle>Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No announcements yet. Create your first announcement!</p>
        </CardContent>
      </Card>
    </div>
  );
}