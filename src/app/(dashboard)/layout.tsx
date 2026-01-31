import { getDashboardData } from "@/components/actions"
import ResponsiveDashboardLayout from "@/components/responsive-dashboard-layout"
import { redirect } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const response = await getDashboardData()
  
  if (!response.success || !response.user) {
    redirect('/login')
  }

  const role = response.user.role

  return <ResponsiveDashboardLayout role={role}>{children}</ResponsiveDashboardLayout>
}
