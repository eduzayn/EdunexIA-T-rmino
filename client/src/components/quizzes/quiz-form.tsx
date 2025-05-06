import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Esquema de validação para criação/edição de quiz
const quizSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres' }),
  description: z.string().optional(),
  instructions: z.string().optional(),
  timeLimit: z.number().min(5, { message: 'O tempo mínimo é de 5 minutos' }).max(180, { message: 'O tempo máximo é de 180 minutos' }),
  passingScore: z.number().min(1, { message: 'A pontuação mínima deve ser pelo menos 1%' }).max(100, { message: 'A pontuação máxima é 100%' }),
  isRequired: z.boolean().default(true),
  isActive: z.boolean().default(true),
  allowRetake: z.boolean().default(true),
  maxAttempts: z.number().min(0, { message: 'O número mínimo de tentativas é 0 (ilimitado)' }).optional(),
  shuffleQuestions: z.boolean().default(false),
  showAnswers: z.boolean().default(true),
  quizType: z.enum(['practice', 'final']).default('practice'),
});

// Tipo para os valores do formulário
type QuizFormValues = z.infer<typeof quizSchema>;

interface QuizFormProps {
  defaultValues?: Partial<QuizFormValues>;
  quizType: 'practice' | 'final';
  onSubmit: (data: QuizFormValues) => void;
  isSubmitting?: boolean;
}

export function QuizForm({ defaultValues, quizType, onSubmit, isSubmitting = false }: QuizFormProps) {
  // Valores padrão com base no tipo
  const typeBasedDefaults = {
    practice: {
      timeLimit: 30,
      passingScore: 70,
      isRequired: false,
      allowRetake: true,
      showAnswers: true,
      quizType: 'practice' as const,
    },
    final: {
      timeLimit: 60,
      passingScore: 70,
      isRequired: true,
      allowRetake: false,
      showAnswers: false,
      quizType: 'final' as const,
    }
  };

  // Mesclar valores padrão específicos do tipo com valores padrão fornecidos
  const mergedDefaults = {
    ...typeBasedDefaults[quizType],
    ...defaultValues,
  };

  // Formulário
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: mergedDefaults,
  });

  // Manipular envio do formulário
  const handleSubmit = (data: QuizFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Digite o título do simulado" {...field} />
              </FormControl>
              <FormDescription>
                Nome do {quizType === 'practice' ? 'simulado' : 'avaliação final'} exibido para os alunos.
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
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o objetivo deste simulado"
                  className="resize-none min-h-[100px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Uma breve descrição sobre o conteúdo e propósito.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instruções</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Instruções para os alunos"
                  className="resize-none min-h-[100px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Instruções específicas exibidas antes do início do {quizType === 'practice' ? 'simulado' : 'avaliação'}.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator className="my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="timeLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempo Limite (minutos)</FormLabel>
                <div className="flex items-center space-x-3">
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={180}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <span className="text-sm text-gray-500">min</span>
                </div>
                <FormDescription>
                  Tempo máximo permitido para completar.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passingScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pontuação Mínima para Aprovação</FormLabel>
                <div className="flex items-center space-x-3">
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <FormDescription>
                  Porcentagem mínima para ser aprovado.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="isRequired"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Obrigatório</FormLabel>
                  <FormDescription>
                    Alunos precisam completar para avançar?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Ativo</FormLabel>
                  <FormDescription>
                    Disponível para os alunos?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="allowRetake"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel className="flex items-center gap-1">
                    Permitir Novas Tentativas
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Se ativado, alunos podem refazer o {quizType === 'practice' ? 'simulado' : 'avaliação'} múltiplas vezes.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormDescription>
                    Alunos podem tentar novamente?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxAttempts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número Máximo de Tentativas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0 para ilimitado"
                    disabled={!form.watch('allowRetake')}
                    {...field}
                    value={field.value === undefined ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  0 significa tentativas ilimitadas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="shuffleQuestions"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Embaralhar Questões</FormLabel>
                  <FormDescription>
                    Mudar ordem das perguntas a cada tentativa?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showAnswers"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Mostrar Respostas Corretas</FormLabel>
                  <FormDescription>
                    Exibir gabarito após conclusão?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="w-24"
            disabled={isSubmitting}
            onClick={() => window.history.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="w-28"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}