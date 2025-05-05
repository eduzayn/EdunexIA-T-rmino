import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, BookOpen, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import type { Module } from '@shared/schema';

interface SubjectModulesListProps {
  subjectId: number;
}

export function SubjectModulesList({ subjectId }: SubjectModulesListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Buscar módulos da disciplina
  const { data: modules = [], isLoading, error } = useQuery<Module[]>({
    queryKey: ['/api/modules', { subjectId }],
    queryFn: async () => {
      const res = await fetch(`/api/modules?subjectId=${subjectId}`);
      if (!res.ok) throw new Error('Falha ao carregar módulos');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  // Mutation para excluir módulo
  const deleteMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const res = await apiRequest("DELETE", `/api/modules/${moduleId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Módulo excluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/modules', { subjectId }] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir módulo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddModule = () => {
    navigate(`/admin/subjects/${subjectId}/modules/new`);
  };

  const handleEditModule = (moduleId: number) => {
    navigate(`/admin/subjects/${subjectId}/modules/${moduleId}/edit`);
  };

  const handleDeleteModule = (moduleId: number) => {
    deleteMutation.mutate(moduleId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Módulos da Disciplina</h3>
        </div>
        {[1, 2, 3].map((i) => (
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
        <p>Erro ao carregar módulos: {(error as Error).message}</p>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Módulos da Disciplina</h3>
          <Button onClick={handleAddModule} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Módulo
          </Button>
        </div>
        
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <LayoutList className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-2">Nenhum módulo encontrado</h3>
          <p className="text-gray-500 mb-4">Esta disciplina ainda não possui módulos.</p>
          <Button onClick={handleAddModule}>
            <Plus className="h-4 w-4 mr-2" />
            Criar primeiro módulo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Módulos da Disciplina ({modules.length})</h3>
        <Button onClick={handleAddModule} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Módulo
        </Button>
      </div>

      <div className="grid gap-4">
        {modules.map((module) => (
          <Card key={module.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>{module.title}</CardTitle>
                <div className="text-sm text-gray-400">Ordem: {module.order}</div>
              </div>
            </CardHeader>
            
            <CardContent>
              {module.description && (
                <CardDescription className="text-gray-600 mt-2">
                  {module.description}
                </CardDescription>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between pt-0">
              <div>
                {/* Placeholder para contagem de aulas (a ser implementado) */}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditModule(module.id)}
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
                      <AlertDialogTitle>Excluir Módulo</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o módulo "{module.title}"?
                        Esta ação também removerá todas as aulas associadas e não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteModule(module.id)}
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