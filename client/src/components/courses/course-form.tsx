import React, { useState } from "react";
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
  CardFooter,
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

// Estendendo o esquema de curso para adicionar validações adicionais
const courseFormSchema = insertCourseSchema.extend({
  code: z.number().optional(),
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  shortDescription: z.string().min(10, "A descrição curta deve ter pelo menos 10 caracteres"),
  description: z.string().optional().nullable(),
  area: z.string().min(1, "Selecione uma área"),
  courseCategory: z.string().min(1, "Selecione uma categoria"),
  price: z.coerce.number().optional().nullable().transform(val => val === 0 ? null : val), // Permitir curso gratuito
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  imageUrl: z.string().optional().nullable(),
});

// Debug para mostrar esquema
console.log("Schema de formulário:", courseFormSchema.shape);

// Tipo inferido do schema do formulário
type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  initialData?: Course;
  courseId?: number;
}

export function CourseForm({ initialData, courseId }: CourseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isEditMode = Boolean(initialData && courseId);
  const isAdmin = user?.role === "admin";
  
  // Estado para controlar o upload de imagem
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Valores iniciais
  const defaultValues: Partial<CourseFormValues> = {
    code: initialData?.code,
    title: initialData?.title || "",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    area: initialData?.area || "",
    courseCategory: initialData?.courseCategory || "",
    // Se tiver preço, converte de centavos para reais para exibição
    price: initialData?.price ? initialData.price / 100 : null,
    status: initialData?.status || "draft",
    imageUrl: initialData?.imageUrl || "",
  };

  // Configurar formulário
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues,
    mode: "onChange",
  });
  
  // Debug log para o formulário
  console.log("Form initialized:", { 
    defaultValues, 
    isEditMode,
    formState: form.formState
  });

  // Mutação para criar curso
  const createMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      console.log("mutationFn - Iniciando criação do curso:", data);
      try {
        // Verificar se o preço já é um valor em centavos (se contém casas decimais)
        // Se o número for inteiro e maior que 100, provavelmente já está em centavos
        if (data.price && data.price % 1 !== 0) {
          // Se tem casas decimais, converte para centavos
          data.price = Math.round(data.price * 100);
          console.log("mutationFn - Preço convertido para centavos:", data.price);
        }
        
        const res = await apiRequest("POST", "/api/courses", data);
        console.log("mutationFn - Resposta recebida:", res.status);
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("mutationFn - Erro retornado pelo servidor:", errorData);
          throw new Error(errorData.error || "Erro desconhecido ao criar curso");
        }
        
        const jsonResponse = await res.json();
        console.log("mutationFn - Curso criado com sucesso:", jsonResponse);
        return jsonResponse;
      } catch (error) {
        console.error("mutationFn - Exceção ao criar curso:", error);
        throw error;
      }
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
      console.error("onError - Erro capturado na mutação:", error);
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
      // Verificar se o preço já é um valor em centavos (se contém casas decimais)
      // Se o número for inteiro e maior que 100, provavelmente já está em centavos
      if (data.price && data.price % 1 !== 0) {
        // Se tem casas decimais, converte para centavos
        data.price = Math.round(data.price * 100);
        console.log("updateMutation - Preço convertido para centavos:", data.price);
      }
      
      const res = await apiRequest("PUT", `/api/courses/${courseId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Curso atualizado com sucesso",
        description: "As alterações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId] });
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
      
      // Se estiver editando um curso, incluir o ID do curso
      if (courseId) {
        formData.append('courseId', courseId.toString());
      }
      
      console.log("Enviando upload de imagem:", { 
        fileSize: imageFile.size,
        fileType: imageFile.type,
        fileName: imageFile.name,
        courseId: courseId 
      });
      
      const response = await fetch('/api/course-images/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro no upload de imagem:", errorData);
        throw new Error(errorData.error || 'Erro ao fazer upload da imagem');
      }
      
      const data = await response.json();
      console.log("Resposta do upload de imagem:", data);
      setIsUploading(false);
      setUploadProgress(100);
      
      return data.imageUrl;
    } catch (error: any) {
      console.error("Exceção no upload de imagem:", error);
      setIsUploading(false);
      toast({
        title: "Erro no upload da imagem",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Função genérica para submissão
  const onSubmit = async (data: CourseFormValues) => {
    try {
      console.log("===== FORMULÁRIO SUBMETIDO =====");
      console.log("Iniciando submissão de formulário de curso", data);
      
      // Se houver uma imagem para upload, fazer o upload primeiro
      if (imageFile) {
        console.log("Executando upload de imagem antes de salvar o curso");
        const imageUrl = await uploadImage();
        if (imageUrl) {
          data.imageUrl = imageUrl;
          console.log("Upload de imagem concluído, URL:", imageUrl);
        } else {
          console.warn("Upload de imagem falhou ou retornou URL nula");
          // Se o upload falhar, defina a URL da imagem para null em vez de string vazia
          data.imageUrl = null;
        }
      } else if (data.imageUrl === '') {
        // Se não houver arquivo para upload e a URL está vazia, define como null
        // para evitar problemas com strings vazias
        data.imageUrl = null;
      }
      
      // Log de validação de formulário
      console.log("Estado do formulário:", form.formState);
      console.log("Erros de validação:", form.formState.errors);
      
      // Mostrar dados que serão enviados
      console.log("Dados do curso a serem enviados:", data);
      
      if (isEditMode) {
        console.log("Modo de edição: Atualizando curso existente");
        updateMutation.mutate(data);
      } else {
        console.log("Modo de criação: Criando novo curso");
        createMutation.mutate(data, {
          onError: (error: any) => {
            console.error("Erro na criação do curso:", error);
            // Mostrar mensagem de erro detalhada
            let errorMessage = error.message;
            if (error.response?.data?.details) {
              errorMessage += ": " + JSON.stringify(error.response.data.details);
            }
            toast({
              title: "Erro ao criar curso",
              description: errorMessage,
              variant: "destructive",
            });
          }
        });
      }
    } catch (error: any) {
      console.error("Exceção ao salvar o curso:", error);
      toast({
        title: "Erro ao salvar o curso",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isUploading;

  // Função para mostrar valores do form em debug
  const debugFormValues = () => {
    console.log("Valores atuais do form:", form.getValues());
    console.log("Erros do form:", form.formState.errors);
    console.log("Estado de validação:", form.formState.isValid);
    // Forçar validação
    form.trigger();
  };

  // Efeito para debugar quando o componente montar
  React.useEffect(() => {
    console.log("Form montado, verificando valores iniciais");
    setTimeout(() => {
      debugFormValues();
    }, 500);
  }, []);

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          value={field.value || "Gerado automaticamente"}
                          disabled={!isEditMode || !isAdmin}
                          readOnly={!isAdmin}
                          type="number"
                        />
                      </FormControl>
                      <FormDescription>
                        {isAdmin 
                          ? "Como administrador, você pode editar o código do curso"
                          : "O código do curso é gerado automaticamente e só pode ser editado por administradores"}
                      </FormDescription>
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
                      defaultValue={field.value}
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
                      defaultValue={field.value}
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
                    <Input placeholder="Uma breve descrição do curso (será exibida nas listagens)" {...field} />
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
                      defaultValue={field.value}
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
                  previewUrl={initialData?.imageUrl || ""}
                  onImageUpload={(file) => setImageFile(file)}
                  onImageRemove={() => setImageFile(null)}
                  helperText="Arraste uma imagem ou clique para fazer upload"
                />
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
                type="button" 
                disabled={isPending}
                onClick={() => {
                  // Pegar os valores atuais do formulário
                  const values = form.getValues();
                  
                  // Adicionar o tenantId que estava faltando (o erro que causava falha na validação)
                  values.tenantId = user?.tenantId || 1;
                  
                  // Converter o preço para inteiros (centavos) como esperado pelo servidor
                  if (values.price) {
                    // Multiplicar por 100 para converter para centavos e arredondar para inteiro
                    values.price = Math.round(values.price * 100);
                  }
                  
                  console.log("Enviando dados do curso com tenantId:", values);
                  
                  // Enviar direto usando a mutation (bypass do form)
                  if (isEditMode) {
                    updateMutation.mutate(values);
                  } else {
                    createMutation.mutate(values);
                  }
                }}
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