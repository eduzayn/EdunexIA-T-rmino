import React from 'react';
import { useLocation, useParams } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { SubjectForm } from '@/components/subjects/subject-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { usePortal } from '@/hooks/use-portal';
import { Helmet } from 'react-helmet';
import { AppShell } from '@/components/layout/app-shell';

export function SubjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentPortal } = usePortal();

  // Buscar detalhes da disciplina
  const { data: subject, isLoading, error } = useQuery({
    queryKey: [`/api/subjects/${id}`],
    enabled: !!id,
  });

  // Mutação para atualizar disciplina
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/subjects/${id}`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Disciplina atualizada',
        description: 'A disciplina foi atualizada com sucesso.',
      });
      navigate(`${currentPortal.baseRoute}/subjects`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar disciplina',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handler para submissão do formulário
  const handleSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

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
        <title>Editar Disciplina | Edunéxia</title>
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

        <div className="space-y-4">
          <h1 className="text-2xl font-bold mb-6">Editar Disciplina: {subject.title}</h1>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <SubjectForm 
              defaultValues={subject}
              onSubmit={handleSubmit}
              isSubmitting={updateMutation.isPending}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}