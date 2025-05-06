import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { insertCourseSchema } from "@shared/schema";
import { Course } from "@shared/schema";
import { ImageUpload } from "@/components/ui/image-upload";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

// Definição do esquema de validação do formulário
const courseFormSchema = insertCourseSchema.extend({
  code: z.number().optional(),
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  shortDescription: z.string().min(10, "A descrição curta deve ter pelo menos 10 caracteres"),
  description: z.string().optional().nullable(),
  area: z.string().min(1, "Selecione uma área").optional().nullable(),
  courseCategory: z.string().min(1, "Selecione uma categoria").optional().nullable(),
  price: z.number().nullable(),
  status: z.string(),
  imageUrl: z.string().optional().nullable(),
});

// Tipagem dos dados do formulário
type CourseFormValues = z.infer<typeof courseFormSchema>;

// Props para o componente de formulário
interface CourseFormProps {
  initialData?: Course | Course[];
  courseId?: number;
}

export function CourseFormFixed({ initialData, courseId }: CourseFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  // Verificar se estamos em modo de edição
  const isEditMode = !!initialData;
  
  // Extrair dados do curso da prop initialData
  const courseData = React.useMemo(() => {
    if (!initialData) return null;
    return Array.isArray(initialData) ? initialData[0] : initialData;
  }, [initialData]);
  
  // Log para debug
  console.log("[CourseFormFixed] Dados iniciais:", courseData);
  
  // Configurar o formulário com valores padrão
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    // Definir valores padrão iniciais para evitar campos controlados sem valor
    defaultValues: {
      code: undefined,
      title: "",
      shortDescription: "",
      description: "",
      area: undefined,
      courseCategory: undefined,
      price: null,
      status: "draft",
      imageUrl: "",
    }
  });
  
  // IMPORTANTE: Efeito para definir os valores do formulário quando os dados iniciais estiverem disponíveis
  useEffect(() => {
    if (courseData) {
      console.log("[CourseFormFixed] Atualizando formulário com dados:", courseData);
      
      // Timeout para garantir que o formulário está totalmente inicializado
      setTimeout(() => {
        try {
          // Definimos cada campo individualmente para garantir que são atualizados corretamente
          if (courseData.code) {
            form.setValue("code", courseData.code);
          }
          
          form.setValue("title", courseData.title || "");
          form.setValue("shortDescription", courseData.shortDescription || "");
          form.setValue("description", courseData.description || "");

          // Para os selects, garantimos que há um valor adequado e não apenas uma string vazia
          if (courseData.area) {
            form.setValue("area", courseData.area);
          }
          
          if (courseData.courseCategory) {
            form.setValue("courseCategory", courseData.courseCategory);
          }
          
          // Preço: converter de centavos para reais se existir
          if (courseData.price !== undefined && courseData.price !== null) {
            form.setValue("price", courseData.price / 100);
          } else {
            form.setValue("price", null);
          }
          
          // Status e imagem
          if (courseData.status) {
            form.setValue("status", courseData.status);
          } else {
            form.setValue("status", "draft");
          }
          
          if (courseData.imageUrl) {
            form.setValue("imageUrl", courseData.imageUrl);
          }
          
          if (courseData.tenantId) {
            form.setValue("tenantId", courseData.tenantId);
          }
          
          // Log dos valores definidos para debugging
          console.log("[CourseFormFixed] Valores definidos no formulário:", form.getValues());
        } catch (error) {
          console.error("[CourseFormFixed] Erro ao definir valores do formulário:", error);
        }
      }, 100);
    }
  }, [courseData, form]);

  // Mutação para criar curso
  const createMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      // Processar preço para centavos
      if (data.price !== null && data.price !== undefined) {
        data.price = Math.round(data.price * 100);
      }
      
      // Adicionar tenantId se não existir
      if (!data.tenantId) {
        data.tenantId = user?.tenantId || 1;
      }
      
      const res = await apiRequest("POST", "/api/courses", data);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Curso criado com sucesso",
        description: "O curso foi criado e está disponível para configuração.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      navigate("/admin/courses");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar curso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar curso
  const updateMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      // Processar preço para centavos
      if (data.price !== null && data.price !== undefined) {
        data.price = Math.round(data.price * 100);
      }
      
      // Adicionar tenantId se não existir
      if (!data.tenantId) {
        data.tenantId = user?.tenantId || 1;
      }
      
      const res = await apiRequest("PUT", `/api/courses/${courseId}`, data);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Curso atualizado com sucesso",
        description: "As alterações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId] });
      }
      navigate(`/admin/courses/${courseId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar curso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para fazer upload da imagem
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('image', imageFile);
      
      if (courseId) {
        formData.append('courseId', courseId.toString());
      }
      
      const response = await fetch('/api/course-images/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer upload da imagem');
      }
      
      const data = await response.json();
      setIsUploading(false);
      setUploadProgress(100);
      
      return data.imageUrl || null;
    } catch (error: any) {
      setIsUploading(false);
      toast({
        title: "Erro no upload da imagem",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Handler para submissão do formulário
  const handleFormSubmit = async (data: CourseFormValues) => {
    try {
      // Upload de imagem se necessário
      if (imageFile) {
        const imageUrl = await uploadImage();
        if (imageUrl) {
          data.imageUrl = imageUrl;
        }
      }
      
      // Executar a mutação apropriada
      if (isEditMode) {
        updateMutation.mutate(data);
      } else {
        createMutation.mutate(data);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar o curso",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Depurar valores atuais do formulário
  const debugValues = () => {
    console.log("[CourseFormFixed] Valores atuais:", form.getValues());
    console.log("[CourseFormFixed] Erros:", form.formState.errors);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditMode ? "Editar Curso" : "Novo Curso"}</CardTitle>
        <CardDescription>
          {isEditMode 
            ? "Atualize as informações do curso existente" 
            : "Crie um novo curso para sua plataforma educacional"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" className="mb-4" variant="outline" onClick={debugValues}>Debug</Button>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEditMode && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código do Curso</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          value={field.value || ""}
                          disabled={!isAdmin}
                          readOnly={!isAdmin}
                          type="number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Curso</FormLabel>
                    <FormControl>
                      <Input placeholder="Insira o título do curso" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value !== null && field.value !== undefined ? field.value : ""}
                      defaultValue={courseData?.area || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma área" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="development">Desenvolvimento</SelectItem>
                        <SelectItem value="business">Negócios</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="technology">Tecnologia</SelectItem>
                        <SelectItem value="education">Educação</SelectItem>
                        <SelectItem value="health">Saúde</SelectItem>
                        <SelectItem value="language">Idiomas</SelectItem>
                        <SelectItem value="other">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value !== null && field.value !== undefined ? field.value : ""}
                      defaultValue={courseData?.courseCategory || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="segunda_graduacao">Segunda Graduação</SelectItem>
                        <SelectItem value="segunda_licenciatura">Segunda Licenciatura</SelectItem>
                        <SelectItem value="formacao_pedagogica">Formação Pedagógica</SelectItem>
                        <SelectItem value="formacao_livre">Formação Livre</SelectItem>
                        <SelectItem value="profissionalizante">Profissionalizante</SelectItem>
                        <SelectItem value="sequencial">Sequencial</SelectItem>
                        <SelectItem value="graduacao">Graduação</SelectItem>
                        <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Curta</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Uma breve descrição do curso (será exibida nas listagens)" 
                      {...field}
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormDescription>
                    Máximo de 150 caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Detalhada</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhadamente o conteúdo do curso, objetivos de aprendizagem e público-alvo"
                      className="min-h-32"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Preço em R$ (deixe em branco para gratuito)"
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? null : parseFloat(value));
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Deixe em branco para curso gratuito
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value !== null && field.value !== undefined ? field.value : ""}
                      defaultValue={courseData?.status || "draft"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                        <SelectItem value="archived">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="URL da imagem de capa (opcional)"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Ou utilize o upload de imagem abaixo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Upload de Imagem</p>
                <ImageUpload
                  previewUrl={form.getValues("imageUrl") || ""}
                  onImageUpload={(file) => {
                    setImageFile(file);
                  }}
                  onImageRemove={() => {
                    setImageFile(null);
                    form.setValue("imageUrl", "");
                  }}
                  helperText="Arraste uma imagem ou clique para fazer upload"
                />
                {isUploading && (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs">Enviando imagem: {uploadProgress}%</span>
                  </div>
                )}
                {imageFile && !isUploading && (
                  <div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        const imageUrl = await uploadImage();
                        if (imageUrl) {
                          form.setValue("imageUrl", imageUrl);
                          toast({
                            title: "Imagem enviada",
                            description: "A imagem foi enviada com sucesso.",
                            variant: "default",
                          });
                        }
                      }}
                    >
                      Enviar imagem agora
                    </Button>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Clique para enviar a imagem antes de salvar o curso
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Recomendado: imagem 16:9 com pelo menos 1280x720 pixels
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(courseId ? `/admin/courses/${courseId}` : "/admin/courses")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              
              <Button 
                type="submit" 
                disabled={isPending}
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditMode ? "Atualizar Curso" : "Criar Curso"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}