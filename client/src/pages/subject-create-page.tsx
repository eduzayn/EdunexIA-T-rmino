import React from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { SubjectForm } from '@/components/subjects/subject-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { usePortal } from '@/hooks/use-portal';
import { Helmet } from 'react-helmet';

export function SubjectCreatePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentPortal } = usePortal();
  const queryClient = useQueryClient();

  // Mutação para criar disciplina
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Enviando dados para API:", data);
      
      try {
        // Usando apenas a rota relativa "/api/subjects" sem o método no URL
        const response = await apiRequest("/api/subjects", {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        
        const responseData = await response.json();
        console.log("Resposta da API:", responseData);
        return responseData;
      } catch (error) {
        console.error("Erro na requisição:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar o cache para forçar uma nova busca das disciplinas
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      
      toast({
        title: 'Disciplina criada',
        description: 'A disciplina foi criada com sucesso.',
      });
      navigate(`${currentPortal.baseRoute}/subjects`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar disciplina',
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
        <title>Nova Disciplina | Edunéxia</title>
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
          <h1 className="text-2xl font-bold mb-6">Nova Disciplina</h1>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <SubjectForm 
              onSubmit={handleSubmit}
              isSubmitting={createMutation.isPending}
            />
          </div>
        </div>
      </div>
    </>
  );
}