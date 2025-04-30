import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, BookOpen, GraduationCap, CreditCard, Bell, CalendarRange } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Definição dos tipos para os dados
interface Course {
  id: number;
  title: string;
  shortDescription: string | null;
  area: string | null;
  progress: number;
  subjectsCount: number;
}

interface ClassEnrollment {
  id: number;
  status: "active" | "pending" | "completed" | "cancelled";
  enrollmentDate: string;
  classInfo: {
    id: number;
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    subjectId: number;
    subjectName?: string;
  };
}

interface Notification {
  id: number;
  title: string;
  course: string;
  date: string;
  isNew: boolean;
}

interface FinancialItem {
  id: number;
  title: string;
  dueDate: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
}

export default function StudentDashboard() {
  const { toast } = useToast();
  
  // Buscando cursos do aluno
  const { 
    data: courses = [], 
    isLoading: isCoursesLoading 
  } = useQuery<Course[]>({ 
    queryKey: ['/api/student/courses'],
    gcTime: 1000 * 60 * 5, // 5 minutos
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Manipulador de erro para toast
  const handleQueryError = (error: Error, title: string) => {
    toast({
      variant: "destructive",
      title,
      description: error.message || "Ocorreu um erro na requisição."
    });
  };

  // Buscando matrículas em turmas
  const { 
    data: classEnrollments = [], 
    isLoading: isClassEnrollmentsLoading 
  } = useQuery<any[], Error, ClassEnrollment[]>({ 
    queryKey: ['/api/student/class-enrollments'], 
    select: (data) => {
      // Transformando os dados para o formato esperado
      return data.map(enrollment => ({
        id: enrollment.id,
        status: enrollment.status as "active" | "pending" | "completed" | "cancelled",
        enrollmentDate: enrollment.enrollmentDate,
        classInfo: enrollment.class ? {
          id: enrollment.class.id,
          code: enrollment.class.classCode,
          name: enrollment.class.name,
          startDate: enrollment.class.startDate,
          endDate: enrollment.class.endDate,
          subjectId: enrollment.class.subjectId,
          subjectName: enrollment.class.subject?.name
        } : null
      }));
    },
    gcTime: 1000 * 60 * 5, // 5 minutos
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Buscando notificações/avisos
  const { 
    data: notifications = [], 
    isLoading: isNotificationsLoading 
  } = useQuery<Notification[]>({ 
    queryKey: ['/api/student/notifications'],
    gcTime: 1000 * 60 * 5, // 5 minutos
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Buscando dados financeiros
  const { 
    data: financialItems = [], 
    isLoading: isFinancialLoading 
  } = useQuery<FinancialItem[]>({ 
    queryKey: ['/api/student/financial'],
    gcTime: 1000 * 60 * 5, // 5 minutos
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Filtrar as próximas atividades (turmas ativas com datas próximas)
  const upcomingActivities = classEnrollments
    .filter(enrollment => enrollment.status === 'active' && enrollment.classInfo)
    .sort((a, b) => {
      const dateA = new Date(a.classInfo?.startDate || '');
      const dateB = new Date(b.classInfo?.startDate || '');
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 3); // Mostrar apenas as 3 primeiras

  // Filtrar as notificações recentes
  const recentNotifications = notifications
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5); // Mostrar apenas as 5 mais recentes

  // Calcular o saldo financeiro
  const pendingAmount = financialItems
    .filter(item => item.status === 'pending' || item.status === 'overdue')
    .reduce((total, item) => total + item.amount, 0);

  // Formatar valores em reais
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Meu Dashboard</h1>
          <div>
            <Badge variant="outline" className="ml-2">
              <Bell className="h-4 w-4 mr-1" />
              {notifications.filter(n => n.isNew).length} novos avisos
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card de Meus Cursos */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Meus Cursos
              </CardTitle>
              <CardDescription>
                Acompanhe o progresso dos seus cursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCoursesLoading ? (
                <p>Carregando cursos...</p>
              ) : courses.length === 0 ? (
                <p>Você ainda não está matriculado em nenhum curso.</p>
              ) : (
                <div className="space-y-4">
                  {courses.slice(0, 3).map((course) => (
                    <div key={course.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{course.title}</h3>
                        <Badge>{course.area || 'Geral'}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        {course.shortDescription || 'Sem descrição'}
                      </div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span>Progresso: {course.progress}%</span>
                        <span>{course.subjectsCount} disciplinas</span>
                      </div>
                      <Progress value={course.progress} className="h-2 mb-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link href="/student/courses">Ver todos os cursos</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Card de Próximas Atividades */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarRange className="mr-2 h-5 w-5" />
                Próximas Atividades
              </CardTitle>
              <CardDescription>
                Suas próximas aulas e avaliações
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isClassEnrollmentsLoading ? (
                <p>Carregando atividades...</p>
              ) : upcomingActivities.length === 0 ? (
                <p>Não há atividades programadas.</p>
              ) : (
                <div className="space-y-4">
                  {upcomingActivities.map((enrollment) => (
                    <div key={enrollment.id} className="border rounded-lg p-3">
                      <h3 className="font-semibold text-sm">{enrollment.classInfo?.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {enrollment.classInfo?.subjectName}
                      </p>
                      <div className="flex items-center text-xs mt-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(enrollment.classInfo?.startDate || '')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link href="#">Ver agenda completa</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Card de Avisos Recentes */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Avisos Recentes
              </CardTitle>
              <CardDescription>
                Comunicados e novidades importantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isNotificationsLoading ? (
                <p>Carregando avisos...</p>
              ) : recentNotifications.length === 0 ? (
                <p>Não há avisos recentes.</p>
              ) : (
                <div className="space-y-3">
                  {recentNotifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm">{notification.title}</h3>
                        {notification.isNew && (
                          <Badge variant="secondary" className="text-xs">Novo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{notification.course}</p>
                      <div className="flex items-center text-xs mt-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{notification.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link href="#">Ver todos os avisos</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Card de Financeiro */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Meu Financeiro
              </CardTitle>
              <CardDescription>
                Acompanhe suas mensalidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isFinancialLoading ? (
                <p>Carregando dados financeiros...</p>
              ) : (
                <>
                  <div className="mb-4 p-3 border rounded-lg">
                    <p className="text-sm font-medium">Saldo pendente</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(pendingAmount)}</p>
                  </div>
                  <div className="space-y-3">
                    {financialItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">Vencimento: {formatDate(item.dueDate)}</p>
                        </div>
                        <Badge
                          variant={item.status === 'paid' ? 'outline' : item.status === 'overdue' ? 'destructive' : 'secondary'}
                        >
                          {item.status === 'paid' ? 'Pago' : item.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link href="#">Ver extrato completo</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}