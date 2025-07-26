import CoreTeamSidebar from "@/components/core-team-sidebar";
import MemberSidebar from "@/components/member-sidebar";


interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const role = "core-team"

  return (
    <div className="flex h-screen bg-background">
      {role === 'core-team' ? <CoreTeamSidebar /> : <MemberSidebar />}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}