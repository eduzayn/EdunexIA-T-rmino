import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Module, Lesson } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Tipo estendido de Module para incluir as lessons
interface ModuleWithLessons extends Module {
  lessons?: Lesson[];
}

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModuleForm } from "./module-form";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "../ui/alert-dialog";
import { Edit, File, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ModulesListProps {
  courseId: number;
}

export function ModulesList({ courseId }: ModulesListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);

  // Buscar módulos do curso
  const { data: modules, isLoading, error } = useQuery<ModuleWithLessons[]>({
    queryKey: ['/api/courses', courseId, 'modules'],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/modules`);
      if (!res.ok) throw new Error('Falha ao carregar módulos');
      return res.json();
    }
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
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] });
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
    // Redirecionar para página de criação de módulo
    window.location.href = `/admin/courses/${courseId}/modules/new`;
  };

  const handleEditModule = (moduleId: number) => {
    // Redirecionar para página de edição de módulo
    window.location.href = `/admin/courses/${courseId}/modules/${moduleId}/edit`;
  };

  const handleCancelEdit = () => {
    setEditingModuleId(null);
    setIsAddingModule(false);
  };

  const handleDeleteModule = (moduleId: number) => {
    deleteMutation.mutate(moduleId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Módulos do Curso</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
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
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Erro ao carregar módulos</CardTitle>
          <CardDescription>
            Ocorreu um erro ao tentar carregar os módulos deste curso.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] })}>
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Renderização do formulário de adição ou edição
  if (isAddingModule) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Adicionar Novo Módulo</h3>
        </div>
        <ModuleForm courseId={courseId} onCancel={handleCancelEdit} />
      </div>
    );
  }

  if (editingModuleId !== null) {
    const moduleToEdit = modules?.find((mod: ModuleWithLessons) => mod.id === editingModuleId);
    if (moduleToEdit) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Editar Módulo</h3>
          </div>
          <ModuleForm
            initialData={moduleToEdit}
            moduleId={editingModuleId}
            courseId={courseId}
            onCancel={handleCancelEdit}
          />
        </div>
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Módulos do Curso</h3>
        <Button onClick={handleAddModule} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Módulo
        </Button>
      </div>

      {modules && modules.length > 0 ? (
        <Accordion type="single" collapsible className="w-full space-y-2">
          {modules.map((module: ModuleWithLessons) => (
            <AccordionItem key={module.id} value={`module-${module.id}`} className="border rounded-md">
              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                <div className="flex items-center text-left">
                  <Badge variant="outline" className="mr-2">
                    {module.order}
                  </Badge>
                  <span>{module.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3">
                <div className="mb-4">
                  {module.description ? (
                    <p className="text-muted-foreground">{module.description}</p>
                  ) : (
                    <p className="text-muted-foreground italic">Sem descrição</p>
                  )}
                </div>
                
                {module.lessons && module.lessons.length > 0 ? (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Aulas ({module.lessons.length})</h4>
                    <ul className="space-y-2">
                      {module.lessons.map((lesson: Lesson) => (
                        <li key={lesson.id} className="flex items-center">
                          <File className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{lesson.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm italic">Nenhuma aula cadastrada</p>
                )}

                <div className="flex gap-2 mt-4">
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
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {deleteMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Excluindo...
                            </>
                          ) : (
                            "Sim, excluir"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum módulo encontrado</CardTitle>
            <CardDescription>
              Este curso ainda não possui módulos. Adicione o primeiro módulo para começar a estruturar o conteúdo.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleAddModule}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Módulo
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}