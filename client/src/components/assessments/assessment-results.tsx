import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Assessment, AssessmentResult, User } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Download, FileText, PenLine, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { FormField, FormItem, FormLabel, FormMessage, Form, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";

// Props para o componente de resultados de avaliação
interface AssessmentResultsProps {
  assessmentId: number;
  assessment: Assessment;
  results: AssessmentResult[];
  students: User[];
  userRole: string;
  currentUserId: number;
}

// Schema para a atualização de um resultado
const resultUpdateSchema = z.object({
  score: z.number().min(0).max(999).optional(),
  feedback: z.string().optional(),
});

export default function AssessmentResults({
  assessmentId,
  assessment,
  results,
  students,
  userRole,
  currentUserId
}: AssessmentResultsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';

  // Função para formatar data
  const formatDate = (dateString: Date | string | null | undefined) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  // Obter o resultado selecionado
  const selectedResult = results.find(r => r.id === selectedResultId);

  // Configurar o formulário com React Hook Form e resolver do Zod
  const form = useForm<z.infer<typeof resultUpdateSchema>>({
    resolver: zodResolver(resultUpdateSchema),
    defaultValues: {
      score: selectedResult?.score || undefined,
      feedback: selectedResult?.feedback || "",
    },
  });

  // Mutação para atualizar um resultado
  const updateResultMutation = useMutation({
    mutationFn: async ({ resultId, data }: { resultId: number; data: any }) => {
      const res = await apiRequest(
        "PUT", 
        `/api/assessment-results/${resultId}`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Resultado atualizado",
        description: "O resultado da avaliação foi atualizado com sucesso",
        variant: "default",
      });
      
      // Fechar o painel
      setSelectedResultId(null);
      
      // Invalidar consultas relevantes
      queryClient.invalidateQueries({ queryKey: [`/api/assessments/${assessmentId}/results`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar resultado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para submeter o formulário
  const onSubmit = (data: z.infer<typeof resultUpdateSchema>) => {
    if (selectedResultId) {
      updateResultMutation.mutate({ 
        resultId: selectedResultId, 
        data
      });
    }
  };

  // Encontrar estudante pelo ID
  const findStudent = (studentId: number) => {
    return students.find(s => s.id === studentId);
  };

  // Verificar se o resultado está atrasado
  const isLate = (result: AssessmentResult) => {
    if (!result.submittedAt || !assessment.dueDate) return false;
    return new Date(result.submittedAt) > new Date(assessment.dueDate);
  };

  // Se for um estudante, mostrar apenas seu próprio resultado
  if (userRole === 'student') {
    const studentResult = results.find(r => r.studentId === currentUserId);
    
    if (!studentResult) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Seu Resultado</CardTitle>
            <CardDescription>Você ainda não possui um resultado para esta avaliação</CardDescription>
          </CardHeader>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seu Resultado</CardTitle>
          <CardDescription>Detalhes da sua avaliação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <p className="text-base font-medium">
                  {studentResult.status === 'graded' ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="mr-1 h-4 w-4" /> Avaliado
                    </span>
                  ) : studentResult.status === 'submitted' ? (
                    <span className="flex items-center text-amber-600">
                      <Clock className="mr-1 h-4 w-4" /> Enviado para avaliação
                    </span>
                  ) : (
                    <span className="flex items-center text-muted-foreground">
                      <FileText className="mr-1 h-4 w-4" /> Pendente
                    </span>
                  )}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Nota</h3>
                <p className="text-xl font-medium">
                  {studentResult.score !== null && studentResult.score !== undefined
                    ? `${studentResult.score}/${assessment.totalPoints}`
                    : "Não avaliado"}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Data de Envio</h3>
                <p className="text-base">
                  {studentResult.submittedAt 
                    ? formatDate(studentResult.submittedAt)
                    : "Não enviado"}
                </p>
                
                {isLate(studentResult) && (
                  <p className="text-xs text-red-500 mt-1">Entrega com atraso</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Data de Avaliação</h3>
                <p className="text-base">
                  {studentResult.gradedAt 
                    ? formatDate(studentResult.gradedAt)
                    : "Não avaliado"}
                </p>
              </div>
            </div>
            
            {studentResult.feedback && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground">Feedback do Professor</h3>
                <div className="mt-1 p-4 bg-muted rounded-md whitespace-pre-wrap">
                  {studentResult.feedback}
                </div>
              </div>
            )}
            
            {studentResult.attachmentUrl && (
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href={studentResult.attachmentUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Submissão
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Para professores e administradores, mostrar todos os resultados em uma tabela
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados dos Alunos</CardTitle>
        <CardDescription>Todos os resultados para esta avaliação</CardDescription>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            Nenhum aluno submeteu resultados para esta avaliação ainda.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Avaliado Por</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => {
                const student = findStudent(result.studentId);
                const grader = result.gradedBy ? findStudent(result.gradedBy) : null;
                
                return (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      {student ? student.fullName : `Estudante ID ${result.studentId}`}
                    </TableCell>
                    <TableCell>
                      {result.status === 'graded' ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="mr-1 h-4 w-4" /> Avaliado
                        </span>
                      ) : result.status === 'submitted' ? (
                        <span className="flex items-center text-amber-600">
                          <Clock className="mr-1 h-4 w-4" /> Enviado
                        </span>
                      ) : (
                        <span className="flex items-center text-muted-foreground">
                          <FileText className="mr-1 h-4 w-4" /> Pendente
                        </span>
                      )}
                      
                      {isLate(result) && (
                        <span className="text-xs text-red-500 block">Atrasado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.submittedAt ? formatDate(result.submittedAt) : "-"}
                    </TableCell>
                    <TableCell>
                      {result.score !== null && result.score !== undefined 
                        ? `${result.score}/${assessment.totalPoints}` 
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {grader ? grader.fullName : "-"}
                    </TableCell>
                    <TableCell>
                      {isTeacherOrAdmin && (
                        <Sheet 
                          open={selectedResultId === result.id}
                          onOpenChange={(open) => {
                            if (open) {
                              setSelectedResultId(result.id);
                              // Resetar o formulário com os valores do resultado selecionado
                              form.reset({
                                score: result.score !== null ? result.score : undefined,
                                feedback: result.feedback || "",
                              });
                            } else {
                              setSelectedResultId(null);
                            }
                          }}
                        >
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <PenLine className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>Avaliar Submissão</SheetTitle>
                              <SheetDescription>
                                {student ? student.fullName : `Estudante ID ${result.studentId}`}
                              </SheetDescription>
                            </SheetHeader>
                            
                            <div className="py-4">
                              <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                  <FormField
                                    control={form.control}
                                    name="score"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Nota (Máx: {assessment.totalPoints})</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            {...field} 
                                            value={field.value ?? ""}
                                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={form.control}
                                    name="feedback"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Feedback para o aluno</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            {...field}
                                            rows={5}
                                            placeholder="Forneça um feedback construtivo sobre a avaliação"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  {result.attachmentUrl && (
                                    <div className="mt-4">
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={result.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                          <Download className="mr-2 h-4 w-4" />
                                          Baixar Submissão
                                        </a>
                                      </Button>
                                    </div>
                                  )}
                                  
                                  <SheetFooter>
                                    <Button 
                                      type="submit" 
                                      disabled={updateResultMutation.isPending}
                                    >
                                      {updateResultMutation.isPending ? (
                                        <span className="flex items-center gap-2">
                                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                          Salvando...
                                        </span>
                                      ) : "Salvar Avaliação"}
                                    </Button>
                                  </SheetFooter>
                                </form>
                              </Form>
                            </div>
                          </SheetContent>
                        </Sheet>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}