import React from 'react';
import { usePortal } from '@/hooks/use-portal';
import { Calendar, School, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/**
 * Componente que contém apenas o conteúdo do Dashboard do Polo
 * Para ser usado no Portal do Polo e na visualização do Admin
 */
export const HubDashboardContent: React.FC = () => {
  const { currentPortal } = usePortal();
  const baseRoute = currentPortal.id === 'hub' ? '/hub' : '/admin';
  const [activeTab, setActiveTab] = React.useState('overview');
  
  // Dados simulados
  const dashboardData = {
    courses: [
      { id: 1, name: 'Análise e Desenvolvimento de Sistemas', students: 42, progress: 68, status: 'Em andamento' },
      { id: 2, name: 'Administração de Empresas', students: 35, progress: 72, status: 'Em andamento' },
      { id: 3, name: 'Gestão de Recursos Humanos', students: 28, progress: 91, status: 'Concluindo' },
      { id: 4, name: 'Marketing Digital', students: 22, progress: 45, status: 'Em andamento' },
    ],
    students: [
      { id: 101, name: 'João Silva', enrollment: '2025/1', course: 'Análise e Desenvolvimento de Sistemas', status: 'Ativo' },
      { id: 102, name: 'Maria Santos', enrollment: '2025/1', course: 'Administração de Empresas', status: 'Ativo' },
      { id: 103, name: 'Carlos Oliveira', enrollment: '2024/2', course: 'Marketing Digital', status: 'Pendente' },
      { id: 104, name: 'Ana Pereira', enrollment: '2024/2', course: 'Gestão de Recursos Humanos', status: 'Ativo' },
      { id: 105, name: 'Bruno Almeida', enrollment: '2024/1', course: 'Análise e Desenvolvimento de Sistemas', status: 'Trancado' },
    ],
    pendingDocuments: [
      { id: 201, studentName: 'Carlos Oliveira', documentType: 'Histórico Escolar', submittedDate: '28/04/2025', status: 'Pendente' },
      { id: 202, studentName: 'Fernanda Lima', documentType: 'Diploma', submittedDate: '27/04/2025', status: 'Pendente' },
      { id: 203, studentName: 'Ricardo Souza', documentType: 'Certidão de Nascimento', submittedDate: '25/04/2025', status: 'Pendente' },
    ],
    performance: {
      enrollmentRate: 92,
      retentionRate: 87,
      certificationRate: 78,
      satisfactionRate: 85
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard do Polo</h1>
          <p className="text-muted-foreground">
            Gerencie e monitore os cursos e alunos do seu polo educacional
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Maio 2025</span>
          </Button>
          
          <Button variant="default" size="sm" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            <span>Matriz Central</span>
          </Button>
        </div>
      </div>
      
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alunos Matriculados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <span className="text-emerald-500 font-medium">+12%</span>
              <span className="ml-1">desde o último período</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cursos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500 font-medium">+2</span> novos cursos
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Documentos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="text-amber-500 font-medium">3</span> com alta prioridade
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500 font-medium">+5%</span> vs. média nacional
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs para diferentes visões */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="students">Alunos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Indicadores de Performance */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Indicadores de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Taxa de Matrícula</span>
                    <span className="text-sm font-medium">{dashboardData.performance.enrollmentRate}%</span>
                  </div>
                  <Progress value={dashboardData.performance.enrollmentRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Taxa de Retenção</span>
                    <span className="text-sm font-medium">{dashboardData.performance.retentionRate}%</span>
                  </div>
                  <Progress value={dashboardData.performance.retentionRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Taxa de Certificação</span>
                    <span className="text-sm font-medium">{dashboardData.performance.certificationRate}%</span>
                  </div>
                  <Progress value={dashboardData.performance.certificationRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Satisfação dos Alunos</span>
                    <span className="text-sm font-medium">{dashboardData.performance.satisfactionRate}%</span>
                  </div>
                  <Progress value={dashboardData.performance.satisfactionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            {/* Documentos Pendentes */}
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Documentos Pendentes</CardTitle>
                <Button variant="ghost" size="sm">Ver Todos</Button>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {dashboardData.pendingDocuments.map((doc) => (
                    <li key={doc.id} className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{doc.studentName}</p>
                        <p className="text-sm text-muted-foreground">{doc.documentType}</p>
                        <p className="text-xs text-muted-foreground">Enviado em {doc.submittedDate}</p>
                      </div>
                      <Badge variant={doc.status === 'Pendente' ? 'outline' : 'secondary'}>
                        {doc.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="sm">
                  Revisar Documentos
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="courses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cursos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Nome do Curso</th>
                      <th className="text-center py-3 px-2 font-medium">Alunos</th>
                      <th className="text-center py-3 px-2 font-medium">Progresso</th>
                      <th className="text-center py-3 px-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.courses.map((course) => (
                      <tr key={course.id} className="border-b">
                        <td className="py-3 px-2">
                          <div className="font-medium">{course.name}</div>
                        </td>
                        <td className="py-3 px-2 text-center">{course.students}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center">
                            <Progress value={course.progress} className="h-2 w-24 mx-2" />
                            <span className="text-xs ml-2">{course.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant={
                            course.status === 'Em andamento' ? 'secondary' : 
                            course.status === 'Concluindo' ? 'default' : 'outline'
                          }>
                            {course.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" size="sm">
                Ver Todos os Cursos
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="students" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alunos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Nome do Aluno</th>
                      <th className="text-left py-3 px-2 font-medium">Matrícula</th>
                      <th className="text-left py-3 px-2 font-medium">Curso</th>
                      <th className="text-center py-3 px-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.students.map((student) => (
                      <tr key={student.id} className="border-b">
                        <td className="py-3 px-2">
                          <div className="font-medium">{student.name}</div>
                        </td>
                        <td className="py-3 px-2">{student.enrollment}</td>
                        <td className="py-3 px-2">{student.course}</td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant={
                            student.status === 'Ativo' ? 'default' : 
                            student.status === 'Pendente' ? 'secondary' : 
                            'destructive'
                          }>
                            {student.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" size="sm">
                Ver Todos os Alunos
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HubDashboardContent;