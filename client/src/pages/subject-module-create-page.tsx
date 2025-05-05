import React from 'react';
import { useLocation, useParams } from 'wouter';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { SubjectModuleForm } from '@/components/modules/subject-module-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { usePortal } from '@/hooks/use-portal';
import { Helmet } from 'react-helmet';
import { AppShell } from '@/components/layout/app-shell';
import type { Subject } from '@shared/schema';

export function SubjectModuleCreatePage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentPortal } = usePortal();
  const queryClient = useQueryClient();

  // Buscar detalhes da disciplina para mostrar no cabeçalho
  const { data: subject, isLoading: isLoadingSubject } = useQuery<Subject>({
    queryKey: [`/api/subjects/${subjectId}`],
    enabled: !!subjectId,
  });

  // Mutação para criar módulo
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Enviando dados para API:", data);
      
      try {
        const response = await apiRequest('POST', "/api/modules", data);
        const responseData = await response.json();
        console.log("Resposta da API:", responseData);
        return responseData;
      } catch (error) {
        console.error("Erro na requisição:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar o cache para forçar uma nova busca dos módulos
      queryClient.invalidateQueries({ queryKey: ['/api/modules', { subjectId: parseInt(subjectId) }] });
      
      toast({
        title: 'Módulo criado',
        description: 'O módulo foi criado com sucesso.',
      });
      navigate(`${currentPortal.baseRoute}/subjects/${subjectId}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar módulo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handler para submissão do formulário
  const handleSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <AppShell>
      <Helmet>
        <title>Adicionar Módulo | Edunéxia</title>
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
            Adicionar Módulo
            {subject && <span className="text-gray-500 ml-2">({subject.title})</span>}
          </h1>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <SubjectModuleForm 
              subjectId={parseInt(subjectId)}
              onSubmit={handleSubmit}
              isSubmitting={createMutation.isPending}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}