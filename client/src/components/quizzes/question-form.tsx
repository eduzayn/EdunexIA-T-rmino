import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Esquema de validação para opções da questão
const optionSchema = z.object({
  text: z.string().min(1, { message: 'O texto da opção é obrigatório' }),
  isCorrect: z.boolean().default(false),
});

// Esquema de validação para questões
const questionSchema = z.object({
  questionText: z.string().min(3, { message: 'A pergunta deve ter pelo menos 3 caracteres' }),
  options: z.array(optionSchema).min(2, { message: 'A questão deve ter pelo menos 2 opções' }),
  explanation: z.string().optional(),
  points: z.number().min(1, { message: 'A pontuação deve ser pelo menos 1' }).default(10),
  difficultyLevel: z.number().min(1, { message: 'A dificuldade deve ser entre 1 e 5' }).max(5, { message: 'A dificuldade deve ser entre 1 e 5' }).default(2),
}).refine((data) => {
  const correctOptions = data.options.filter(option => option.isCorrect);
  return correctOptions.length > 0;
}, {
  message: 'Selecione pelo menos uma opção correta',
  path: ['options'],
});

// Tipo para os valores do formulário
type QuestionFormValues = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  defaultValues?: Partial<QuestionFormValues>;
  onSubmit: (data: QuestionFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function QuestionForm({ defaultValues, onSubmit, onCancel, isSubmitting = false }: QuestionFormProps) {
  // Valores padrão
  const defaultFormValues: Partial<QuestionFormValues> = {
    questionText: '',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    explanation: '',
    points: 10,
    difficultyLevel: 2,
    ...defaultValues,
  };

  // Formulário
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: defaultFormValues,
  });

  // useFieldArray para gerenciar o array de opções
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  // Estado para rastrear qual tipo de questão (única ou múltipla escolha)
  const [isMultipleChoice, setIsMultipleChoice] = useState(() => {
    // Verificar valores iniciais para determinar se é múltipla escolha
    const initialOptions = defaultFormValues.options || [];
    const correctCount = initialOptions.filter(o => o.isCorrect).length;
    return correctCount > 1;
  });

  // Manipular alteração no tipo de questão
  const handleQuestionTypeChange = (newValue: boolean) => {
    setIsMultipleChoice(newValue);
    
    // Se mudar de múltipla para única escolha, deixar apenas a primeira opção como correta
    if (!newValue) {
      const optionValues = form.getValues().options;
      const updatedOptions = optionValues.map((option, index) => ({
        ...option,
        isCorrect: index === 0 ? true : false
      }));
      
      // Atualizar todos os valores de uma vez para evitar re-renderizações desnecessárias
      form.setValue('options', updatedOptions);
    }
  };

  // Manipular seleção de resposta única
  const handleSingleChoiceSelect = (index: number) => {
    const optionValues = form.getValues().options;
    const updatedOptions = optionValues.map((option, i) => ({
      ...option,
      isCorrect: i === index
    }));
    
    form.setValue('options', updatedOptions);
  };

  // Adicionar uma nova opção
  const addOption = () => {
    append({ text: '', isCorrect: false });
  };

  // Manipular envio do formulário
  const handleSubmit = (data: QuestionFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Questão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pergunta</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite a pergunta aqui..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <FormLabel>Opções de Resposta</FormLabel>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Resposta única</span>
                  <Switch
                    checked={isMultipleChoice}
                    onCheckedChange={handleQuestionTypeChange}
                  />
                  <span className="text-sm text-gray-500">Múltipla escolha</span>
                </div>
              </div>

              <div className="space-y-4 border p-4 rounded-md">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-3">
                    <div className="flex items-center pt-3">
                      {isMultipleChoice ? (
                        <FormField
                          control={form.control}
                          name={`options.${index}.isCorrect`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <RadioGroup
                          value={form.getValues().options.findIndex(o => o.isCorrect) === index ? 'true' : 'false'}
                          onValueChange={(value) => {
                            if (value === 'true') {
                              handleSingleChoiceSelect(index);
                            }
                          }}
                        >
                          <RadioGroupItem value="true" id={`option-${index}`} />
                        </RadioGroup>
                      )}
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {fields.length < 8 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar opção
                  </Button>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explicação (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explicação sobre a resposta correta..."
                      className="resize-none min-h-[80px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Uma explicação que será mostrada após o aluno responder (se configurado no simulado).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      Valor da questão no simulado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficultyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Dificuldade</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      De 1 (fácil) a 5 (difícil).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Questão'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}