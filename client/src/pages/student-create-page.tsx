import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { StudentForm } from '@/components/students/student-form';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { usePortal } from '@/hooks/use-portal';
import { AppShell } from '@/components/layout/app-shell';

export function StudentCreatePage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { currentPortal } = usePortal();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/students', data);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao criar aluno');
      }
      
      return res.json();
    },
    onSuccess: (data: User) => {
      toast({
        title: 'Aluno criado com sucesso',
        description: `O aluno ${data.fullName} foi cadastrado.`,
      });
      navigate(`${currentPortal.baseRoute}/students`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar aluno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: any) => {
    // Remover o campo de confirmação de senha antes de enviar
    const { confirmPassword, ...studentData } = data;
    mutation.mutate(studentData);
  };

  return (
    <AppShell>
      <Helmet>
        <title>Novo Aluno | Edunéxia</title>
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
        
        <StudentForm 
          formTitle="Adicionar Novo Aluno"
          formDescription="Preencha os dados abaixo para cadastrar um novo aluno no sistema."
          submitLabel="Cadastrar Aluno"
          onSubmit={handleSubmit}
          isSubmitting={mutation.isPending}
        />
      </div>
    </AppShell>
  );
}