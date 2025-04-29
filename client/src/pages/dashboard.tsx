import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PopularCourses } from "@/components/dashboard/popular-courses";
import { EnrollmentsTable } from "@/components/dashboard/enrollments-table";
import { AiAssistant } from "@/components/dashboard/ai-assistant";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Render loading skeletons
  if (isLoading) {
    return (
      <AppShell>
        <Helmet>
          <title>Dashboard | Edunéxia NextGen</title>
        </Helmet>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AppShell>
    );
  }

  // If we couldn't get the dashboard data
  if (!dashboardStats) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold">Carregando dados do dashboard...</h2>
          <p className="text-muted-foreground">Por favor, aguarde um momento</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Helmet>
        <title>Dashboard | Edunéxia NextGen</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="py-6">
          <h1 className="text-2xl font-semibold">Dashboard Administrativo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral do sistema educacional Edunéxia NextGen
          </p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Alunos Ativos"
            value={dashboardStats?.activeStudents?.toString() || "0"}
            icon="students"
            trend={{
              value: 8.2,
              isPositive: true,
              label: "este mês"
            }}
          />
          
          <StatsCard
            title="Cursos Ativos"
            value={dashboardStats?.activeCourses?.toString() || "0"}
            icon="courses"
            trend={{
              value: 4.1,
              isPositive: true,
              label: "este mês"
            }}
          />
          
          <StatsCard
            title="Receita Mensal"
            value={dashboardStats?.monthlyRevenue || 0}
            icon="revenue"
            trend={{
              value: 12.5,
              isPositive: true,
              label: "este mês"
            }}
          />
          
          <StatsCard
            title="Taxa de Conclusão"
            value={`${dashboardStats?.completionRate || 0}%`}
            icon="completion"
            trend={{
              value: 3.2,
              isPositive: true,
              label: "este mês"
            }}
          />
        </div>
        
        {/* Middle Section */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <ActivityFeed activities={dashboardStats?.recentActivity || []} />
          </div>
          
          <div>
            <PopularCourses 
              courses={
                dashboardStats?.popularCourses?.map((course: any) => ({
                  id: course.id,
                  title: course.title,
                  studentsCount: course.studentsCount,
                  price: course.price,
                  rating: course.rating,
                  category: 
                    course.title.includes("Web") ? "development" :
                    course.title.includes("Marketing") ? "marketing" :
                    course.title.includes("Inteligência") || course.title.includes("IA") ? "ai" :
                    "business"
                })) || []
              } 
            />
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <EnrollmentsTable 
              enrollments={dashboardStats?.latestEnrollments || []}
            />
          </div>
          
          <div>
            <AiAssistant />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
