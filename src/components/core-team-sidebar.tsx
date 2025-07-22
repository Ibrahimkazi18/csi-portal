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
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    icon: BookOpen, 
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
              {/* {user?.name.charAt(0).toUpperCase()} */}User
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">username</p>
            <p className="text-xs text-muted-foreground truncate">usereamil</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
        //   onClick={logout}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}