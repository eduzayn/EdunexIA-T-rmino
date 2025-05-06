import React, { useState } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, PlusCircle, MoveUp, MoveDown, AlignJustify } from 'lucide-react';
import type { Question } from '@shared/schema';

// Esquema para validação de opções da questão
const optionSchema = z.object({
  text: z.string().min(1, { message: 'O texto da opção é obrigatório' }),
  isCorrect: z.boolean().default(false),
});

// Esquema de validação para criação/edição de questão
const questionSchema = z.object({
  questionText: z.string().min(3, { message: 'A pergunta deve ter pelo menos 3 caracteres' }),
  questionType: z.enum(['multiple_choice', 'true_false']).default('multiple_choice'),
  options: z.array(optionSchema).min(2, { message: 'A questão deve ter pelo menos 2 opções' }),
  explanation: z.string().optional(),
  points: z.number().min(1, { message: 'A pontuação deve ser pelo menos 1' }).default(10),
  difficultyLevel: z.number().min(1, { message: 'A dificuldade deve ser entre 1 e 5' }).max(5, { message: 'A dificuldade deve ser entre 1 e 5' }).default(2),
  order: z.number().optional(),
}).refine((data) => {
  // Verificar se pelo menos uma opção está marcada como correta
  return data.options.some(option => option.isCorrect);
}, {
  message: 'Selecione pelo menos uma opção correta',
  path: ['options'],
});

// Tipo para os valores do formulário
type QuestionFormValues = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  defaultValues?: Partial<Question>;
  onSubmit: (data: QuestionFormValues) => void;
  isSubmitting?: boolean;
}

export function QuestionForm({ 
  defaultValues, 
  onSubmit, 
  isSubmitting = false 
}: QuestionFormProps) {
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false'>(
    (defaultValues?.questionType as 'multiple_choice' | 'true_false') || 'multiple_choice'
  );
  
  // Valores padrão para o formulário
  const formDefaults = {
    questionText: '',
    questionType: 'multiple_choice' as const,
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    explanation: '',
    points: 10,
    difficultyLevel: 2,
    order: 0,
    ...(defaultValues && {
      questionText: defaultValues.questionText || '',
      questionType: defaultValues.questionType || 'multiple_choice',
      explanation: defaultValues.explanation || '',
      points: defaultValues.points || 10,
      difficultyLevel: defaultValues.difficultyLevel || 2,
      order: defaultValues.order || 0,
      options: Array.isArray(defaultValues.options) 
        ? defaultValues.options 
        : [{ text: '', isCorrect: false }, { text: '', isCorrect: false }]
    }),
  };
  
  // Se o tipo de questão for verdadeiro/falso e não tiver opções específicas,
  // definir opções padrão para verdadeiro/falso
  if (questionType === 'true_false' && (!Array.isArray(defaultValues?.options) || defaultValues.options.length !== 2)) {
    formDefaults.options = [
      { text: 'Verdadeiro', isCorrect: false },
      { text: 'Falso', isCorrect: false },
    ];
  }
  
  // Inicializar formulário
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: formDefaults,
  });
  
  // Configurar array de opções
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'options',
  });
  
  // Manipular mudança no tipo de questão
  const handleQuestionTypeChange = (value: 'multiple_choice' | 'true_false') => {
    setQuestionType(value);
    form.setValue('questionType', value);
    
    // Se mudar para verdadeiro/falso, ajustar opções
    if (value === 'true_false') {
      form.setValue('options', [
        { text: 'Verdadeiro', isCorrect: false },
        { text: 'Falso', isCorrect: false },
      ]);
    }
  };
  
  // Adicionar uma nova opção
  const handleAddOption = () => {
    append({ text: '', isCorrect: false });
  };
  
  // Manipular submissão do formulário
  const handleSubmit = (data: QuestionFormValues) => {
    onSubmit(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Tipo de Questão */}
        <FormField
          control={form.control}
          name="questionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Questão</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => handleQuestionTypeChange(value as 'multiple_choice' | 'true_false')}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="multiple_choice" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Múltipla Escolha</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="true_false" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Verdadeiro/Falso</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Selecione o tipo de questão que você deseja criar.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Texto da Questão */}
        <FormField
          control={form.control}
          name="questionText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pergunta</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Digite a pergunta aqui..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                O texto da pergunta que será exibido para os alunos.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />
        
        {/* Opções */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <FormLabel className="text-base">Opções de Resposta</FormLabel>
            {questionType === 'multiple_choice' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                disabled={fields.length >= 10}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Adicionar Opção
              </Button>
            )}
          </div>
          
          <FormDescription className="mb-4">
            {questionType === 'multiple_choice'
              ? 'Adicione as opções e marque qual(is) está(ão) correta(s).'
              : 'Indique se a afirmação é verdadeira ou falsa.'}
          </FormDescription>
          
          <div className="space-y-3">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="pt-2">
                      <FormField
                        control={form.control}
                        name={`options.${index}.isCorrect`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`options.${index}.text`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder={`Opção ${index + 1}`}
                                {...field}
                                disabled={questionType === 'true_false'}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {questionType === 'multiple_choice' && (
                      <div className="flex space-x-1">
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => move(index, index - 1)}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {index < fields.length - 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => move(index, index + 1)}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {fields.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {form.formState.errors.options?.message && (
            <p className="text-sm font-medium text-destructive mt-2">
              {form.formState.errors.options.message}
            </p>
          )}
        </div>
        
        <Separator />
        
        {/* Explicação */}
        <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explicação (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Explique a resposta correta..."
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Uma explicação que será mostrada aos alunos após responderem a questão.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pontuação */}
          <FormField
            control={form.control}
            name="points"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pontuação</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Quantos pontos vale esta questão (1-100).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Nível de Dificuldade */}
          <FormField
            control={form.control}
            name="difficultyLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nível de Dificuldade: {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                    className="mt-2"
                  />
                </FormControl>
                <FormDescription className="flex justify-between text-xs">
                  <span>Fácil</span>
                  <span>Médio</span>
                  <span>Difícil</span>
                </FormDescription>
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