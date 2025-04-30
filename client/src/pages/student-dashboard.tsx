import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  CalendarRange, 
  Bell, 
  CreditCard, 
  Loader2, 
  AlertTriangle,
  Clock,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { getQueryFn } from '@/lib/queryClient';
import { Course, ClassEnrollment } from '@shared/schema';

export function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Buscar cursos do aluno
  const { 
    data: courses = [], 
    isLoading: isLoadingCourses, 
    error: coursesError 
  } = useQuery<Course[]>({
    queryKey: ['/api/student/courses'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Buscar matrículas em turmas
  const { 
    data: enrollments = [], 
    isLoading: isLoadingEnrollments, 
    error: enrollmentsError 
  } = useQuery<ClassEnrollment[]>({
    queryKey: ['/api/student/class-enrollments'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Dados simulados para avisos e financeiro (em um ambiente real, seriam buscados da API)
  const notifications = [
    { id: 1, title: 'Avaliação disponível', course: 'Desenvolvimento Web', date: '2025-05-05', isNew: true },
    { id: 2, title: 'Material adicionado', course: 'Marketing Digital', date: '2025-05-02', isNew: true },
    { id: 3, title: 'Aula remarcada', course: 'Gestão de Projetos', date: '2025-04-30', isNew: false },
  ];

  const financialItems = [
    { id: 1, title: 'Mensalidade Maio/2025', dueDate: '2025-05-10', amount: 299.90, status: 'pending' },
    { id: 2, title: 'Mensalidade Abril/2025', dueDate: '2025-04-10', amount: 299.90, status: 'paid' },
    { id: 3, title: 'Material Didático', dueDate: '2025-03-15', amount: 150.00, status: 'paid' },
  ];

  // Calcular progresso médio dos cursos
  const calculateOverallProgress = () => {
    if (!courses?.length) return 0;
    
    const totalProgress = courses.reduce((sum, course) => {
      return sum + (course.progress || 0);
    }, 0);
    
    return Math.round(totalProgress / courses.length);
  };

  const overallProgress = calculateOverallProgress();

  // Verificar próximas atividades
  const upcomingActivities = enrollments
    .filter(enrollment => 
      enrollment.class?.startDate && new Date(enrollment.class.startDate) > new Date()
    )
    .sort((a, b) => {
      const dateA = new Date(a.class?.startDate || '');
      const dateB = new Date(b.class?.startDate || '');
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 3);

  if (isLoadingCourses || isLoadingEnrollments) {
    return (
      <AppShell>
        <div className="container mx-auto p-4">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Carregando seu dashboard...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // Exibir erros se houver problemas na obtenção dos dados
  if (coursesError || enrollmentsError) {
    const errorMessage = coursesError ? coursesError.toString() : enrollmentsError?.toString();
    
    toast({
      title: "Erro ao carregar dados",
      description: errorMessage || "Não foi possível carregar seu dashboard. Tente novamente mais tarde.",
      variant: "destructive",
    });
  }

  return (
    <AppShell>
      <Helmet>
        <title>Meu Dashboard | Edunéxia</title>
      </Helmet>
      
      <div className="container mx-auto p-4">
        {/* Saudação ao aluno */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Olá, {user?.fullName?.split(' ')[0] || 'Aluno'}!</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao seu dashboard. Continue de onde parou.
          </p>
        </div>
        
        {/* Visão geral do progresso */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Progresso Acadêmico
              </CardTitle>
              <CardDescription>Seu progresso geral nos cursos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Progress value={overallProgress} className="h-3" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Progresso médio</span>
                  <span className="font-medium">{overallProgress}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span>{courses.length} cursos em andamento</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/student/courses">
                  Ver todos os cursos
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Próximas atividades */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-primary" />
                Próximas Atividades
              </CardTitle>
              <CardDescription>Suas aulas e avaliações previstas</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingActivities.length > 0 ? (
                <div className="space-y-3">
                  {upcomingActivities.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{enrollment.class?.name || 'Aula'}</p>
                        <p className="text-xs text-muted-foreground">
                          {enrollment.class?.startDate ? new Date(enrollment.class.startDate).toLocaleDateString('pt-BR') : 'Data não definida'}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {enrollment.status === 'active' ? 'Confirmada' : enrollment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CalendarRange className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Você não tem atividades agendadas no momento.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/student/calendar">
                  Ver agenda completa
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Meus cursos */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Meus Cursos</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/courses">
                Ver todos
              </Link>
            </Button>
          </div>
          
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.slice(0, 3).map((course) => (
                <Link key={course.id} href={`/student/courses/${course.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2 h-10">
                        {course.description || 'Sem descrição disponível'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{course.progress || 0}%</span>
                        </div>
                        <Progress value={course.progress || 0} className="h-2" />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{course.subjectsCount || '0'} disciplinas</span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="py-6">
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <BookOpen className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                  <h3 className="text-lg font-medium mb-1">Sem cursos ativos</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Você ainda não está matriculado em nenhum curso.
                  </p>
                  <Button asChild>
                    <Link href="/student/catalog">
                      Explorar cursos disponíveis
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Avisos e Financeiro em Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Avisos Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Avisos Recentes
              </CardTitle>
              <CardDescription>Atualizações e notificações importantes</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start gap-3">
                      <div className={`rounded-full p-1.5 mt-0.5 ${notification.isNew ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Bell className={`h-3.5 w-3.5 ${notification.isNew ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {notification.isNew && (
                            <Badge variant="default" className="text-[10px] px-1 py-0 h-4">Novo</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{notification.course}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Nenhum aviso no momento.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/student/notifications">
                  Ver todos os avisos
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Meu Financeiro
              </CardTitle>
              <CardDescription>Pagamentos e mensalidades</CardDescription>
            </CardHeader>
            <CardContent>
              {financialItems.length > 0 ? (
                <div className="space-y-4">
                  {financialItems.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-1.5 mt-0.5 ${
                          item.status === 'pending' ? 'bg-amber-100' : 'bg-green-100'
                        }`}>
                          <CreditCard className={`h-3.5 w-3.5 ${
                            item.status === 'pending' ? 'text-amber-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Vencimento: {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(item.amount)}</p>
                        <Badge variant={item.status === 'pending' ? 'outline' : 'secondary'} className="mt-1">
                          {item.status === 'pending' ? 'Pendente' : 'Pago'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CreditCard className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Nenhum item financeiro a exibir.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/student/financial">
                  Ver histórico financeiro
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default StudentDashboard;