import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Assessment, InsertAssessment, insertAssessmentSchema } from "@shared/schema";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import { format } from "date-fns";

// Tradução dos tipos de avaliação
const assessmentTypes = [
  { value: 'exam', label: 'Prova' },
  { value: 'assignment', label: 'Trabalho' },
  { value: 'project', label: 'Projeto' },
  { value: 'quiz', label: 'Questionário' },
  { value: 'presentation', label: 'Apresentação' },
  { value: 'participation', label: 'Participação' }
];

// Props para o formulário de avaliação
interface AssessmentFormProps {
  assessment?: Assessment;
  classId?: number;
  isEdit?: boolean;
  isFromCentralView?: boolean;
}

export default function AssessmentForm({ 
  assessment, 
  classId, 
  isEdit = false, 
  isFromCentralView = false 
}: AssessmentFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Buscar todas as turmas para a seleção (apenas quando estamos na visão centralizada)
  const { data: classes } = useQuery({
    queryKey: ['/api/classes'],
    enabled: isFromCentralView
  });

  // Extender o schema para validação dos campos de data
  const extendedSchema = useMemo(() => {
    return insertAssessmentSchema.extend({
      dueDate: z.string().optional().nullable(),
      availableFrom: z.string().optional().nullable(),
      availableTo: z.string().optional().nullable(),
      instructions: z.string().optional().nullable(),
    }).omit({ 
      createdBy: true, // Será definido pelo backend com base no usuário logado
      tenantId: true    // Será definido pelo backend com base no tenant do usuário
    });
  }, []);

  // Configurar o formulário com React Hook Form e resolver do Zod
  const form = useForm<z.infer<typeof extendedSchema>>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      classId: classId,
      title: assessment?.title || "",
      description: assessment?.description || "",
      type: assessment?.type || "exam",
      totalPoints: assessment?.totalPoints || 100,
      weight: assessment?.weight || 1,
      dueDate: assessment?.dueDate ? format(new Date(assessment.dueDate), "yyyy-MM-dd'T'HH:mm") : "",
      availableFrom: assessment?.availableFrom ? format(new Date(assessment.availableFrom), "yyyy-MM-dd'T'HH:mm") : "",
      availableTo: assessment?.availableTo ? format(new Date(assessment.availableTo), "yyyy-MM-dd'T'HH:mm") : "",
      isActive: assessment?.isActive ?? true,
      instructions: assessment?.instructions || "",
    },
  });

  // Mutação para criar ou atualizar uma avaliação
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isEdit 
        ? `/api/assessments/${assessment?.id}` 
        : "/api/assessments";
      
      const method = isEdit ? "PUT" : "POST";
      
      const res = await apiRequest(method, endpoint, data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: isEdit ? "Avaliação atualizada" : "Avaliação criada",
        description: isEdit 
          ? "A avaliação foi atualizada com sucesso" 
          : "A avaliação foi criada com sucesso",
        variant: "default",
      });
      
      // Invalidar consultas relevantes
      if (classId) {
        queryClient.invalidateQueries({ queryKey: [`/api/classes/${classId}/assessments`] });
      }
      
      // Invalidar também a consulta de todas as avaliações
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      
      if (isEdit && assessment?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/assessments/${assessment.id}`] });
      }
      
      // Navegar de volta conforme o contexto
      if (isFromCentralView) {
        navigate('/admin/assessments');
      } else if (classId) {
        navigate(`/admin/classes/${classId}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao ${isEdit ? "atualizar" : "criar"} avaliação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Função para lidar com a submissão do formulário
  const onSubmit = (data: z.infer<typeof extendedSchema>) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => isFromCentralView 
              ? navigate('/admin/assessments')
              : navigate(`/admin/classes/${classId}`)
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div>
            <CardTitle>{isEdit ? "Editar Avaliação" : "Nova Avaliação"}</CardTitle>
            <CardDescription>
              {isEdit ? "Atualize os dados da avaliação" : "Preencha os dados para criar uma nova avaliação"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              <Separator />
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Prova Final de Matemática" {...field} />
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
                        placeholder="Descreva a avaliação"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Seletor de turma - apenas na visão centralizada */}
                {isFromCentralView && (
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turma</FormLabel>
                        <Select 
                          value={field.value ? String(field.value) : undefined}
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma turma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes?.map((cls: any) => (
                              <SelectItem key={cls.id} value={String(cls.id)}>
                                {cls.name} - {cls.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Turma à qual esta avaliação será aplicada</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Avaliação</FormLabel>
                      <Select 
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assessmentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="totalPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pontuação Total</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Pontuação máxima da avaliação</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Peso da avaliação no cálculo da nota final</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativa</FormLabel>
                        <FormDescription>
                          Avaliações inativas não estarão visíveis para os alunos
                        </FormDescription>
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
              </div>
            </div>
            
            {/* Datas e Prazos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Datas e Prazos</h3>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="availableFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponível a partir de</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>Data de início da avaliação</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="availableTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponível até</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>Data final de disponibilidade</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Entrega</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>Prazo de entrega da avaliação</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Instruções */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Instruções</h3>
              <Separator />
              
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruções para os alunos</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Forneça instruções detalhadas sobre a avaliação"
                        {...field}
                        rows={5}
                      />
                    </FormControl>
                    <FormDescription>
                      Forneça instruções claras para os alunos sobre como completar a avaliação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex gap-4 justify-end">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => isFromCentralView 
                  ? navigate('/admin/assessments')
                  : navigate(`/admin/classes/${classId}`)
                }
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Salvando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isEdit ? "Atualizar" : "Criar"} Avaliação
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}