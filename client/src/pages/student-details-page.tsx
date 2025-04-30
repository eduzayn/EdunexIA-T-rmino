import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams, Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, GraduationCap, User, CalendarRange, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { User as UserType, ClassEnrollment } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { usePortal } from '@/hooks/use-portal';

export function StudentDetailsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const studentId = parseInt(params.id, 10);
  const { currentPortal } = usePortal();

  // Buscar dados do aluno
  const { 
    data: student, 
    isLoading: isLoadingStudent, 
    error: studentError 
  } = useQuery<UserType>({
    queryKey: [`/api/students/${studentId}`],
    enabled: !isNaN(studentId),
  });

  // Buscar matrículas do aluno em turmas
  const { 
    data: enrollments = [], 
    isLoading: isLoadingEnrollments, 
    error: enrollmentsError 
  } = useQuery<ClassEnrollment[]>({
    queryKey: [`/api/students/${studentId}/class-enrollments`],
    enabled: !isNaN(studentId),
  });

  if (isLoadingStudent) {
    return (
      <div className="container p-4 mx-auto">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados do aluno...</p>
        </div>
      </div>
    );
  }

  if (studentError || !student) {
    return (
      <div className="container p-4 mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar dados</h2>
          <p className="text-red-600 mb-4">
            {studentError ? studentError.toString() : 'Aluno não encontrado'}
          </p>
          <Button 
            variant="outline" 
            onClick={() => navigate(`${currentPortal.baseRoute}/students`)}
          >
            Voltar para lista de alunos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{student.fullName} | Edunéxia</title>
      </Helmet>
      <div className="container p-4 mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 -ml-2 flex items-center text-gray-600 hover:text-gray-900"
          onClick={() => navigate(`${currentPortal.baseRoute}/students`)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar para lista de alunos
        </Button>

        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Perfil básico do aluno */}
          <Card className="md:w-1/3">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {student.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{student.fullName}</CardTitle>
                    <CardDescription className="mt-1">{student.username}</CardDescription>
                    <Badge variant={student.isActive ? 'default' : 'secondary'} className="mt-2">
                      {student.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to={`${currentPortal.baseRoute}/students/${student.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                  <p className="text-sm">{student.email}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Data de Cadastro</h4>
                  <p className="text-sm">{new Date(student.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Última Atualização</h4>
                  <p className="text-sm">{new Date(student.updatedAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Detalhes e matrículas */}
          <div className="md:w-2/3">
            <Tabs defaultValue="enrollments">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="enrollments">
                  <CalendarRange className="h-4 w-4 mr-2" />
                  Matrículas
                </TabsTrigger>
                <TabsTrigger value="info">
                  <User className="h-4 w-4 mr-2" />
                  Detalhes
                </TabsTrigger>
              </TabsList>
              
              {/* Aba de Matrículas */}
              <TabsContent value="enrollments" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Matrículas em Turmas</CardTitle>
                    <CardDescription>
                      Turmas em que o aluno está matriculado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingEnrollments ? (
                      <p className="text-muted-foreground">Carregando matrículas...</p>
                    ) : enrollments.length === 0 ? (
                      <div className="text-center p-4 border border-dashed rounded-lg">
                        <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground">Aluno não está matriculado em nenhuma turma</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {enrollments.map((enrollment) => (
                          <Card key={enrollment.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-medium">Turma ID: {enrollment.classId}</h3>
                                  <p className="text-sm text-muted-foreground">Matrícula desde {new Date(enrollment.enrollmentDate).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                                  {enrollment.status === 'active' ? 'Ativo' : 
                                   enrollment.status === 'completed' ? 'Completo' : 
                                   enrollment.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end pt-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`${currentPortal.baseRoute}/classes`}>
                        Ver Todas as Turmas
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Aba de Informações */}
              <TabsContent value="info" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Aluno</CardTitle>
                    <CardDescription>
                      Detalhes adicionais e informações do sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">ID do Aluno</h4>
                        <p className="text-gray-700">{student.id}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Instituição (Tenant ID)</h4>
                        <p className="text-gray-700">{student.tenantId}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Perfil</h4>
                        <p className="text-gray-700">{student.role === 'student' ? 'Aluno' : student.role}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                        <p className="text-gray-700">{student.isActive ? 'Ativo' : 'Inativo'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}