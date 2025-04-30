import TeachersList from "@/components/teachers/teachers-list";
import { AppShell } from "@/components/layout/app-shell";

export default function TeachersPage() {
  return (
    <AppShell>
      <div className="container mx-auto py-8">
        <TeachersList />
      </div>
    </AppShell>
  );
}