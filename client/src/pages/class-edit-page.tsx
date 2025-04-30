import React from 'react';
import { ClassForm } from '@/components/classes/class-form';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet';
import { usePortal } from '@/hooks/use-portal';
import { ArrowLeft } from 'lucide-react';

export function ClassEditPage({ params }: { params: { id: string } }) {
  const classId = parseInt(params.id);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { currentPortal } = usePortal();

  // Buscar dados da turma
  const { data: classData, isLoading, error } = useQuery({
    queryKey: [`/api/classes/${classId}`],
    queryFn: async () => {
      return await apiRequest(`/api/classes/${classId}`);
    },
    refetchOnWindowFocus: false,
  });

  // Mutation para atualizar turma
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/classes/${classId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Turma atualizada',
        description: 'A turma foi atualizada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${classId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      navigate(`${currentPortal.baseRoute}/classes/${classId}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar turma',
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
      <div className="container p-4 mx-auto">
        <p className="text-gray-500">Carregando detalhes da turma...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-4 mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
          <p>Erro ao carregar turma: {(error as Error).message}</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => navigate(`${currentPortal.baseRoute}/classes`)}
          >
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
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
    );
  }

  return (
    <>
      <Helmet>
        <title>Editar Turma | Edunéxia</title>
      </Helmet>
      <div className="container p-4 mx-auto">
        <Button 
          variant="ghost" 
          className="mb-2 -ml-2 flex items-center text-gray-600 hover:text-gray-900"
          onClick={() => navigate(`${currentPortal.baseRoute}/classes/${classId}`)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar para detalhes da turma
        </Button>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Editar Turma</h1>
          <p className="text-gray-500 mt-1">Código: {classData.code}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <ClassForm
            defaultValues={classData}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending}
          />
        </div>
      </div>
    </>
  );
}