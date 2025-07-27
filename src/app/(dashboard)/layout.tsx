import { getProfileUser } from "@/components/actions";
import CoreTeamSidebar from "@/components/core-team-sidebar";
import MemberSidebar from "@/components/member-sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const respone = await getProfileUser();
  const user = respone.user;
  const role = user?.role;

  return (
    <div className="flex h-screen bg-background">
      {role === 'core' ? <CoreTeamSidebar /> : <MemberSidebar />}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}