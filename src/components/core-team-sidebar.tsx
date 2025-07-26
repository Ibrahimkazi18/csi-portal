"use client"

import { 
  Users, 
  Calendar, 
  Trophy, 
  BarChart3, 
  MessageSquare, 
  BookOpen, 
  Shield,
  Computer,
  LogOut,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getProfileUser, logOut } from './actions';
import { toast } from 'sonner';
import { ThemeToggle } from './ui/theme-toggler';

const sidebarItems = [
  { 
    title: 'Members', 
    icon: Users, 
    path: '/core/members' 
  },
  { 
    title: 'Events', 
    icon: Calendar, 
    path: '/core/events' 
  },
  { 
    title: 'Tournament Teams', 
    icon: Trophy, 
    path: '/core/teams' 
  },
  { 
    title: 'Leaderboard', 
    icon: BarChart3, 
    path: '/core/leaderboard' 
  },
  { 
    title: 'Queries', 
    icon: MessageSquare, 
    path: '/core/queries' 
  },
  { 
    title: 'Announcements', 
    icon: Megaphone, 
    path: '/core/announcements' 
  },
  { 
    title: 'Guide', 
    icon: BookOpen, 
    path: '/core/guide' 
  },
  { 
    title: 'Roles', 
    icon: Shield, 
    path: '/core/roles' 
  }
];

export default function CoreTeamSidebar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true)
  const [user, setUser] = useState<any>(null);

  const fetchUserProfile = useCallback(async () => {
    setLoadingData(true)
    try {
      const [resposne] = await Promise.all([getProfileUser()]);

      if(resposne.error) {
        throw new Error(resposne.error);
      }

      else if (resposne.success) {
        setUser(resposne.user);
      }

    } catch (error) {
        console.error("Failed to fetch members:", error)
        toast.error("Error", {
          description: "Failed to load members. Please try again.",
        });

    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleLogOut = async () => {
    try {
      setLoading(true);

      const response = await logOut();

      if(!response.success) {
        throw new Error(response.error || "logout Failed")
      }

      toast.success("Loggeg out successfully", {
        description: "Hope to see you again soon!"
      })

    } catch (error) {
      console.error('Logout error:', error);

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen w-64 bg-darker-surface border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Computer className="h-8 w-8 text-neon-blue glow-blue" />
          <div>
            <h2 className="text-lg font-bold text-neon">CSI Core Team</h2>
            <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.includes(item.path);
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-primary text-primary-foreground glow-blue' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-medium text-secondary-foreground">
              {user?.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <ThemeToggle />

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogOut}
          disabled={loading}
          className="w-full justify-center lg:text-xlg"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {loading ? "Signing Out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  );
}