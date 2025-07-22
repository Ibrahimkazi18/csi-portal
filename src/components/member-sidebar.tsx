"use client";

import { 
  User, 
  Calendar, 
  Users, 
  BarChart3, 
  BookOpen, 
  MessageSquare,
  Computer,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarItems = [
  { 
    title: 'My Profile', 
    icon: User, 
    path: '/members/profile' 
  },
  { 
    title: 'Events', 
    icon: Calendar, 
    path: '/members/events' 
  },
  { 
    title: 'Register Team', 
    icon: Users, 
    path: '/members/register-team' 
  },
  { 
    title: 'Leaderboard', 
    icon: BarChart3, 
    path: '/members/leaderboard' 
  },
  { 
    title: 'CSI Guide', 
    icon: BookOpen, 
    path: '/members/guide' 
  },
  { 
    title: 'Ask Query', 
    icon: MessageSquare, 
    path: '/members/query' 
  }
];

export default function MemberSidebar() {
  const pathname = usePathname();

  return (
    <div className="h-screen w-64 bg-darker-surface border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Computer className="h-8 w-8 text-lavender glow-purple" />
          <div>
            <h2 className="text-lg font-bold text-lavender">CSI Member</h2>
            <p className="text-sm text-muted-foreground">Dashboard</p>
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
                  ? 'bg-secondary text-secondary-foreground glow-purple' 
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
            <p className="text-xs text-muted-foreground truncate">useremail</p>
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