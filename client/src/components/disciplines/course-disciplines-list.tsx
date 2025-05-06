import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ChevronDown, ChevronUp, ChevronRight, Edit, Layers, Plus, Trash2, BookOpen, 
  Grid3x3, FileText, PlayCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Subject } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Tipo para os dados retornados pela API
interface CourseDiscipline {
  id: number;
  courseId: number;
  subjectId: number;
  order: number;
  subject: Subject;
  modules?: Array<{
    id: number;
    title: string;
    description?: string;
    order: number;
    lessons?: Array<{
      id: number;
      title: string;
      description?: string;
      order: number;
      materialType?: string;
      materialUrl?: string;
    }>;
    quizzes?: Array<{
      id: number;
      title: string;
      description?: string;
      quizType: string;
      questions?: Array<{
        id: number;
        questionText: string;
        questionType: string;
      }>;
    }>;
  }>;
}

// Props para o componente
interface CourseDisciplinesListProps {
  courseId: number;
}

export function CourseDisciplinesList({ courseId }: CourseDisciplinesListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedDisciplines, setExpandedDisciplines] = useState<number[]>([]);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  
  // Consulta para buscar disciplinas do curso
  const {
    data: courseDisciplines,
    isLoading: isLoadingDisciplines,
    error: disciplinesError
  } = useQuery<CourseDiscipline[]>({
    queryKey: ['/api/courses', courseId, 'disciplines'],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}/subjects`);
      if (!response.ok) throw new Error('Falha ao carregar disciplinas');
      return response.json();
    }
  });
  
  // Consulta para buscar todas as disciplinas disponíveis para adicionar
  const {
    data: availableSubjects,
    isLoading: isLoadingSubjects
  } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    queryFn: async () => {
      const response = await fetch('/api/subjects');
      if (!response.ok) throw new Error('Falha ao carregar disciplinas disponíveis');
      return response.json();
    }
  });
  
  // Mutation para adicionar disciplina ao curso
  const addDisciplineMutation = useMutation({
    mutationFn: async (subjectId: number) => {
      return apiRequest('POST', '/api/courses/' + courseId + '/subjects', { subjectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'disciplines'] });
      toast({
        title: "Disciplina adicionada com sucesso!",
        variant: "default"
      });
      setShowAddDialog(false);
      setSelectedSubject("");
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar disciplina",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  });
  
  // Mutation para remover disciplina do curso
  const removeDisciplineMutation = useMutation({
    mutationFn: async (courseSubjectId: number) => {
      return apiRequest('DELETE', '/api/courses/' + courseId + '/subjects/' + courseSubjectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'disciplines'] });
      toast({
        title: "Disciplina removida com sucesso!",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover disciplina",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  });
  
  // Funções para expandir/recolher disciplinas e módulos
  const toggleDiscipline = (id: number) => {
    setExpandedDisciplines(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  
  const toggleModule = (id: number) => {
    setExpandedModules(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  
  // Função para adicionar uma disciplina ao curso
  const handleAddDiscipline = () => {
    if (!selectedSubject) {
      toast({
        title: "Selecione uma disciplina",
        description: "Você precisa selecionar uma disciplina para adicionar ao curso.",
        variant: "destructive"
      });
      return;
    }
    
    const subjectId = parseInt(selectedSubject);
    addDisciplineMutation.mutate(subjectId);
  };
  
  // Função para remover uma disciplina do curso
  const handleRemoveDiscipline = (courseSubjectId: number, subjectTitle: string) => {
    if (confirm(`Tem certeza que deseja remover a disciplina "${subjectTitle}" deste curso?`)) {
      removeDisciplineMutation.mutate(courseSubjectId);
    }
  };
  
  // Renderiza o estado de carregamento
  if (isLoadingDisciplines) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Disciplinas do Curso</h3>
          <Skeleton className="h-9 w-[180px]" />
        </div>
        
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // Renderiza erro, se houver
  if (disciplinesError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Erro ao carregar disciplinas</AlertTitle>
        <AlertDescription>
          Não foi possível carregar as disciplinas deste curso. Por favor, tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Disciplinas do Curso</h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar Disciplina
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Disciplina ao Curso</DialogTitle>
              <DialogDescription>
                Selecione uma disciplina para adicionar a este curso.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Select 
                onValueChange={setSelectedSubject}
                value={selectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingSubjects ? (
                    <SelectItem value="loading" disabled>Carregando disciplinas...</SelectItem>
                  ) : availableSubjects && availableSubjects.length > 0 ? (
                    availableSubjects
                      // Filtra disciplinas que já estão no curso
                      .filter(subject => 
                        !courseDisciplines?.some(cd => cd.subjectId === subject.id)
                      )
                      .map(subject => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.title} - {subject.code}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="none" disabled>Nenhuma disciplina disponível</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddDiscipline}
                disabled={addDisciplineMutation.isPending || !selectedSubject}
              >
                {addDisciplineMutation.isPending ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {!courseDisciplines || courseDisciplines.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <CardTitle className="text-lg font-medium mb-2">Nenhuma disciplina adicionada</CardTitle>
            <CardDescription className="mb-4">
              Este curso ainda não possui disciplinas. Adicione disciplinas para começar a estruturar o conteúdo.
            </CardDescription>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar Disciplina
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courseDisciplines?.map((courseDiscipline) => {
            const isExpanded = expandedDisciplines.includes(courseDiscipline.id);
            
            return (
              <Card key={courseDiscipline.id} className={isExpanded ? "border-primary/30" : ""}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => toggleDiscipline(courseDiscipline.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <div>
                        <CardTitle className="text-base font-medium flex items-center">
                          {courseDiscipline.subject?.title || `Disciplina ${courseDiscipline.id}`}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {courseDiscipline.subject?.code || `ID: ${courseDiscipline.subjectId}`}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {courseDiscipline.subject?.description || "Sem descrição"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <Link href={`/admin/subjects/${courseDiscipline.subject?.id || courseDiscipline.subjectId}`}>
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveDiscipline(courseDiscipline.id, courseDiscipline.subject?.title || `Disciplina ${courseDiscipline.subjectId}`)}
                        disabled={removeDisciplineMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <>
                    <Separator />
                    <CardContent className="p-4 pt-3">
                      {!courseDiscipline.modules || courseDiscipline.modules.length === 0 ? (
                        <div className="text-center py-4">
                          <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Esta disciplina ainda não possui módulos.</p>
                          <Button 
                            variant="link" 
                            className="mt-1" 
                            asChild
                          >
                            <Link href={`/admin/subjects/${courseDiscipline.id}/modules/new`}>
                              Adicionar Módulo
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {courseDiscipline.modules?.map((module) => {
                            const isModuleExpanded = expandedModules.includes(module.id);
                            
                            return (
                              <div key={module.id} className="border rounded-md">
                                <div 
                                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50"
                                  onClick={() => toggleModule(module.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    {isModuleExpanded ? 
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    }
                                    <div>
                                      <p className="font-medium text-sm">{module.title}</p>
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {module.description || "Sem descrição"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {module.lessons?.length || 0} aulas
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {module.quizzes?.length || 0} avaliações
                                    </Badge>
                                  </div>
                                </div>
                                
                                {isModuleExpanded && (
                                  <div className="px-3 pb-3 pt-1">
                                    {/* Aulas */}
                                    {module.lessons && module.lessons.length > 0 && (
                                      <div className="mb-3">
                                        <p className="text-xs font-medium mb-1.5 pl-6">Aulas</p>
                                        <div className="space-y-1">
                                          {module.lessons.map((lesson) => (
                                            <div 
                                              key={lesson.id} 
                                              className="flex items-center pl-6 py-1 text-sm"
                                            >
                                              <PlayCircle className="h-4 w-4 text-primary mr-2" />
                                              <span>{lesson.title}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Avaliações */}
                                    {module.quizzes && module.quizzes.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium mb-1.5 pl-6">Avaliações</p>
                                        <div className="space-y-1">
                                          {module.quizzes.map((quiz) => (
                                            <div 
                                              key={quiz.id} 
                                              className="flex items-center pl-6 py-1 text-sm"
                                            >
                                              {quiz.quizType === 'practice' ? (
                                                <Grid3x3 className="h-4 w-4 text-amber-500 mr-2" />
                                              ) : (
                                                <FileText className="h-4 w-4 text-blue-500 mr-2" />
                                              )}
                                              <span>
                                                {quiz.title} 
                                                <Badge 
                                                  variant="outline" 
                                                  className={`ml-2 text-xs ${quiz.quizType === 'practice' ? 'bg-amber-50' : 'bg-blue-50'}`}
                                                >
                                                  {quiz.quizType === 'practice' ? 'Simulado' : 'Avaliação Final'}
                                                </Badge>
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="px-4 py-3 bg-accent/10">
                      <div className="w-full flex items-center justify-between">
                        <div className="flex space-x-1">
                          <Badge variant="secondary" className="text-xs">
                            {courseDiscipline.modules?.length || 0} módulos
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {courseDiscipline.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} aulas
                          </Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                        >
                          <Link href={`/admin/subjects/${courseDiscipline.subject?.id || courseDiscipline.subjectId}`}>
                            Gerenciar Disciplina
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}