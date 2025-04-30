import React from 'react';
import { ClassForm } from '@/components/classes/class-form';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet';
import { usePortal } from '@/hooks/use-portal';
import { ArrowLeft } from 'lucide-react';

export function ClassCreatePage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { currentPortal } = usePortal();

  // Mutation para criar turma
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/classes', {
        method: 'POST',
        data,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Turma criada',
        description: 'A turma foi criada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      navigate(`${currentPortal.baseRoute}/classes/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar turma',
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
    <>
      <Helmet>
        <title>Nova Turma | Edunéxia</title>
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
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Nova Turma</h1>
          <p className="text-gray-500 mt-1">Preencha os campos abaixo para criar uma nova turma.</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <ClassForm
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
          />
        </div>
      </div>
    </>
  );
}