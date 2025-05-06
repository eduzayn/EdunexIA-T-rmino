import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Edit, Trash2, FileQuestion, MoveUp, MoveDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { QuestionForm } from '@/components/quizzes/question-form';
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
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import type { Quiz, Question } from '@shared/schema';

interface ParamTypes {
  subjectId: string;
  quizId: string;
}

export default function QuizQuestionsPage() {
  const { subjectId, quizId } = useParams<ParamTypes>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  
  // Buscar quiz e suas questões
  const { data: quiz, isLoading: isQuizLoading, error: quizError } = useQuery<Quiz & { questions: Question[] }>({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !!quizId,
  });
  
  // Mutation para adicionar nova questão
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
      
      // Fechar o diálogo e resetar o estado
      setIsDialogOpen(false);
      setCurrentQuestion(null);
      setIsSubmitting(false);
      
      // Atualizar a lista de questões
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
  
  // Mutation para atualizar questão existente
  const updateQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/quizzes/${quizId}/questions/${data.id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Falha ao atualizar questão');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Questão atualizada com sucesso',
        description: 'As alterações foram salvas.',
      });
      
      // Fechar o diálogo e resetar o estado
      setIsDialogOpen(false);
      setCurrentQuestion(null);
      setIsSubmitting(false);
      
      // Atualizar a lista de questões
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar questão',
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  // Mutation para excluir questão
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const res = await apiRequest("DELETE", `/api/quizzes/${quizId}/questions/${questionId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Falha ao excluir questão');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Questão excluída com sucesso',
        description: 'A questão foi removida do simulado.',
      });
      
      // Atualizar a lista de questões
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir questão',
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Lidar com a submissão do formulário
  const handleQuestionSubmit = (data: any) => {
    setIsSubmitting(true);
    
    // Preparar os dados para envio
    const questionData = {
      ...data,
      quizId: Number(quizId),
    };
    
    // Determinar se é uma adição ou atualização
    if (currentQuestion?.id) {
      updateQuestionMutation.mutate({
        id: currentQuestion.id,
        ...questionData,
      });
    } else {
      addQuestionMutation.mutate(questionData);
    }
  };
  
  // Abrir diálogo para adicionar nova questão
  const handleAddQuestion = () => {
    setCurrentQuestion(null);
    setIsDialogOpen(true);
  };
  
  // Abrir diálogo para editar questão existente
  const handleEditQuestion = (question: Question) => {
    setCurrentQuestion(question);
    setIsDialogOpen(true);
  };
  
  // Lidar com o fechamento do diálogo
  const handleDialogClose = () => {
    if (!isSubmitting) {
      setIsDialogOpen(false);
      setCurrentQuestion(null);
    }
  };
  
  if (isQuizLoading) {
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
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between border p-4 rounded-md">
                    <div>
                      <Skeleton className="h-5 w-64 mb-2" />
                      <Skeleton className="h-4 w-96" />
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-9 w-9 rounded-md" />
                      <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }
  
  if (quizError || !quiz) {
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
            <p>Erro ao carregar simulado: {(quizError as Error)?.message || 'Simulado não encontrado'}</p>
          </div>
        </div>
      </AppShell>
    );
  }
  
  // Ordenar questões por ordem
  const orderedQuestions = [...(quiz.questions || [])].sort((a, b) => a.order - b.order);
  
  return (
    <>
      <Helmet>
        <title>
          {quiz.quizType === 'practice'
            ? `Questões do Simulado | ${quiz.title}`
            : `Questões da Avaliação | ${quiz.title}`}
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
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <FileQuestion className="h-6 w-6 mr-2 text-primary" />
                {quiz.quizType === 'practice' ? 'Questões do Simulado' : 'Questões da Avaliação'}
              </h1>
              <p className="text-gray-500 mt-1">{quiz.title}</p>
            </div>
            
            <Button onClick={handleAddQuestion}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Questão
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Questões</CardTitle>
              <CardDescription>
                {orderedQuestions.length === 0
                  ? `Este ${quiz.quizType === 'practice' ? 'simulado' : 'avaliação'} ainda não possui questões. Clique em "Adicionar Questão" para começar.`
                  : `Gerenciar as ${orderedQuestions.length} questões deste ${quiz.quizType === 'practice' ? 'simulado' : 'avaliação'}.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orderedQuestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileQuestion className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma questão cadastrada</p>
                  <Button variant="outline" className="mt-4" onClick={handleAddQuestion}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Primeira Questão
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderedQuestions.map((question, index) => (
                    <div 
                      key={question.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between border p-4 rounded-md hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="flex items-center mb-1">
                          <span className="font-semibold text-gray-600 mr-2">Questão {index + 1}</span>
                          <Badge variant={question.difficultyLevel <= 2 ? "outline" : question.difficultyLevel <= 4 ? "secondary" : "destructive"} className="ml-2">
                            {question.difficultyLevel <= 2 ? 'Fácil' : question.difficultyLevel <= 4 ? 'Médio' : 'Difícil'}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{question.questionText}</p>
                        <div className="mt-1 text-xs text-gray-500">
                          <span>{question.options.length} opções • </span>
                          <span>{question.options.filter(opt => opt.isCorrect).length} resposta(s) correta(s) • </span>
                          <span>{question.points} pontos</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditQuestion(question)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Questão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteQuestionMutation.mutate(question.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
      
      {/* Diálogo para adicionar/editar questão */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentQuestion ? 'Editar Questão' : 'Adicionar Nova Questão'}
            </DialogTitle>
            <DialogDescription>
              {currentQuestion 
                ? 'Modifique os detalhes da questão existente.' 
                : `Adicione uma nova questão a este ${quiz.quizType === 'practice' ? 'simulado' : 'avaliação'}.`}
            </DialogDescription>
          </DialogHeader>
          
          <QuestionForm
            defaultValues={currentQuestion || undefined}
            onSubmit={handleQuestionSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}