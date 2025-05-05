import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertModuleSchema } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

// Estendendo o schema para validação do formulário
const formSchema = insertModuleSchema
  .extend({
    title: z.string().min(3, {
      message: 'O título do módulo deve ter pelo menos 3 caracteres.',
    }),
  });

// Tipagem dos dados do formulário
type FormData = z.infer<typeof formSchema>;

interface SubjectModuleFormProps {
  subjectId: number;
  defaultValues?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  isSubmitting: boolean;
}

export function SubjectModuleForm({ 
  subjectId, 
  defaultValues, 
  onSubmit, 
  isSubmitting 
}: SubjectModuleFormProps) {
  const { toast } = useToast();

  // Valores padrão para o formulário
  const defaultFormValues: Partial<FormData> = {
    title: '',
    description: '',
    order: 1,
    ...defaultValues,
    subjectId: subjectId, // Sempre usar o subjectId fornecido como prop
  };

  // Inicialização do formulário
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  // Handler para submissão do formulário
  const handleSubmit = (data: FormData) => {
    try {
      console.log("Form data:", data);
      onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: 'Erro ao processar o formulário',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Campo oculto para subjectId */}
        <input type="hidden" {...form.register('subjectId')} />

        {/* Título do módulo */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Módulo</FormLabel>
              <FormControl>
                <Input placeholder="Digite o título do módulo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descrição do módulo */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o conteúdo e objetivos deste módulo"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ordem do módulo */}
        <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ordem</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="Posição do módulo na sequência"
                  {...field}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    field.onChange(isNaN(value) ? 1 : value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botões de ação */}
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : defaultValues?.id ? 'Atualizar Módulo' : 'Criar Módulo'}
          </Button>
        </div>
      </form>
    </Form>
  );
}