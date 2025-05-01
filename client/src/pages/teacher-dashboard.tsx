import { TeacherDashboardContent } from "@/components/teacher/teacher-dashboard-content";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Página principal do Dashboard do Professor
 */
export default function TeacherDashboard() {
  return (
    <AppShell>
      <TeacherDashboardContent />
    </AppShell>
  );
}