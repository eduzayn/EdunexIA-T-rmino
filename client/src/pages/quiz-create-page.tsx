import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuizForm } from '@/components/quizzes/quiz-form';
import { ArrowLeft } from 'lucide-react';

interface ParamTypes {
  subjectId: string;
}

export default function QuizCreatePage() {
  const { subjectId } = useParams<ParamTypes>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Obter o tipo de quiz (simulado ou avaliação final) dos parâmetros de query
  const searchParams = new URLSearchParams(window.location.search);
  const quizType = searchParams.get('type') === 'final' ? 'final' : 'practice';
  
  // Mutation para criar novo quiz
  const createQuizMutation = useMutation({
    mutationFn: async (data: any) => {
      // Adicionar o ID da disciplina
      const quizData = {
        ...data,
        subjectId: Number(subjectId),
      };
      
      const res = await apiRequest("POST", `/api/quizzes`, quizData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Falha ao criar simulado');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: quizType === 'practice' ? 'Simulado criado com sucesso' : 'Avaliação final criada com sucesso',
        description: `O ${quizType === 'practice' ? 'simulado' : 'a avaliação'} "${data.title}" foi salvo(a).`,
      });
      
      // Redirecionar para a página da disciplina
      navigate(`/admin/subjects/${subjectId}`);
      
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes', { subjectId: Number(subjectId), quizType }] });
    },
    onError: (error: Error) => {
      toast({
        title: `Erro ao criar ${quizType === 'practice' ? 'simulado' : 'avaliação final'}`,
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  const handleSubmit = (data: any) => {
    setIsSubmitting(true);
    createQuizMutation.mutate(data);
  };
  
  return (
    <>
      <Helmet>
        <title>
          {quizType === 'practice'
            ? 'Novo Simulado | EdunéxIA'
            : 'Nova Avaliação Final | EdunéxIA'}
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
              {quizType === 'practice' ? 'Novo Simulado' : 'Nova Avaliação Final'}
            </h1>
            <p className="text-gray-500 mt-1">
              {quizType === 'practice'
                ? 'Crie um simulado para prática dos alunos'
                : 'Crie uma avaliação final para avaliar o aprendizado'
              }
            </p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <QuizForm
                quizType={quizType === 'final' ? 'final' : 'practice'}
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