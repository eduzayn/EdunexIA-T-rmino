import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Lesson } from '@shared/schema';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { VideoIcon, BookOpenIcon, Loader2, AlignLeft, Clock, FileType, Link2 } from 'lucide-react';

// Define schemas para validação do formulário
const videoFormSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  materialType: z.literal('video'),
  videoUrl: z.string().url('Informe uma URL válida'),
  videoProvider: z.enum(['youtube', 'vimeo', 'google_drive', 'other']),
  duration: z.coerce.number().min(1, 'A duração deve ser maior que zero').optional(),
  isRequired: z.boolean().default(true),
  order: z.coerce.number().min(1, 'A ordem deve ser maior que zero').optional(),
});

const ebookFormSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  materialType: z.enum(['ebook', 'pdf', 'scorm']),
  fileUrl: z.string().url('Informe uma URL válida'),
  fileType: z.string().optional(),
  duration: z.coerce.number().min(1, 'O tempo estimado de leitura deve ser maior que zero').optional(),
  isRequired: z.boolean().default(true),
  order: z.coerce.number().min(1, 'A ordem deve ser maior que zero').optional(),
});

// Schema condicional baseado no tipo de material
const lessonFormSchema = z.discriminatedUnion('materialType', [
  videoFormSchema,
  ebookFormSchema,
]);

type LessonFormValues = z.infer<typeof lessonFormSchema>;

interface LessonFormProps {
  moduleId: number;
  lessonId?: number;
  initialData?: Lesson;
  materialType: 'video' | 'ebook';
  onCancel?: () => void;
}

// Exportando como default para poder usar importação dinâmica
function LessonFormComponent({ moduleId, lessonId, initialData, materialType, onCancel }: LessonFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(initialData && lessonId);
  const [isVideoUrlValid, setIsVideoUrlValid] = useState(true);

  // Extrair provedor e ID do vídeo da URL (para YouTube, Vimeo, etc.)
  const extractVideoInfo = (url: string) => {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return { provider: 'youtube' };
    }
    // Vimeo
    else if (url.includes('vimeo.com')) {
      return { provider: 'vimeo' };
    }
    // Google Drive
    else if (url.includes('drive.google.com')) {
      return { provider: 'google_drive' };
    }
    // Outros provedores
    else {
      return { provider: 'other' };
    }
  };

  // Valores padrão com base no tipo de material
  const getDefaultValues = (): Partial<LessonFormValues> => {
    if (initialData) {
      // Valores para edição
      if (initialData.materialType === 'video') {
        return {
          title: initialData.title,
          description: initialData.description || '',
          materialType: 'video',
          videoUrl: initialData.videoUrl || '',
          videoProvider: initialData.videoProvider || 'youtube',
          duration: initialData.duration || undefined,
          isRequired: initialData.isRequired ?? true,
          order: initialData.order,
        };
      } else {
        return {
          title: initialData.title,
          description: initialData.description || '',
          materialType: initialData.materialType as any || 'ebook',
          fileUrl: initialData.fileUrl || '',
          fileType: initialData.fileType || '',
          duration: initialData.duration || undefined,
          isRequired: initialData.isRequired ?? true,
          order: initialData.order,
        };
      }
    } else {
      // Valores para criação
      if (materialType === 'video') {
        return {
          title: '',
          description: '',
          materialType: 'video',
          videoUrl: '',
          videoProvider: 'youtube',
          duration: undefined,
          isRequired: true,
          order: undefined,
        };
      } else {
        return {
          title: '',
          description: '',
          materialType: 'ebook',
          fileUrl: '',
          fileType: '',
          duration: undefined,
          isRequired: true,
          order: undefined,
        };
      }
    }
  };

  // Configuração do formulário
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });

  // Mutação para criar lição
  const createMutation = useMutation({
    mutationFn: async (data: LessonFormValues) => {
      const res = await apiRequest('POST', `/api/modules/${moduleId}/lessons`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Material adicionado com sucesso',
        description: 'O material foi adicionado ao módulo.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/modules/${moduleId}/lessons`] });
      if (onCancel) {
        onCancel();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao adicionar material',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutação para atualizar lição
  const updateMutation = useMutation({
    mutationFn: async (data: LessonFormValues) => {
      const res = await apiRequest('PUT', `/api/lessons/${lessonId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Material atualizado com sucesso',
        description: 'As alterações foram salvas com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/modules/${moduleId}/lessons`] });
      if (onCancel) {
        onCancel();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar material',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Função para submissão do formulário
  const onSubmit = (data: LessonFormValues) => {
    // Se for vídeo, extrair informações da URL
    if (data.materialType === 'video') {
      const videoInfo = extractVideoInfo(data.videoUrl);
      data.videoProvider = videoInfo.provider as any;
    }
    
    // Adicionar moduleId aos dados
    const formData = {
      ...data,
      moduleId,
    };
    
    if (isEditMode) {
      updateMutation.mutate(formData as any);
    } else {
      createMutation.mutate(formData as any);
    }
  };

  // Estado de carregamento
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Renderizar formulário com base no tipo de material
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {materialType === 'video' ? (
            <VideoIcon className="h-6 w-6 text-primary" />
          ) : (
            <BookOpenIcon className="h-6 w-6 text-primary" />
          )}
          <div>
            <CardTitle>
              {isEditMode ? 'Editar' : 'Adicionar'} {materialType === 'video' ? 'Vídeo' : 'E-book/PDF'}
            </CardTitle>
            <CardDescription>
              {materialType === 'video'
                ? 'Adicione vídeos do YouTube, Vimeo ou Google Drive'
                : 'Adicione e-books, PDFs ou conteúdo SCORM'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <AlignLeft className="h-4 w-4" />
                Informações Básicas
              </h3>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o título do material" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva brevemente o material"
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {materialType === 'video' ? (
                // Campos específicos para vídeo
                <>
                  <Separator />
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <VideoIcon className="h-4 w-4" />
                    Informações do Vídeo
                  </h3>

                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Vídeo *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              const url = e.target.value;
                              // Detectar automaticamente o provedor
                              const { provider } = extractVideoInfo(url);
                              form.setValue('videoProvider', provider as any);
                              // Validar URL
                              try {
                                new URL(url);
                                setIsVideoUrlValid(true);
                              } catch {
                                setIsVideoUrlValid(false);
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Insira a URL completa do vídeo (YouTube, Vimeo ou Google Drive)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="videoProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provedor de Vídeo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o provedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="vimeo">Vimeo</SelectItem>
                            <SelectItem value="google_drive">Google Drive</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração (minutos)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Ex: 45"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Informe a duração aproximada do vídeo em minutos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                // Campos específicos para e-book/PDF
                <>
                  <Separator />
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <BookOpenIcon className="h-4 w-4" />
                    Informações do Material
                  </h3>

                  <FormField
                    control={form.control}
                    name="materialType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Material</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de material" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ebook">E-book</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="scorm">SCORM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fileUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Material *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://drive.google.com/file/d/..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Insira a URL do Google Drive ou outro serviço de armazenamento
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fileType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Arquivo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: PDF, EPUB, ZIP"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo Estimado de Leitura (minutos)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Ex: 60"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Informe o tempo estimado de leitura em minutos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Separator />
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Configurações Adicionais
              </h3>

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem de Exibição</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ex: 1"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Defina a ordem em que este material aparecerá no módulo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Material Obrigatório</FormLabel>
                      <FormDescription>
                        Define se o aluno precisa completar este material para finalizar o módulo
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Salvando...' : 'Adicionando...'}
                  </>
                ) : (
                  isEditMode ? 'Salvar Alterações' : 'Adicionar Material'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Exportações para uso em outros componentes
export { LessonFormComponent as LessonForm };
export default LessonFormComponent;