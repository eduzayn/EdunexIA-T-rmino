import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Calendar, 
  Book, 
  GraduationCap, 
  Users, 
  Flag, 
  Clock,
  ArrowRight,
  PlusCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/layout/app-shell';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';

/**
 * Dashboard do Portal do Professor
 * Exibe visão geral das turmas, alunos e atividades do professor
 */
export const TeacherDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Dados de estatísticas do dashboard do professor
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/teacher/dashboard', selectedPeriod],
    enabled: true
  });

  // Dados simulados para manter o layout enquanto a API é implementada
  const tempData = {
    classes: [
      { 
        id: 1, 
        code: 'PROG2025-1', 
        name: 'Programação Web - Turma A', 
        subjectName: 'Programação Web', 
        schedule: 'Segunda e Quarta, 19h às 22h', 
        students: 28, 
        progress: 65,
        nextClass: '2025-05-04T19:00:00Z',
        hasAssessmentPending: true
      },
      { 
        id: 2, 
        code: 'ALG2025-3', 
        name: 'Algoritmos e Estruturas de Dados - Turma C', 
        subjectName: 'Algoritmos', 
        schedule: 'Terça e Quinta, 14h às 17h', 
        students: 32, 
        progress: 40,
        nextClass: '2025-05-02T14:00:00Z',
        hasAssessmentPending: false
      }
    ],
    students: {
      total: 60,
      active: 58,
      inactive: 2
    },
    pendingAssessments: 12,
    upcomingClasses: 6,
    recentActivities: [
      { 
        id: 1, 
        type: 'assessment', 
        title: 'Avaliação publicada: Prova Final - Programação Web', 
        date: '2025-04-30T10:30:00Z',
        status: 'success'
      },
      { 
        id: 2, 
        type: 'material', 
        title: 'Material adicionado: Slides Aula 12 - Algoritmos', 
        date: '2025-04-29T14:15:00Z',
        status: 'info'
      },
      { 
        id: 3, 
        type: 'attendance', 
        title: 'Presença registrada para Turma A - Programação Web', 
        date: '2025-04-28T21:05:00Z',
        status: 'info'
      }
    ],
    studentPerformance: [
      { month: 'Jan', media: 7.2, presenca: 85 },
      { month: 'Fev', media: 7.6, presenca: 88 },
      { month: 'Mar', media: 7.1, presenca: 83 },
      { month: 'Abr', media: 7.8, presenca: 90 },
      { month: 'Mai', media: 8.0, presenca: 92 }
    ]
  };

  const data = dashboardData || tempData;

  const renderActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment':
        return <Flag className="h-4 w-4 mr-2" />;
      case 'material':
        return <Book className="h-4 w-4 mr-2" />;
      case 'attendance':
        return <Users className="h-4 w-4 mr-2" />;
      default:
        return <Clock className="h-4 w-4 mr-2" />;
    }
  };

  const renderActivityBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluído</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'info':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Informação</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM", { locale: ptBR });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard do Professor</h1>
            <p className="text-muted-foreground">
              Bem-vindo ao seu painel de controle. Gerencie suas turmas e acompanhe o desempenho de seus alunos.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 lg:mt-0">
            <Button asChild variant="outline">
              <Link href="/teacher/classes">
                Minhas Turmas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link href="/teacher/assessments/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Avaliação
              </Link>
            </Button>
          </div>
        </div>

        {/* Indicadores Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="rounded-full bg-primary/20 p-3 mr-4">
                  <Book className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Turmas Ativas</p>
                  <h3 className="text-2xl font-bold">{data.classes.length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="rounded-full bg-primary/20 p-3 mr-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Alunos</p>
                  <h3 className="text-2xl font-bold">{data.students.total}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="rounded-full bg-primary/20 p-3 mr-4">
                  <Flag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avaliações Pendentes</p>
                  <h3 className="text-2xl font-bold">{data.pendingAssessments}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="rounded-full bg-primary/20 p-3 mr-4">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aulas Programadas</p>
                  <h3 className="text-2xl font-bold">{data.upcomingClasses}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gráfico de Desempenho */}
            <Card>
              <CardHeader>
                <CardTitle>Desempenho dos Alunos</CardTitle>
                <CardDescription>Média de notas e frequência nas turmas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.studentPerformance}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPresenca" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="media" 
                        name="Média de Notas" 
                        stroke="#8884d8" 
                        fillOpacity={1} 
                        fill="url(#colorMedia)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="presenca" 
                        name="Frequência (%)" 
                        stroke="#82ca9d" 
                        fillOpacity={1} 
                        fill="url(#colorPresenca)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Turmas */}
            <Card>
              <CardHeader>
                <CardTitle>Minhas Turmas</CardTitle>
                <CardDescription>Visão geral das turmas ativas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.classes.map(classItem => (
                    <div key={classItem.id} className="bg-card-alt border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium">{classItem.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {classItem.subjectName} • {classItem.code}
                          </p>
                        </div>
                        <div className="mt-2 md:mt-0">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {classItem.students} alunos
                          </Badge>
                          {classItem.hasAssessmentPending && (
                            <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                              Avaliação pendente
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm mb-1">Progresso: {classItem.progress}%</p>
                        <Progress value={classItem.progress} className="h-2" />
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Próxima aula: {formatDate(classItem.nextClass)}</span>
                        </div>
                        <Button variant="outline" size="sm" className="mt-2 md:mt-0" asChild>
                          <Link href={`/teacher/classes/${classItem.id}`}>
                            Ver detalhes
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/teacher/classes">
                    Ver todas as turmas
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            {/* Próximas Aulas */}
            <Card>
              <CardHeader>
                <CardTitle>Próximas Aulas</CardTitle>
                <CardDescription>Aulas agendadas para os próximos dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.classes.map(classItem => (
                    <div key={`upcoming-${classItem.id}`} className="flex items-start gap-4 border-b pb-4 last:border-0">
                      <div className="bg-primary/10 rounded-lg p-2.5 text-center min-w-[50px]">
                        <div className="text-xs font-medium text-primary">
                          {format(new Date(classItem.nextClass), 'MMM', { locale: ptBR }).toUpperCase()}
                        </div>
                        <div className="text-xl font-bold text-primary">
                          {format(new Date(classItem.nextClass), 'dd')}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{classItem.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(classItem.nextClass), 'EEEE', { locale: ptBR })}, {' '}
                          {format(new Date(classItem.nextClass), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/teacher/schedule">
                    Ver agenda completa
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Atividades Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>Suas últimas ações no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentActivities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-4 border-b pb-4 last:border-0">
                      <div className="bg-primary/10 rounded-full p-2">
                        {renderActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <h4 className="font-medium text-sm">{activity.title}</h4>
                          <div className="mt-1 md:mt-0">
                            {renderActivityBadge(activity.status)}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(activity.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default TeacherDashboard;