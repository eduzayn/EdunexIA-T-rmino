import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Lesson } from '@shared/schema';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Badge } from '@/components/ui/badge';
import { Edit, File, Trash2, Video, BookOpen, Plus } from 'lucide-react';
import { LessonForm } from './lesson-form';

interface LessonsListProps {
  moduleId: number;
  subjectId: number;
}

export function LessonsList({ moduleId, subjectId }: LessonsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('video');

  // Buscar lições do módulo
  const { 
    data: lessons = [], 
    isLoading, 
    error 
  } = useQuery<Lesson[]>({
    queryKey: [`/api/modules/${moduleId}/lessons`],
    enabled: !!moduleId,
  });

  // Filtra as lições por tipo (materialType)
  const videoLessons = lessons.filter(lesson => lesson.materialType === 'video');
  const ebookLessons = lessons.filter(lesson => ['ebook', 'pdf', 'scorm'].includes(lesson.materialType as string));

  // Mutação para excluir lição
  const deleteMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const res = await apiRequest("DELETE", `/api/lessons/${lessonId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Material removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/modules/${moduleId}/lessons`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover material",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleAddLesson = () => {
    setIsAddingLesson(true);
    setEditingLessonId(null);
  };

  const handleEditLesson = (lessonId: number) => {
    setEditingLessonId(lessonId);
    setIsAddingLesson(false);
  };

  const handleDeleteLesson = (lessonId: number) => {
    deleteMutation.mutate(lessonId);
  };

  const handleCancelEdit = () => {
    setIsAddingLesson(false);
    setEditingLessonId(null);
  };

  // Renderização condicional para estados de carregamento e erro
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Materiais do Módulo</CardTitle>
          <CardDescription>Carregando materiais...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Erro ao carregar materiais</CardTitle>
          <CardDescription>
            Ocorreu um erro ao tentar carregar os materiais deste módulo.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/modules/${moduleId}/lessons`] })}>
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Renderizar formulário de adição/edição
  if (isAddingLesson) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Adicionar Material ({activeTab === 'video' ? 'Vídeo' : 'E-book/PDF'})
          </h3>
        </div>
        <LessonForm 
          moduleId={moduleId} 
          materialType={activeTab as 'video' | 'ebook'}
          onCancel={handleCancelEdit} 
        />
      </div>
    );
  }

  if (editingLessonId !== null) {
    const lessonToEdit = lessons.find(lesson => lesson.id === editingLessonId);
    if (lessonToEdit) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Editar Material</h3>
          </div>
          <LessonForm
            moduleId={moduleId}
            lessonId={editingLessonId}
            initialData={lessonToEdit}
            materialType={lessonToEdit.materialType as 'video' | 'ebook'}
            onCancel={handleCancelEdit}
          />
        </div>
      );
    }
  }

  // Renderizar lista de lições
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Materiais do Módulo</CardTitle>
            <CardDescription>
              Gerencie os materiais didáticos deste módulo
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="video" onClick={() => setActiveTab('video')}>
              <Video className="h-4 w-4 mr-2" />
              Vídeos
            </TabsTrigger>
            <TabsTrigger value="ebook" onClick={() => setActiveTab('ebook')}>
              <BookOpen className="h-4 w-4 mr-2" />
              E-books/PDFs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video">
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Vídeo Aulas ({videoLessons.length})</h3>
                <Button size="sm" onClick={handleAddLesson}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Vídeo
                </Button>
              </div>

              {videoLessons.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <Video className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">Nenhum vídeo disponível</h3>
                  <p className="text-muted-foreground mb-4">Adicione vídeos para este módulo.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {videoLessons.map((lesson) => (
                    <Card key={lesson.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-2 rounded">
                          <Video className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-medium">{lesson.title}</h4>
                              {lesson.description && (
                                <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                              )}
                              <div className="flex gap-2 mt-2">
                                {lesson.videoProvider && (
                                  <Badge variant="outline" className="capitalize">
                                    {lesson.videoProvider}
                                  </Badge>
                                )}
                                {lesson.duration && (
                                  <Badge variant="outline">
                                    {lesson.duration} min
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditLesson(lesson.id)}
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
                                    <AlertDialogTitle>Excluir Vídeo</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o vídeo "{lesson.title}"?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteLesson(lesson.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ebook">
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">E-books e PDFs ({ebookLessons.length})</h3>
                <Button size="sm" onClick={handleAddLesson}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar E-book/PDF
                </Button>
              </div>

              {ebookLessons.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">Nenhum e-book disponível</h3>
                  <p className="text-muted-foreground mb-4">Adicione e-books ou PDFs para este módulo.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ebookLessons.map((lesson) => (
                    <Card key={lesson.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-2 rounded">
                          {lesson.materialType === 'ebook' ? (
                            <BookOpen className="h-8 w-8 text-primary" />
                          ) : (
                            <File className="h-8 w-8 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-medium">{lesson.title}</h4>
                              {lesson.description && (
                                <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                              )}
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="capitalize">
                                  {lesson.materialType === 'ebook' ? 'E-book' : 
                                   lesson.materialType === 'pdf' ? 'PDF' : 
                                   lesson.materialType === 'scorm' ? 'SCORM' : 
                                   lesson.materialType}
                                </Badge>
                                {lesson.fileType && (
                                  <Badge variant="outline">
                                    {lesson.fileType}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditLesson(lesson.id)}
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
                                    <AlertDialogTitle>Excluir Material</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o material "{lesson.title}"?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteLesson(lesson.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}