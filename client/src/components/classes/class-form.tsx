import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertClassSchema } from '@shared/schema';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import type { Subject } from '@shared/schema';

// Estendendo o schema para validação do formulário
const formSchema = insertClassSchema
  .omit({ tenantId: true }) // Remover campos que serão preenchidos pelo servidor
  .extend({
    startDate: z.string().nullable().optional().transform(val => val ? new Date(val).toISOString() : null),
    endDate: z.string().nullable().optional().transform(val => val ? new Date(val).toISOString() : null),
    subjectId: z.coerce.number().nullable().optional(), // Agora é opcional
    name: z.string().min(3, {
      message: 'O nome da turma deve ter pelo menos 3 caracteres.',
    }),
    maxStudents: z.coerce.number().nullable().optional(),
    teacherId: z.coerce.number().nullable().optional(),
  });

// Tipagem dos dados do formulário
type FormData = z.infer<typeof formSchema>;

// Props para o componente ClassForm
interface ClassFormProps {
  defaultValues?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  isSubmitting: boolean;
}

export function ClassForm({ defaultValues, onSubmit, isSubmitting }: ClassFormProps) {
  const { toast } = useToast();
  
  // Buscar disciplinas para o select
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    refetchOnWindowFocus: false,
  });

  // Valores padrão para o formulário
  const defaultFormValues: Partial<FormData> = {
    name: '',
    description: '',
    subjectId: undefined,
    code: '',
    startDate: null,
    endDate: null,
    maxStudents: null,
    teacherId: null,
    location: '',
    scheduleInfo: '',
    status: 'scheduled',
    isActive: true,
    ...defaultValues,
  };

  // Inicialização do formulário
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  // Atualizar o formulário quando defaultValues mudar
  useEffect(() => {
    if (defaultValues) {
      Object.keys(defaultValues).forEach((key) => {
        const fieldKey = key as keyof FormData;
        const fieldValue = defaultValues[fieldKey];
        
        // Converter datas ISO para strings compatíveis com input date
        if (fieldKey === 'startDate' || fieldKey === 'endDate') {
          if (fieldValue) {
            const date = new Date(fieldValue as string);
            const dateStr = date.toISOString().split('T')[0];
            form.setValue(fieldKey, dateStr as any);
          }
        } else {
          form.setValue(fieldKey, fieldValue as any);
        }
      });
    }
  }, [defaultValues, form]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Disciplina (opcional) */}
          <FormField
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disciplina (opcional)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "0" ? null : parseInt(value))}
                  defaultValue={field.value?.toString() || "0"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma disciplina (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Nenhuma</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nome da turma (obrigatório) */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da turma</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Turma A - Noturno" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Código da turma (gerado pelo servidor, opcional) */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: MAT-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status da turma */}
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
                    <SelectItem value="scheduled">Programada</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Professor responsável */}
          <FormField
            control={form.control}
            name="teacherId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID do Professor (temporário)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="ID do professor"
                    value={field.value?.toString() || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Número máximo de alunos */}
          <FormField
            control={form.control}
            name="maxStudents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número máximo de alunos</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex: 30"
                    value={field.value?.toString() || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de início */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de início</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de término */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de término</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Local da turma */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Sala 101, Bloco B" 
                    onChange={field.onChange}
                    name={field.name}
                    ref={field.ref}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Informações de horário */}
        <FormField
          control={form.control}
          name="scheduleInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Informações de horário</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Segunda e Quarta, 19h às 22h"
                  className="min-h-[100px]"
                  onChange={field.onChange}
                  name={field.name}
                  ref={field.ref}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descrição da turma */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição detalhada da turma"
                  className="min-h-[100px]"
                  onChange={field.onChange}
                  name={field.name}
                  ref={field.ref}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status ativo/inativo */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Turma ativa</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Turmas inativas não aparecem para os alunos
                </div>
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

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar turma'}
          </Button>
        </div>
      </form>
    </Form>
  );
}