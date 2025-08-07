import { getProfileUser } from "@/components/actions"
import ResponsiveDashboardLayout from "@/components/responsive-dashboard-layout"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const response = await getProfileUser()
  const user = response.user
  const role = user?.role

  return <ResponsiveDashboardLayout role={role}>{children}</ResponsiveDashboardLayout>
}
