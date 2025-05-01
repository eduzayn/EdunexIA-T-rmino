import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppShell } from '@/components/layout/app-shell';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// RadioGroup removido pois não está sendo usado
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Não tem datepicker, vamos usar input normal
import { Loader2, Calendar, FileText, AlertTriangle, CheckCircle2, Clock, DownloadCloud, ExternalLink } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Esquema de validação para formulário de pagamento individual
const paymentFormSchema = z.object({
  studentId: z.string().min(1, 'Selecione um aluno'),
  courseId: z.string().min(1, 'Selecione um curso'),
  dueDate: z.date().optional(),
});

// Esquema de validação para formulário de pagamento em lote
const batchPaymentFormSchema = z.object({
  courseId: z.string().min(1, 'Selecione um curso'),
  studentIds: z.array(z.string()).min(1, 'Selecione pelo menos um aluno'),
  dueDate: z.date().optional(),
});

// Componente principal da página
export default function PartnerPaymentsPage() {
  const [activeTab, setActiveTab] = useState('payments');
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [batchDialog, setBatchDialog] = useState(false);
  const [generatingPayment, setGeneratingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Formulário para pagamento individual
  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      studentId: '',
      courseId: '',
    },
  });

  // Formulário para pagamento em lote
  const batchForm = useForm<z.infer<typeof batchPaymentFormSchema>>({
    resolver: zodResolver(batchPaymentFormSchema),
    defaultValues: {
      courseId: '',
      studentIds: [],
      dueDate: undefined,
    },
  });

  // Buscar pagamentos
  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/partner/payments'],
    refetchOnWindowFocus: false,
  });

  // Buscar alunos elegíveis
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/partner/eligible-students'],
    refetchOnWindowFocus: false,
    enabled: paymentDialog || batchDialog,
  });

  // Buscar cursos
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/partner/courses'],
    refetchOnWindowFocus: false,
    enabled: paymentDialog || batchDialog,
  });

  // Função para gerar pagamento individual
  const handleGeneratePayment = async (values: z.infer<typeof paymentFormSchema>) => {
    try {
      setGeneratingPayment(true);
      
      const payload = {
        certificationId: Date.now(), // Temporário, em ambiente real seria o ID real da certificação
        studentId: parseInt(values.studentId),
        courseId: parseInt(values.courseId),
        dueDate: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : undefined,
      };

      const result = await apiRequest('/api/partner/generate-payment', 'POST', payload);
      
      setPaymentResult(result);
      toast({
        title: "Pagamento gerado com sucesso",
        description: "O boleto foi criado e está disponível para o aluno."
      });
      
      // Atualizar a lista de pagamentos
      queryClient.invalidateQueries({ queryKey: ['/api/partner/payments'] });
    } catch (error: any) {
      console.error('Erro ao gerar pagamento:', error);
      toast({
        title: "Erro ao gerar pagamento",
        description: error.message || "Não foi possível gerar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setGeneratingPayment(false);
    }
  };

  // Função para gerar pagamento em lote
  const handleGenerateBatchPayment = async (values: z.infer<typeof batchPaymentFormSchema>) => {
    try {
      setGeneratingPayment(true);
      
      // Criar IDs temporários para as certificações (em ambiente real seria os IDs reais)
      const certificationIds = values.studentIds.map((_, index) => Date.now() + index);
      
      const payload = {
        certificationIds: certificationIds,
        studentIds: values.studentIds.map(id => parseInt(id)),
        courseId: parseInt(values.courseId),
        dueDate: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : undefined,
      };

      const result = await apiRequest('/api/partner/generate-batch-payment', 'POST', payload);
      
      setPaymentResult(result);
      toast({
        title: "Pagamento em lote gerado com sucesso",
        description: `Boleto para ${values.studentIds.length} certificações criado com sucesso.`
      });
      
      // Atualizar a lista de pagamentos
      queryClient.invalidateQueries({ queryKey: ['/api/partner/payments'] });
    } catch (error: any) {
      console.error('Erro ao gerar pagamento em lote:', error);
      toast({
        title: "Erro ao gerar pagamento em lote",
        description: error.message || "Não foi possível gerar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setGeneratingPayment(false);
    }
  };

  // Função para fechar diálogo e limpar resultado
  const handleCloseDialog = () => {
    setPaymentDialog(false);
    setBatchDialog(false);
    setPaymentResult(null);
    paymentForm.reset();
    batchForm.reset();
  };

  // Função para renderizar ícone de status
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'paid':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <FileText className="h-5 w-5 text-gray-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // Função para retornar texto de status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'paid':
        return 'Pago';
      case 'overdue':
        return 'Vencido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Para navegação
  const [_, navigate] = useLocation();

  // Função para voltar à página anterior
  const handleGoBack = () => {
    navigate('/partner/dashboard');
  };

  return (
    <AppShell>
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4" 
            onClick={handleGoBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-3xl font-bold">Pagamentos</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="payments">Pagamentos Realizados</TabsTrigger>
            <TabsTrigger value="generate">Gerar Novo Pagamento</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>
                Acompanhe todos os pagamentos de certificações realizados ou pendentes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPayments ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : payments && payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Status</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Aluno/Lote</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {renderStatusIcon(payment.status)}
                          </TableCell>
                          <TableCell className="font-medium">{payment.description}</TableCell>
                          <TableCell>{payment.studentName}</TableCell>
                          <TableCell>
                            {new Date(payment.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell>
                            {payment.status === 'pending' || payment.status === 'overdue' ? (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                asChild
                                title="Visualizar boleto"
                              >
                                <a href={payment.paymentUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : payment.status === 'paid' ? (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Baixar comprovante"
                              >
                                <DownloadCloud className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  Nenhum pagamento encontrado. Crie novos pagamentos na aba "Gerar Novo Pagamento".
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="generate">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pagamento Individual</CardTitle>
                  <CardDescription>
                    Crie um boleto para certificação de um aluno específico.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Após a confirmação do pagamento, o certificado será liberado para o aluno.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Valor: R$ 89,90 por certificação.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setPaymentDialog(true)}
                  >
                    Gerar Boleto Individual
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pagamento em Lote</CardTitle>
                  <CardDescription>
                    Crie um boleto para certificação de múltiplos alunos de uma única vez.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Ideal para instituições que precisam certificar vários alunos simultaneamente.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Valor: R$ 79,90 por certificação (desconto para lote).
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setBatchDialog(true)}
                  >
                    Gerar Boleto em Lote
                  </Button>
                </CardFooter>
              </Card>
            </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para pagamento individual */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          {!paymentResult ? (
            <>
              <DialogHeader>
                <DialogTitle>Gerar Boleto Individual</DialogTitle>
                <DialogDescription>
                  Selecione o aluno e o curso para gerar um boleto de certificação.
                </DialogDescription>
              </DialogHeader>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(handleGeneratePayment)}>
                  <div className="grid gap-4 py-4">
                    <FormField
                      control={paymentForm.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aluno</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isLoadingStudents}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um aluno" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingStudents ? (
                                <div className="flex justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : students && students.length > 0 ? (
                                students.map((student: any) => (
                                  <SelectItem key={student.id} value={student.id.toString()}>
                                    {student.fullName}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>
                                  Nenhum aluno disponível
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="courseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Curso</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isLoadingCourses}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um curso" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingCourses ? (
                                <div className="flex justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : courses && courses.length > 0 ? (
                                courses.map((course: any) => (
                                  <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.title}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>
                                  Nenhum curso disponível
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Vencimento (opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                field.onChange(date);
                              }}
                              value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Se não informado, o vencimento será em 10 dias.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={generatingPayment}>
                      {generatingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        'Gerar Boleto'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Boleto Gerado com Sucesso</DialogTitle>
                <DialogDescription>
                  O boleto foi gerado e está pronto para pagamento.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="rounded-md bg-slate-50 p-4 mb-4">
                  <p className="font-medium mb-2">Informações do Pagamento:</p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Descrição:</span> {paymentResult.payment.description}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Valor:</span> {paymentResult.payment.netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Vencimento:</span> {new Date(paymentResult.payment.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Status:</span> {getStatusText(paymentResult.payment.status)}
                  </p>
                </div>
                
                <div className="flex justify-center mb-4">
                  <Button asChild className="mr-2">
                    <a href={paymentResult.payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                      Visualizar Fatura
                    </a>
                  </Button>
                  {paymentResult.payment.bankSlipUrl && (
                    <Button asChild variant="outline">
                      <a href={paymentResult.payment.bankSlipUrl} target="_blank" rel="noopener noreferrer">
                        Visualizar Boleto
                      </a>
                    </Button>
                  )}
                </div>
                
                <p className="text-sm text-center text-muted-foreground">
                  O certificado será liberado automaticamente após a confirmação do pagamento.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseDialog}>
                  Concluir
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para pagamento em lote */}
      <Dialog open={batchDialog} onOpenChange={setBatchDialog}>
        <DialogContent className="sm:max-w-[500px]">
          {!paymentResult ? (
            <>
              <DialogHeader>
                <DialogTitle>Gerar Boleto em Lote</DialogTitle>
                <DialogDescription>
                  Selecione vários alunos e o curso para gerar um boleto único.
                </DialogDescription>
              </DialogHeader>
              <Form {...batchForm}>
                <form onSubmit={batchForm.handleSubmit(handleGenerateBatchPayment)}>
                  <div className="grid gap-4 py-4">
                    <FormField
                      control={batchForm.control}
                      name="courseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Curso</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isLoadingCourses}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um curso" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingCourses ? (
                                <div className="flex justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : courses && courses.length > 0 ? (
                                courses.map((course: any) => (
                                  <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.title}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>
                                  Nenhum curso disponível
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={batchForm.control}
                      name="studentIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alunos</FormLabel>
                          <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto">
                            {isLoadingStudents ? (
                              <div className="flex justify-center p-2">
                                <Loader2 className="h-6 w-6 animate-spin" />
                              </div>
                            ) : students && students.length > 0 ? (
                              students.map((student: any) => (
                                <div className="flex items-center mb-2" key={student.id}>
                                  <input
                                    type="checkbox"
                                    id={`student-${student.id}`}
                                    className="h-4 w-4 rounded border-gray-300"
                                    value={student.id}
                                    checked={field.value.includes(student.id.toString())}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const newValues = e.target.checked
                                        ? [...field.value, value]
                                        : field.value.filter((v) => v !== value);
                                      field.onChange(newValues);
                                    }}
                                  />
                                  <Label
                                    htmlFor={`student-${student.id}`}
                                    className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {student.fullName}
                                  </Label>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Nenhum aluno disponível para seleção.
                              </p>
                            )}
                          </div>
                          <FormDescription>
                            Selecione todos os alunos que serão incluídos neste lote.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={batchForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Vencimento (opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                field.onChange(date);
                              }}
                              value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Se não informado, o vencimento será em 10 dias.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={generatingPayment}>
                      {generatingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        'Gerar Boleto em Lote'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Boleto em Lote Gerado com Sucesso</DialogTitle>
                <DialogDescription>
                  O boleto para o lote foi gerado e está pronto para pagamento.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="rounded-md bg-slate-50 p-4 mb-4">
                  <p className="font-medium mb-2">Informações do Pagamento:</p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Descrição:</span> {paymentResult.payment.description}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Quantidade de certificações:</span> {paymentResult.payment.numberOfCertifications}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Valor total:</span> {paymentResult.payment.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Vencimento:</span> {new Date(paymentResult.payment.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Status:</span> {getStatusText(paymentResult.payment.status)}
                  </p>
                </div>
                
                <div className="flex justify-center mb-4">
                  <Button asChild className="mr-2">
                    <a href={paymentResult.payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                      Visualizar Fatura
                    </a>
                  </Button>
                  {paymentResult.payment.bankSlipUrl && (
                    <Button asChild variant="outline">
                      <a href={paymentResult.payment.bankSlipUrl} target="_blank" rel="noopener noreferrer">
                        Visualizar Boleto
                      </a>
                    </Button>
                  )}
                </div>
                
                <p className="text-sm text-center text-muted-foreground">
                  Os certificados serão liberados automaticamente após a confirmação do pagamento.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseDialog}>
                  Concluir
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </AppShell>
  );
}