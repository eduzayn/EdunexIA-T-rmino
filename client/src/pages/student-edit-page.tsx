import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { StudentForm } from '@/components/students/student-form';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { usePortal } from '@/hooks/use-portal';
import { AppShell } from '@/components/layout/app-shell';

export function StudentEditPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const studentId = parseInt(params.id, 10);
  const { currentPortal } = usePortal();

  // Buscar dados do aluno
  const { data: student, isLoading, error } = useQuery<User>({
    queryKey: [`/api/students/${studentId}`],
    enabled: !isNaN(studentId),
  });

  // Mutação para atualizar aluno
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PUT', `/api/students/${studentId}`, data);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao atualizar aluno');
      }
      
      return res.json();
    },
    onSuccess: (data: User) => {
      toast({
        title: 'Aluno atualizado com sucesso',
        description: `Os dados de ${data.fullName} foram atualizados.`,
      });
      navigate(`${currentPortal.baseRoute}/students`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar aluno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: any) => {
    // Remover o campo de confirmação de senha antes de enviar
    const { confirmPassword, ...studentData } = data;
    
    // Só envia a senha se for preenchida
    if (!studentData.password) {
      delete studentData.password;
    }
    
    mutation.mutate(studentData);
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="container p-4 mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando dados do aluno...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !student) {
    return (
      <AppShell>
        <div className="container p-4 mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar dados</h2>
            <p className="text-red-600 mb-4">
              {error ? error.toString() : 'Aluno não encontrado'}
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate(`${currentPortal.baseRoute}/students`)}
            >
              Voltar para lista de alunos
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Helmet>
        <title>Editar Aluno | Edunéxia</title>
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
          formTitle={`Editar Aluno: ${student.fullName}`}
          formDescription="Atualize os dados do aluno conforme necessário."
          submitLabel="Salvar Alterações"
          onSubmit={handleSubmit}
          isSubmitting={mutation.isPending}
          defaultValues={{
            ...student,
            password: '',
            confirmPassword: '',
          }}
          isEditMode={true}
        />
      </div>
    </AppShell>
  );
}