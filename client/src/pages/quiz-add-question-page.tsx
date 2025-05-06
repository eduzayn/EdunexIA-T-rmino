import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { QuestionForm } from '@/components/quizzes/question-form';
import type { Quiz } from '@shared/schema';

interface ParamTypes {
  subjectId: string;
  quizId: string;
}

export default function QuizAddQuestionPage() {
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
  
  // Mutation para adicionar questão
  const addQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/quizzes/${quizId}/questions`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Falha ao adicionar questão');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Questão adicionada com sucesso',
        description: 'A questão foi adicionada ao simulado.',
      });
      
      // Redirecionar para a página de questões
      navigate(`/admin/subjects/${subjectId}/quizzes/${quizId}/questions`);
      
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao adicionar questão',
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  const handleSubmit = (data: any) => {
    setIsSubmitting(true);
    
    // Adicionar quizId e order aos dados
    const questionData = {
      ...data,
      quizId: Number(quizId),
      // A ordem será definida automaticamente pelo backend como a última posição
    };
    
    addQuestionMutation.mutate(questionData);
  };
  
  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/admin/subjects/${subjectId}/quizzes/${quizId}/questions`)}
            className="mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Voltar para questões
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle>Carregando...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </AppShell>
    );
  }
  
  if (error || !quiz) {
    return (
      <AppShell>
        <div className="container mx-auto py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/admin/subjects/${subjectId}`)}
            className="mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Voltar para a disciplina
          </Button>
          
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
            ? `Nova Questão | ${quiz.title}`
            : `Nova Questão | ${quiz.title}`}
        </title>
      </Helmet>
      
      <AppShell>
        <div className="container mx-auto py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/admin/subjects/${subjectId}/quizzes/${quizId}/questions`)}
            className="mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Voltar para questões
          </Button>
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center">
              <FileQuestion className="h-6 w-6 mr-2 text-primary" />
              Nova Questão
            </h1>
            <p className="text-gray-500 mt-1">
              Adicionar nova questão ao {quiz.quizType === 'practice' ? 'simulado' : 'avaliação'}: {quiz.title}
            </p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <QuestionForm
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