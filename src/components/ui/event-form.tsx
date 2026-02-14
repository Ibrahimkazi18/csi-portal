import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, User, Trophy, MapPin, Clock, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Define the props for the main component
interface EventFormProps {
  className?: string;
  formData: {
    title: string;
    description: string;
    max_participants: string;
    team_size: string;
    registration_deadline: string;
    start_date: string;
    end_date: string;
    type: "individual" | "team";
    is_tournament: boolean;
    banner_url: string;
    tournament_id?: string;
    status: string;
  };
  tournaments?: any[];
  onInputChange: (field: string, value: string | boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  submitText?: string;
}

// A reusable info button for the details section
const InfoButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        'flex h-12 flex-1 items-center justify-start gap-3 rounded-xl bg-background px-4 text-left font-normal text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
);
InfoButton.displayName = 'InfoButton';

// Main EventForm component
export const EventForm = React.forwardRef<HTMLDivElement, EventFormProps>(
  ({
    className,
    formData,
    tournaments = [],
    onInputChange,
    onSubmit,
    loading = false,
    submitText = "Create Event",
  }, ref) => {
    // Animation variants for Framer Motion
    const containerVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          staggerChildren: 0.1,
        },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    };

    const eventTypes = [
      { value: "individual", label: "Individual", icon: User, description: "Single participant events" },
      { value: "team", label: "Team", icon: Users, description: "Team-based events" },
    ];

    const statusOptions = [
      { value: "upcoming", label: "Upcoming", description: "Event is scheduled but not open for registration" },
      { value: "registration_open", label: "Registration Open", description: "Participants can register" },
      { value: "ongoing", label: "Ongoing", description: "Event is currently running" },
      { value: "completed", label: "Completed", description: "Event has finished" },
      { value: "cancelled", label: "Cancelled", description: "Event has been cancelled" },
    ];

    return (
      <div
        ref={ref}
        className={cn('w-full space-y-4', className)}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Basic Information Section */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h3 className="font-medium text-card-foreground flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => onInputChange("title", e.target.value)}
                  placeholder="e.g., Web Development Challenge"
                  className="h-10 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => onInputChange("description", e.target.value)}
                  placeholder="Describe the event, its objectives, and what participants can expect..."
                  className="min-h-[80px] rounded-lg resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="max_participants">Max Participants *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="max_participants"
                      type="number"
                      min="1"
                      value={formData.max_participants}
                      onChange={(e) => onInputChange("max_participants", e.target.value)}
                      placeholder="50"
                      className="h-10 rounded-lg pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner_url">Banner Image URL</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="banner_url"
                      type="url"
                      value={formData.banner_url}
                      onChange={(e) => onInputChange("banner_url", e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      className="h-10 rounded-lg pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Configuration Section */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h3 className="font-medium text-card-foreground flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4" />
              Configuration
            </h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="type">Event Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => onInputChange("type", value)} required>
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === "team" && (
                  <div className="space-y-2">
                    <Label htmlFor="team_size">Team Size *</Label>
                    <Input
                      id="team_size"
                      type="number"
                      min="2"
                      value={formData.team_size}
                      onChange={(e) => onInputChange("team_size", e.target.value)}
                      placeholder="4"
                      className="h-10 rounded-lg"
                      required={formData.type === "team"}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => onInputChange("status", value)} required>
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div>
                            <div className="font-medium">{status.label}</div>
                            <div className="text-xs text-muted-foreground">{status.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30">
                <Switch
                  id="is_tournament"
                  checked={formData.is_tournament}
                  onCheckedChange={(checked) => onInputChange("is_tournament", checked)}
                />
                <Label htmlFor="is_tournament" className="flex items-center gap-2 cursor-pointer text-sm">
                  <Trophy className="h-4 w-4" />
                  Tournament Mode
                </Label>
                <span className="text-xs text-muted-foreground">Enable competitive tournament features</span>
              </div>

              {formData.is_tournament && tournaments.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="tournament_id">Tournament *</Label>
                  <Select value={formData.tournament_id || ""} onValueChange={(value) => onInputChange("tournament_id", value)} required>
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue placeholder="Select Tournament" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map((tournament: any) => (
                        <SelectItem key={tournament.id} value={tournament.id}>
                          <div>
                            <div className="font-medium">{tournament.title}</div>
                            <div className="text-xs text-muted-foreground">{tournament.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </motion.div>

          {/* Dates Section */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h3 className="font-medium text-card-foreground flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Important Dates
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="registration_deadline">Registration Deadline *</Label>
                <Input
                  id="registration_deadline"
                  type="date"
                  value={formData.registration_deadline}
                  onChange={(e) => onInputChange("registration_deadline", e.target.value)}
                  className="h-10 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => onInputChange("start_date", e.target.value)}
                  className="h-10 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => onInputChange("end_date", e.target.value)}
                  className="h-10 rounded-lg"
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants} className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-lg text-sm font-medium"
              asChild
            >
              <motion.button whileTap={{ scale: 0.98 }}>
                {loading ? "Processing..." : submitText}
              </motion.button>
            </Button>
          </motion.div>
        </form>
        </motion.div>
      </div>
    );
  }
);

EventForm.displayName = 'EventForm';