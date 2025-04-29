import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { insertCourseSchema } from "@shared/schema";
import { Course } from "@shared/schema";

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
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  shortDescription: z.string().min(10, "A descrição curta deve ter pelo menos 10 caracteres"),
  description: z.string().optional().nullable(),
  area: z.string().min(1, "Selecione uma área"),
  courseCategory: z.string().min(1, "Selecione uma categoria"),
  price: z.coerce.number().optional().nullable().transform(val => val === 0 ? null : val), // Permitir curso gratuito
});

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
  const isEditMode = Boolean(initialData && courseId);

  // Valores iniciais
  const defaultValues: Partial<CourseFormValues> = {
    title: initialData?.title || "",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    area: initialData?.area || "",
    courseCategory: initialData?.courseCategory || "",
    price: initialData?.price || null,
    status: initialData?.status || "draft",
    imageUrl: initialData?.imageUrl || "",
  };

  // Configurar formulário
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues,
    mode: "onChange",
  });

  // Mutação para criar curso
  const createMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      const res = await apiRequest("POST", "/api/courses", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Curso criado com sucesso",
        description: "O curso foi criado e está disponível para configuração.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      navigate("/courses");
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
      navigate(`/courses/${courseId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar curso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função genérica para submissão
  const onSubmit = (data: CourseFormValues) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

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
                    Recomendado: imagem 16:9 com pelo menos 1280x720 pixels
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(courseId ? `/courses/${courseId}` : "/courses")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
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