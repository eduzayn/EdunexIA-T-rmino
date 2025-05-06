import React from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Pencil, Clock, BookOpen, CheckCircle, XCircle, Layers, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePortal } from '@/hooks/use-portal';
import { Helmet } from 'react-helmet';
import { AppShell } from '@/components/layout/app-shell';
import { SubjectModulesList } from '@/components/subjects/subject-modules-list';
import { QuizList } from '@/components/quizzes/quiz-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Subject } from '@shared/schema';

export function SubjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { currentPortal } = usePortal();

  // Buscar detalhes da disciplina
  const { data: subject, isLoading, error } = useQuery<Subject>({
    queryKey: [`/api/subjects/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="container p-4 mx-auto">
          <p className="text-gray-500">Carregando detalhes da disciplina...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="container p-4 mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
            <p>Erro ao carregar disciplina: {(error as Error).message}</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => navigate(`${currentPortal.baseRoute}/subjects`)}
            >
              Voltar para lista
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!subject) {
    return (
      <AppShell>
        <div className="container p-4 mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 p-4 rounded-md">
            <p>Disciplina não encontrada.</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => navigate(`${currentPortal.baseRoute}/subjects`)}
            >
              Voltar para lista
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Helmet>
        <title>{subject.title} | Edunéxia</title>
      </Helmet>
      <div className="container p-4 mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(`${currentPortal.baseRoute}/subjects`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para lista
        </Button>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{subject.title}</h1>
              <div className="flex items-center mt-2 text-gray-500">
                {subject.area && (
                  <div className="flex items-center mr-4">
                    <BookOpen className="w-4 h-4 mr-1" />
                    <span>{subject.area}</span>
                  </div>
                )}
                {subject.workload && (
                  <div className="flex items-center mr-4">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{subject.workload} horas</span>
                  </div>
                )}
                <div className="flex items-center">
                  {subject.isActive ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                      <span className="text-green-500">Ativa</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-1 text-gray-500" />
                      <span>Inativa</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate(`${currentPortal.baseRoute}/subjects/${id}/edit`)}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>

          <Separator />
          
          <Tabs defaultValue="info" className="w-full">
            <TabsList>
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="modules">Módulos</TabsTrigger>
              <TabsTrigger value="practice">Simulados</TabsTrigger>
              <TabsTrigger value="assessment">Avaliações Finais</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da Disciplina</CardTitle>
                  <CardDescription>
                    Informações completas sobre a disciplina.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Descrição</h3>
                    <p className="text-gray-700">
                      {subject.description || "Nenhuma descrição disponível."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Área do Conhecimento</h3>
                      <p className="text-gray-700">
                        {subject.area || "Não especificada"}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Carga Horária</h3>
                      <p className="text-gray-700">
                        {subject.workload ? `${subject.workload} horas` : "Não especificada"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Status</h3>
                    <Badge variant={subject.isActive ? "default" : "secondary"}>
                      {subject.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Data de Criação</h3>
                      <p className="text-gray-700">
                        {new Date(subject.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Última Atualização</h3>
                      <p className="text-gray-700">
                        {new Date(subject.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="modules" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Layers className="w-5 h-5 mr-2" />
                    Módulos da Disciplina
                  </CardTitle>
                  <CardDescription>
                    Gerenciamento de módulos e conteúdo pedagógico da disciplina.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SubjectModulesList subjectId={parseInt(id)} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="practice" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Simulados
                  </CardTitle>
                  <CardDescription>
                    Simulados para prática dos alunos durante o aprendizado dos módulos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuizList subjectId={parseInt(id)} quizType="practice" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assessment" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Avaliações Finais
                  </CardTitle>
                  <CardDescription>
                    Avaliações para testar o conhecimento adquirido ao final da disciplina.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuizList subjectId={parseInt(id)} quizType="final" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}