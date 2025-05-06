import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, FileQuestion, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Quiz } from '@shared/schema';

// Interface estendida para o Quiz com a contagem de questões
interface QuizWithQuestionCount extends Quiz {
  questionCount?: number;
}

interface QuizListProps {
  subjectId: number;
  quizType: 'practice' | 'final'; // 'practice' para simulados, 'final' para avaliações finais
}

export function QuizList({ subjectId, quizType }: QuizListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Buscar quizzes da disciplina
  const { data: quizzes = [], isLoading, error } = useQuery<QuizWithQuestionCount[]>({
    queryKey: ['/api/quizzes', { subjectId, quizType }],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/quizzes?subjectId=${subjectId}&quizType=${quizType}`);
        if (!res.ok) throw new Error(`Falha ao carregar ${quizType === 'practice' ? 'simulados' : 'avaliações'}`);
        return res.json();
      } catch (error) {
        console.error('Erro ao buscar quizzes:', error);
        return [];
      }
    },
    refetchOnWindowFocus: false,
  });

  // Mutation para excluir quiz
  const deleteMutation = useMutation({
    mutationFn: async (quizId: number) => {
      const res = await apiRequest("DELETE", `/api/quizzes/${quizId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: quizType === 'practice' ? "Simulado excluído com sucesso" : "Avaliação excluída com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes', { subjectId, quizType }] });
    },
    onError: (error: Error) => {
      toast({
        title: `Erro ao excluir ${quizType === 'practice' ? 'simulado' : 'avaliação'}`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddQuiz = () => {
    navigate(`/admin/subjects/${subjectId}/quizzes/new?type=${quizType}`);
  };

  const handleEditQuiz = (quizId: number) => {
    navigate(`/admin/subjects/${subjectId}/quizzes/${quizId}/edit`);
  };

  const handleDeleteQuiz = (quizId: number) => {
    deleteMutation.mutate(quizId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {quizType === 'practice' ? 'Simulados' : 'Avaliações Finais'}
          </h3>
        </div>
        {[1, 2].map((i) => (
          <Card key={i} className="mb-4">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
        <p>Erro ao carregar {quizType === 'practice' ? 'simulados' : 'avaliações'}: {(error as Error).message}</p>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {quizType === 'practice' ? 'Simulados da Disciplina' : 'Avaliações Finais da Disciplina'}
          </h3>
          <Button onClick={handleAddQuiz} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {quizType === 'practice' ? 'Adicionar Simulado' : 'Adicionar Avaliação'}
          </Button>
        </div>
        
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FileQuestion className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-2">
            {quizType === 'practice' 
              ? 'Nenhum simulado encontrado' 
              : 'Nenhuma avaliação final encontrada'}
          </h3>
          <p className="text-gray-500 mb-4">
            {quizType === 'practice'
              ? 'Esta disciplina ainda não possui simulados para prática.'
              : 'Esta disciplina ainda não possui avaliações finais.'}
          </p>
          <Button onClick={handleAddQuiz}>
            <Plus className="h-4 w-4 mr-2" />
            {quizType === 'practice' ? 'Criar primeiro simulado' : 'Criar primeira avaliação'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {quizType === 'practice' 
            ? `Simulados da Disciplina (${quizzes.length})` 
            : `Avaliações Finais da Disciplina (${quizzes.length})`}
        </h3>
        <Button onClick={handleAddQuiz} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {quizType === 'practice' ? 'Adicionar Simulado' : 'Adicionar Avaliação'}
        </Button>
      </div>

      <div className="grid gap-4">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>{quiz.title}</CardTitle>
                <div className="flex gap-2">
                  {quiz.isActive ? (
                    <Badge variant="default">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {quiz.description && (
                <CardDescription className="text-gray-600 mt-2">
                  {quiz.description}
                </CardDescription>
              )}
              
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center text-sm text-gray-500">
                  <FileQuestion className="w-4 h-4 mr-1" />
                  <span>{quiz.questionCount || 0} questões</span>
                </div>
                
                {quiz.timeLimit && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{quiz.timeLimit} minutos</span>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>Mínimo: {quiz.passingScore || 70}%</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end pt-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditQuiz(quiz.id)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {quizType === 'practice' ? 'Excluir Simulado' : 'Excluir Avaliação Final'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir "{quiz.title}"?
                        Esta ação também removerá todas as questões associadas e não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}