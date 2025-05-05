import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { insertModuleSchema } from "@shared/schema";
import { Module } from "@shared/schema";

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
  Card,
  CardContent, 
  CardDescription, 
  CardFooter,
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

// Estendendo o esquema do módulo para adicionar validações adicionais
const moduleFormSchema = insertModuleSchema.extend({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
});

// Tipo inferido do schema do form
type ModuleFormValues = z.infer<typeof moduleFormSchema>;

interface ModuleFormProps {
  initialData?: Module;
  moduleId?: number;
  subjectId: number;
  courseId?: number; // Usado apenas para navegação
  onCancel?: () => void;
}

export function ModuleForm({ initialData, moduleId, subjectId, courseId, onCancel }: ModuleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const isEditMode = Boolean(initialData && moduleId);

  // Valores iniciais
  const defaultValues: Partial<ModuleFormValues> = {
    title: initialData?.title || "",
    description: initialData?.description || "",
    subjectId: initialData?.subjectId || subjectId,
    order: initialData?.order || undefined,
  };

  // Configurar formulário
  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues,
    mode: "onChange"
  });

  // Mutation para criar módulo
  const createMutation = useMutation({
    mutationFn: async (data: ModuleFormValues) => {
      const res = await apiRequest("POST", "/api/modules", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Módulo criado com sucesso",
        description: "O módulo foi criado e está disponível no curso.",
      });
      // Atualizar para usar a nova queryKey de módulos filtrada por curso
      queryClient.invalidateQueries({ queryKey: ['/api/modules', { courseId }] });
      if (onCancel) {
        onCancel();
      } else {
        navigate(`/admin/courses/${courseId}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar módulo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar módulo
  const updateMutation = useMutation({
    mutationFn: async (data: ModuleFormValues) => {
      const res = await apiRequest("PUT", `/api/modules/${moduleId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Módulo atualizado com sucesso",
        description: "As alterações foram salvas com sucesso.",
      });
      // Atualizar para usar a nova queryKey de módulos filtrada por curso
      queryClient.invalidateQueries({ queryKey: ['/api/modules', { courseId }] });
      // Invalida também a consulta específica do módulo se necessário
      if (moduleId) {
        queryClient.invalidateQueries({ queryKey: ['/api/modules', moduleId] });
      }
      if (onCancel) {
        onCancel();
      } else {
        navigate(`/admin/courses/${courseId}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar módulo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função genérica para submissão
  const onSubmit = (data: ModuleFormValues) => {
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
        <CardTitle>{isEditMode ? "Editar Módulo" : "Novo Módulo"}</CardTitle>
        <CardDescription>
          {isEditMode 
            ? "Atualize as informações do módulo existente" 
            : "Crie um novo módulo para o curso"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Módulo</FormLabel>
                  <FormControl>
                    <Input placeholder="Insira o título do módulo" {...field} />
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
                      placeholder="Descreva o conteúdo e objetivos deste módulo"
                      className="min-h-32"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ordem de exibição no curso"
                      {...field}
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? undefined : parseInt(value));
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    A ordem determina a posição do módulo na lista. Deixe em branco para usar a próxima posição disponível.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <input type="hidden" {...form.register("subjectId")} />

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel || (() => navigate(`/admin/courses/${courseId}`))}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditMode ? "Atualizar Módulo" : "Criar Módulo"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}