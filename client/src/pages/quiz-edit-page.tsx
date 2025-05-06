import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuizForm } from '@/components/quizzes/quiz-form';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Quiz } from '@shared/schema';

interface ParamTypes {
  subjectId: string;
  quizId: string;
}

export default function QuizEditPage() {
  const { subjectId, quizId } = useParams<ParamTypes>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Buscar quiz existente
  const { data: quiz, isLoading, error } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !!quizId,
  });
  
  // Mutation para atualizar quiz
  const updateQuizMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/quizzes/${quizId}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Falha ao atualizar');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.quizType === 'practice' ? 'Simulado atualizado com sucesso' : 'Avaliação atualizada com sucesso',
        description: `As alterações foram salvas.`,
      });
      
      // Redirecionar para a página da disciplina
      navigate(`/admin/subjects/${subjectId}`);
      
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes', { subjectId: Number(subjectId), quizType: data.quizType }] });
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: `Erro ao atualizar`,
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  const handleSubmit = (data: any) => {
    setIsSubmitting(true);
    updateQuizMutation.mutate({
      ...data,
      subjectId: Number(subjectId),
    });
  };
  
  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto py-6">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(`/admin/subjects/${subjectId}`)}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Voltar para a disciplina
            </Button>
          </div>
          
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-10 w-1/3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }
  
  if (error || !quiz) {
    return (
      <AppShell>
        <div className="container mx-auto py-6">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(`/admin/subjects/${subjectId}`)}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Voltar para a disciplina
            </Button>
          </div>
          
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
            <p>Erro ao carregar simulado: {(error as Error)?.message || 'Simulado não encontrado'}</p>
          </div>
        </div>
      </AppShell>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>
          {quiz.quizType === 'practice'
            ? `Editar Simulado | ${quiz.title}`
            : `Editar Avaliação Final | ${quiz.title}`}
        </title>
      </Helmet>
      
      <AppShell>
        <div className="container mx-auto py-6">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(`/admin/subjects/${subjectId}`)}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Voltar para a disciplina
            </Button>
          </div>
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              {quiz.quizType === 'practice' ? 'Editar Simulado' : 'Editar Avaliação Final'}
            </h1>
            <p className="text-gray-500 mt-1">
              {quiz.quizType === 'practice'
                ? 'Atualize as informações do simulado'
                : 'Atualize as informações da avaliação final'
              }
            </p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <QuizForm
                quizType={quiz.quizType}
                defaultValues={quiz}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </>
  );
}