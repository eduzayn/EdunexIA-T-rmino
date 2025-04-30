import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet';
import { usePortal } from '@/hooks/use-portal';
import { AppShell } from '@/components/layout/app-shell';
import { ArrowLeft, Users, Calendar, MapPin, Clock, Pencil, BookOpen, School, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ClassDetailsPage({ params }: { params: { id: string } }) {
  const classId = parseInt(params.id);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { currentPortal } = usePortal();
  
  // Buscar dados da turma
  const { data: classItem, isLoading: isLoadingClass, error: classError } = useQuery({
    queryKey: [`/api/classes/${classId}`],
    refetchOnWindowFocus: false,
  });

  // Buscar disciplina da turma
  const { data: subject, isLoading: isLoadingSubject } = useQuery({
    queryKey: [`/api/subjects/${classItem?.subjectId}`],
    enabled: !!classItem?.subjectId,
    refetchOnWindowFocus: false,
  });

  // Buscar alunos matriculados na turma
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: [`/api/classes/${classId}/enrollments`],
    enabled: !!classId,
    refetchOnWindowFocus: false,
  });

  // Mutation para excluir turma
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/classes/${classId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Turma excluída',
        description: 'A turma foi excluída com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      navigate(`${currentPortal.baseRoute}/classes`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir turma',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoadingClass) {
    return (
      <AppShell>
        <div className="container p-4 mx-auto">
          <p className="text-gray-500">Carregando detalhes da turma...</p>
        </div>
      </AppShell>
    );
  }

  if (classError) {
    return (
      <AppShell>
        <div className="container p-4 mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
            <p>Erro ao carregar turma: {(classError as Error).message}</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => navigate(`${currentPortal.baseRoute}/classes`)}
            >
              Voltar para lista
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!classItem) {
    return (
      <AppShell>
        <div className="container p-4 mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 p-4 rounded-md">
            <p>Turma não encontrada.</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => navigate(`${currentPortal.baseRoute}/classes`)}
            >
              Voltar para lista
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  // Função para renderizar o badge de status da turma
  const renderStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let label = "Programada";
    
    switch (status) {
      case "scheduled":
        variant = "outline";
        label = "Programada";
        break;
      case "in_progress":
        variant = "default";
        label = "Em Andamento";
        break;
      case "completed":
        variant = "secondary";
        label = "Concluída";
        break;
      case "cancelled":
        variant = "destructive";
        label = "Cancelada";
        break;
    }
    
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <AppShell>
      <Helmet>
        <title>{classItem.name} | Turmas | Edunéxia</title>
      </Helmet>
      <div className="container p-4 mx-auto">
        <Button 
          variant="ghost" 
          className="mb-2 -ml-2 flex items-center text-gray-600 hover:text-gray-900"
          onClick={() => navigate(`${currentPortal.baseRoute}/classes`)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar para lista de turmas
        </Button>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{classItem.name}</h1>
              {!classItem.isActive && (
                <Badge variant="outline" className="bg-gray-100">Inativa</Badge>
              )}
              {renderStatusBadge(classItem.status)}
            </div>
            <p className="text-gray-500 mt-1">Código: {classItem.code}</p>
            {subject && (
              <div className="flex items-center mt-1 text-gray-600">
                <BookOpen className="h-4 w-4 mr-1 inline" />
                Disciplina: {subject.title}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button asChild variant="outline">
              <Link 
                to={`${currentPortal.baseRoute}/classes/${classId}/edit`}
                href={`${currentPortal.baseRoute}/classes/${classId}/edit`}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir turma</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita e todas as matrículas associadas também serão excluídas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteMutation.mutate()}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        {/* Tabs para detalhes da turma */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="students">
              Alunos
              {enrollments.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-700">
                  {enrollments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Aba de Informações */}
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Detalhes da Turma</h3>
                  
                  {classItem.description && (
                    <div className="mb-4">
                      <p className="text-gray-700">{classItem.description}</p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {classItem.teacherId && (
                      <div className="flex items-start">
                        <School className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium">Professor</p>
                          <p className="text-gray-600">ID: {classItem.teacherId}</p>
                        </div>
                      </div>
                    )}
                    
                    {(classItem.startDate || classItem.endDate) && (
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium">Período</p>
                          <p className="text-gray-600">
                            {classItem.startDate && new Date(classItem.startDate).toLocaleDateString('pt-BR')}
                            {classItem.startDate && classItem.endDate && ' a '}
                            {classItem.endDate && new Date(classItem.endDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {classItem.location && (
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium">Local</p>
                          <p className="text-gray-600">{classItem.location}</p>
                        </div>
                      </div>
                    )}
                    
                    {classItem.scheduleInfo && (
                      <div className="flex items-start">
                        <Clock className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium">Horário</p>
                          <p className="text-gray-600">{classItem.scheduleInfo}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start">
                      <Users className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Capacidade</p>
                        <p className="text-gray-600">
                          {isLoadingEnrollments 
                            ? 'Carregando...' 
                            : `${enrollments.length} alunos matriculados`}
                          {classItem.maxStudents && ` / ${classItem.maxStudents} vagas`}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Informações Administrativas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Data de Criação</h4>
                      <p className="text-gray-700">
                        {new Date(classItem.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Última Atualização</h4>
                      <p className="text-gray-700">
                        {new Date(classItem.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">ID da Disciplina</h4>
                      <p className="text-gray-700">{classItem.subjectId}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">ID da Turma</h4>
                      <p className="text-gray-700">{classItem.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Aba de Alunos */}
          <TabsContent value="students">
            <Card>
              <CardContent className="p-6">
                {isLoadingEnrollments ? (
                  <p className="text-gray-500">Carregando matrículas...</p>
                ) : enrollments.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium">Nenhum aluno matriculado</h3>
                    <p className="text-gray-500 mt-1">Esta turma ainda não possui alunos matriculados.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Alunos Matriculados</h3>
                      <p className="text-gray-500">Total: {enrollments.length} {classItem.maxStudents && `/ ${classItem.maxStudents}`}</p>
                    </div>
                    <div className="border rounded-md divide-y">
                      {enrollments.map((enrollment: any) => (
                        <div key={enrollment.id} className="p-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium">Aluno ID: {enrollment.studentId}</p>
                            <p className="text-sm text-gray-500">Matrícula desde {new Date(enrollment.createdAt).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                            {enrollment.status === 'active' ? 'Ativo' : enrollment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}