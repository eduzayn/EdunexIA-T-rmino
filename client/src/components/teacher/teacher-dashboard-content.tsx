import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/query-client';
import { 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  Calendar, 
  BarChart2, 
  Clock, 
  Search,
  ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePortal } from '@/hooks/use-portal';

/**
 * Componente que contém apenas o conteúdo do Dashboard do Professor
 * Para ser usado no Portal do Professor e na visualização do Admin
 */
export const TeacherDashboardContent: React.FC = () => {
  const { currentPortal } = usePortal();
  const baseRoute = currentPortal.id === 'teacher' ? '/teacher' : '/admin';
  const [activeTab, setActiveTab] = React.useState('overview');
  
  // Dados simulados
  const dashboardData = {
    classes: [
      { id: 1, name: 'Desenvolvimento Frontend', totalStudents: 28, totalHours: 60, nextClass: 'Hoje, 19h' },
      { id: 2, name: 'Banco de Dados Avançado', totalStudents: 21, totalHours: 45, nextClass: 'Amanhã, 10h' },
      { id: 3, name: 'Algoritmos e Estruturas de Dados', totalStudents: 35, totalHours: 80, nextClass: 'Quinta, 14h' },
      { id: 4, name: 'DevOps para Desenvolvedores', totalStudents: 19, totalHours: 40, nextClass: 'Sexta, 9h' },
    ],
    students: [
      { id: 101, name: 'João Silva', attendance: '95%', grade: '9.4', status: 'Ativo' },
      { id: 102, name: 'Maria Santos', attendance: '87%', grade: '8.7', status: 'Ativo' },
      { id: 103, name: 'Carlos Oliveira', attendance: '78%', grade: '7.2', status: 'Atenção' },
      { id: 104, name: 'Ana Pereira', attendance: '93%', grade: '9.0', status: 'Ativo' },
      { id: 105, name: 'Bruno Almeida', attendance: '65%', grade: '6.5', status: 'Crítico' },
    ],
    pendingAssessments: [
      { id: 201, class: 'Desenvolvimento Frontend', dueDate: '15/05/2025', pending: 8 },
      { id: 202, class: 'Banco de Dados Avançado', dueDate: '18/05/2025', pending: 5 },
      { id: 203, class: 'Algoritmos e Estruturas de Dados', dueDate: '20/05/2025', pending: 12 },
    ],
    upcomingClasses: [
      { id: 301, name: 'Desenvolvimento Frontend', date: 'Hoje', time: '19:00 - 21:30', topic: 'React Hooks Avançados' },
      { id: 302, name: 'Banco de Dados Avançado', date: 'Amanhã', time: '10:00 - 12:30', topic: 'Otimização de Consultas' },
      { id: 303, name: 'Algoritmos e Estruturas de Dados', date: 'Quinta-feira', time: '14:00 - 16:30', topic: 'Grafos e Árvores' },
      { id: 304, name: 'DevOps para Desenvolvedores', date: 'Sexta-feira', time: '09:00 - 11:30', topic: 'CI/CD com GitHub Actions' },
    ],
    studentPerformance: [
      { week: 'Semana 1', average: 7.8 },
      { week: 'Semana 2', average: 8.1 },
      { week: 'Semana 3', average: 7.9 },
      { week: 'Semana 4', average: 8.4 },
      { week: 'Semana 5', average: 8.7 },
      { week: 'Semana 6', average: 8.3 },
      { week: 'Semana 7', average: 8.5 },
      { week: 'Semana 8', average: 8.9 },
    ],
    recentActivities: [
      { id: 401, type: 'assessment', description: 'Avaliação corrigida: Projeto React', date: 'Hoje, 14:35' },
      { id: 402, type: 'material', description: 'Material adicionado: DevOps Essentials', date: 'Hoje, 11:20' },
      { id: 403, type: 'class', description: 'Aula ministrada: Banco de Dados Avançado', date: 'Ontem, 10:15' },
      { id: 404, type: 'feedback', description: 'Feedback enviado para Carlos Oliveira', date: 'Ontem, 09:30' },
      { id: 405, type: 'assessment', description: 'Avaliação criada: Algoritmos Recursivos', date: '2 dias atrás' },
    ],
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do Professor</h1>
          <p className="text-muted-foreground">
            Bem-vindo(a) ao seu painel de controle. Gerencie suas turmas, alunos e avaliações.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar alunos ou turmas..."
              className="pl-8 bg-background"
            />
          </div>
          <Button variant="default">Buscar</Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="mb-8" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 md:grid-cols-4 h-auto gap-1 md:gap-0">
          <TabsTrigger value="overview" className="text-sm py-2">Visão Geral</TabsTrigger>
          <TabsTrigger value="classes" className="text-sm py-2">Minhas Turmas</TabsTrigger>
          <TabsTrigger value="assessments" className="text-sm py-2">Avaliações</TabsTrigger>
          <TabsTrigger value="schedule" className="text-sm py-2">Agenda</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Turmas Ativas</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.classes.length}</div>
                <p className="text-xs text-muted-foreground">
                  +1 em relação ao semestre anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.classes.reduce((acc, curr) => acc + curr.totalStudents, 0)}</div>
                <p className="text-xs text-muted-foreground">
                  +12 em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avaliações Pendentes</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.pendingAssessments.reduce((acc, curr) => acc + curr.pending, 0)}</div>
                <p className="text-xs text-muted-foreground">
                  +3 em relação à semana anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próxima Aula</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Hoje, 19h</div>
                <p className="text-xs text-muted-foreground">
                  Desenvolvimento Frontend
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Desempenho dos Alunos</CardTitle>
                <CardDescription>Média das notas nas últimas 8 semanas</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[240px] flex items-end space-x-2">
                  {dashboardData.studentPerformance.map((data, index) => (
                    <div key={index} className="w-full flex flex-col items-center">
                      <div 
                        className="bg-primary/90 hover:bg-primary rounded-t-md w-full" 
                        style={{ 
                          height: `${(data.average / 10) * 180}px` 
                        }}
                        title={`Média: ${data.average}`}
                      >
                      </div>
                      <div className="text-xs mt-2 text-muted-foreground">{data.week.split(' ')[1]}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Próximas Aulas</CardTitle>
                <CardDescription>Suas próximas 3 aulas agendadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.upcomingClasses.slice(0, 3).map((classItem) => (
                    <div key={classItem.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold">{classItem.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {classItem.date} | {classItem.time}
                        </p>
                        <p className="text-xs mt-1">
                          Tópico: {classItem.topic}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="w-full mt-3 text-sm">
                  Ver Agenda Completa
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Turmas Recentes</CardTitle>
                <CardDescription>Suas turmas mais recentes e próximas aulas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.classes.slice(0, 3).map((classItem) => (
                    <div key={classItem.id} className="flex items-center justify-between py-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">{classItem.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {classItem.totalStudents} alunos | {classItem.totalHours} horas
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-medium">Próxima aula:</span>
                        <span className="text-xs text-muted-foreground">{classItem.nextClass}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t">
                  <Link to={`${baseRoute}/classes`}>
                    <Button variant="link" className="text-sm p-0">
                      Ver Todas as Turmas <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>Últimas ações no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentActivities.slice(0, 4).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-2 pb-2 border-b last:border-b-0">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
                        {activity.type === 'assessment' && <ClipboardCheck className="h-4 w-4 text-muted-foreground" />}
                        {activity.type === 'material' && <BookOpen className="h-4 w-4 text-muted-foreground" />}
                        {activity.type === 'class' && <Calendar className="h-4 w-4 text-muted-foreground" />}
                        {activity.type === 'feedback' && <BarChart2 className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="text-xs">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="classes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Turmas</CardTitle>
              <CardDescription>Gerenciamento de turmas e alunos</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Conteúdo da aba de turmas será implementado em uma próxima etapa.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assessments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações</CardTitle>
              <CardDescription>Crie e gerencie avaliações para suas turmas</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Conteúdo da aba de avaliações será implementado em uma próxima etapa.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedule" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Agenda</CardTitle>
              <CardDescription>Visualize sua agenda de aulas e compromissos</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Conteúdo da aba de agenda será implementado em uma próxima etapa.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboardContent;