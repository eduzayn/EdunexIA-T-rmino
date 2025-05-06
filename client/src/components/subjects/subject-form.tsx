import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertSubjectSchema } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
const formSchema = insertSubjectSchema
  .omit({ tenantId: true }) // Remover campos que serão preenchidos pelo servidor
  .extend({
    title: z.string().min(3, {
      message: 'O nome da disciplina deve ter pelo menos 3 caracteres.',
    }),
    workload: z.coerce.number().nullable().optional(),
  });

// Tipagem dos dados do formulário
type FormData = z.infer<typeof formSchema>;

// Props para o componente SubjectForm
interface SubjectFormProps {
  defaultValues?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  isSubmitting: boolean;
}

export function SubjectForm({ defaultValues, onSubmit, isSubmitting }: SubjectFormProps) {
  const { toast } = useToast();

  // Valores padrão para o formulário
  const defaultFormValues: Partial<FormData> = {
    title: '',
    description: '',
    area: '',
    workload: null,
    isActive: true,
    ...defaultValues,
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
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da disciplina *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Matemática Avançada" 
                  {...field} 
                />
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
                  placeholder="Descreva o conteúdo e objetivos da disciplina"
                  className="resize-none"
                  rows={4}
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área do conhecimento</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Exatas, Humanas, Biológicas" 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="workload"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carga horária (horas)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="Ex: 60" 
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : null;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Status da disciplina</FormLabel>
                <p className="text-sm text-gray-500">
                  Disciplinas inativas não serão exibidas para matrícula.
                </p>
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

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => form.reset(defaultFormValues)}>
            Resetar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}