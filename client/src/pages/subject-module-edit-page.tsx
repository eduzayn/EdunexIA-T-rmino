import React from 'react';
import { useLocation, useParams } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { SubjectModuleForm } from '@/components/modules/subject-module-form';
import { LessonsList } from '@/components/lessons/lessons-list';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { usePortal } from '@/hooks/use-portal';
import { Helmet } from 'react-helmet';
import { AppShell } from '@/components/layout/app-shell';
import type { Module, Subject } from '@shared/schema';

export function SubjectModuleEditPage() {
  const { subjectId, moduleId } = useParams<{ subjectId: string; moduleId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentPortal } = usePortal();

  // Buscar detalhes do módulo
  const { data: module, isLoading: isLoadingModule, error: moduleError } = useQuery<Module>({
    queryKey: [`/api/modules/${moduleId}`],
    enabled: !!moduleId,
  });

  // Buscar detalhes da disciplina
  const { data: subject, isLoading: isLoadingSubject } = useQuery<Subject>({
    queryKey: [`/api/subjects/${subjectId}`],
    enabled: !!subjectId,
  });

  // Mutação para atualizar módulo
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/modules/${moduleId}`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Módulo atualizado',
        description: 'O módulo foi atualizado com sucesso.',
      });
      navigate(`${currentPortal.baseRoute}/subjects/${subjectId}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar módulo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handler para submissão do formulário
  const handleSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  const isLoading = isLoadingModule || isLoadingSubject;

  if (isLoading) {
    return (
      <AppShell>
        <div className="container p-4 mx-auto">
          <p className="text-gray-500">Carregando detalhes do módulo...</p>
        </div>
      </AppShell>
    );
  }

  if (moduleError) {
    return (
      <AppShell>
        <div className="container p-4 mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
            <p>Erro ao carregar módulo: {(moduleError as Error).message}</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => navigate(`${currentPortal.baseRoute}/subjects/${subjectId}`)}
            >
              Voltar para disciplina
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!module) {
    return (
      <AppShell>
        <div className="container p-4 mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 p-4 rounded-md">
            <p>Módulo não encontrado.</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => navigate(`${currentPortal.baseRoute}/subjects/${subjectId}`)}
            >
              Voltar para disciplina
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Helmet>
        <title>Editar Módulo | Edunéxia</title>
      </Helmet>
      <div className="container p-4 mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(`${currentPortal.baseRoute}/subjects/${subjectId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para disciplina
        </Button>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold mb-6">
            Editar Módulo: {module.title}
            {subject && <span className="text-gray-500 ml-2">({subject.title})</span>}
          </h1>
          
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <SubjectModuleForm 
              subjectId={parseInt(subjectId)}
              defaultValues={module}
              onSubmit={handleSubmit}
              isSubmitting={updateMutation.isPending}
            />
          </div>
          
          {/* Lista de materiais educacionais */}
          <div className="mt-8">
            {/* Importando o componente de lista de lições dinamicamente */}
            {moduleId && parseInt(subjectId) && (
              <LessonsList 
                moduleId={parseInt(moduleId)} 
                subjectId={parseInt(subjectId)} 
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}