import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  PlusCircle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Download
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Schema para validação do formulário
const formSchema = z.object({
  studentName: z.string().min(3, { message: "Nome do aluno é obrigatório" }),
  studentEmail: z.string().email({ message: "E-mail inválido" }),
  studentCpf: z.string().min(11, { message: "CPF inválido" }),
  studentPhone: z.string().optional(),
  courseId: z.string({ required_error: "Selecione um curso" }),
  amount: z.string().min(1, { message: "Valor é obrigatório" }),
  installments: z.string().default("1"),
  paymentMethod: z.enum(["UNDEFINED", "BOLETO", "CREDIT_CARD", "PIX"], {
    required_error: "Selecione uma forma de pagamento",
  }).default("UNDEFINED"),
  poloId: z.string().optional(),
  consultantId: z.string(),
  tenantId: z.string(),
});

// Schema para exibição de dados
type SimplifiedEnrollment = {
  id: number;
  tenantId: number;
  courseId: number;
  courseName?: string;
  studentId?: number;
  studentName: string;
  studentEmail: string;
  studentCpf: string;
  studentPhone?: string;
  poloId?: number;
  poloName?: string;
  consultantId: number;
  consultantName?: string;
  amount: number;
  installments: number;
  status: string;
  paymentMethod?: string;
  paymentUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
};

// Componente de Matrícula Simplificada
export default function SimplifiedEnrollmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("new");
  
  // Consultas
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<any[]>({
    queryKey: ['/api/courses'],
    retry: 1,
  });
  
  const { data: enrollments = [], isLoading: isLoadingEnrollments, refetch: refetchEnrollments } = useQuery<SimplifiedEnrollment[]>({
    queryKey: ['/api/simplified-enrollments', user?.tenantId],
    enabled: !!user?.tenantId,
    queryFn: async () => {
      const response = await fetch(`/api/simplified-enrollments?tenantId=${user?.tenantId}`);
      return await response.json();
    }
  });
  
  // Mutação para criar matrícula
  const createEnrollmentMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch("/api/simplified-enrollments", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao processar matrícula");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Matrícula iniciada com sucesso!",
        description: data.paymentUrl 
          ? "Link de pagamento gerado. Compartilhe com o aluno." 
          : "Matrícula registrada, mas houve um problema ao gerar o link de pagamento.",
        variant: "default",
      });
      
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/simplified-enrollments'] });
      setSelectedTab("pending");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar matrícula",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });
  
  // Configurar formulário
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: "",
      studentEmail: "",
      studentCpf: "",
      studentPhone: "",
      courseId: "",
      amount: "",
      installments: "1",
      paymentMethod: "UNDEFINED",
      consultantId: user?.id?.toString() || "",
      tenantId: user?.tenantId?.toString() || "",
    },
  });
  
  // Atualizar valores padrão quando o usuário mudar
  useEffect(() => {
    if (user) {
      form.setValue("consultantId", user.id.toString());
      form.setValue("tenantId", user.tenantId.toString());
    }
  }, [user, form]);
  
  // Manipulador de envio do formulário
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Converter strings para números onde necessário
    const formattedData = {
      ...values,
      courseId: parseInt(values.courseId),
      amount: parseFloat(values.amount), // Usar parseFloat para preservar decimais
      installments: parseInt(values.installments),
      consultantId: parseInt(values.consultantId),
      tenantId: parseInt(values.tenantId),
      poloId: values.poloId ? parseInt(values.poloId) : undefined,
    };
    
    // Log para debug
    console.log("Enviando matrícula com dados:", formattedData);
    
    createEnrollmentMutation.mutate(formattedData);
  };
  
  // Função para mapear status para badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-slate-100">Pendente</Badge>;
      case 'waiting_payment':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Aguardando Pagamento</Badge>;
      case 'payment_confirmed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Pagamento Confirmado</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Concluída</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelada</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Falha</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Função para exibir o método de pagamento
  const getPaymentMethodBadge = (paymentMethod?: string) => {
    switch (paymentMethod) {
      case 'CREDIT_CARD':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Cartão de Crédito</Badge>;
      case 'BOLETO':
        return <Badge variant="outline" className="bg-violet-50 text-violet-700">Boleto</Badge>;
      case 'PIX':
        return <Badge variant="outline" className="bg-green-50 text-green-700">PIX</Badge>;
      case 'UNDEFINED':
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Múltiplas opções</Badge>;
    }
  };
  
  // Formatar CPF
  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };
  
  // Manipular mudança no campo de curso
  const handleCourseChange = (courseId: string) => {
    const selectedCourse = courses.find((c: any) => c.id.toString() === courseId);
    if (selectedCourse && selectedCourse.price) {
      form.setValue("amount", selectedCourse.price.toString());
    }
  };
  
  // Função para validar CPF
  const isValidCPF = (cpf: string): boolean => {
    const rawCPF = cpf.replace(/[^\d]/g, '');
    
    // Verificar tamanho
    if (rawCPF.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(rawCPF)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(rawCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(rawCPF.charAt(9))) {
      return false;
    }
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(rawCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    
    return remainder === parseInt(rawCPF.charAt(10));
  };
  
  // Formatador de CPF para o input
  const formatCpfInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 11) {
      value = value.slice(0, 11);
    }
    
    // Formatar o CPF com pontos e traço conforme digitação (000.000.000-00)
    let formattedValue = value;
    if (value.length > 3) {
      formattedValue = value.slice(0, 3) + '.' + value.slice(3);
    }
    if (value.length > 6) {
      formattedValue = formattedValue.slice(0, 7) + '.' + value.slice(6);
    }
    if (value.length > 9) {
      formattedValue = formattedValue.slice(0, 11) + '-' + value.slice(9);
    }
    
    e.target.value = formattedValue;
    form.setValue("studentCpf", formattedValue);
    
    // Validar CPF completo
    if (value.length === 11) {
      const isValid = isValidCPF(value);
      if (!isValid) {
        form.setError("studentCpf", {
          type: "manual",
          message: "CPF inválido. Verifique os dígitos."
        });
      } else {
        form.clearErrors("studentCpf");
      }
    }
  };
  
  // Formatador de telefone para o input
  const formatPhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 11) {
      value = value.slice(0, 11);
    }
    
    let formattedValue = value;
    if (value.length > 2) {
      formattedValue = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      if (value.length > 7) {
        formattedValue = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
      }
    }
    
    e.target.value = formattedValue;
    form.setValue("studentPhone", value);
  };
  
  return (
    <AppShell>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Matrícula Simplificada</h1>
            <p className="text-muted-foreground">
              Realize matrículas rápidas com pagamento automático
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetchEnrollments()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="new">Nova Matrícula</TabsTrigger>
            <TabsTrigger value="pending">Matrículas Pendentes</TabsTrigger>
            <TabsTrigger value="all">Todas as Matrículas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Nova Matrícula</CardTitle>
                <CardDescription>
                  Preencha os dados do aluno e do curso para iniciar o processo de matrícula
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Dados do Aluno */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Dados do Aluno</h3>
                        
                        <FormField
                          control={form.control}
                          name="studentName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome completo do aluno" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="studentEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <Input placeholder="email@exemplo.com" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="studentCpf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="000.000.000-00" 
                                  value={field.value}
                                  onChange={(e) => formatCpfInput(e)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="studentPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="(00) 00000-0000"
                                  value={field.value}
                                  onChange={(e) => formatPhoneInput(e)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Dados do Curso */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Dados da Matrícula</h3>
                        
                        <FormField
                          control={form.control}
                          name="courseId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Curso</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleCourseChange(value);
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um curso" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {isLoadingCourses ? (
                                    <SelectItem value="loading">Carregando cursos...</SelectItem>
                                  ) : (
                                    courses.map((course: any) => (
                                      <SelectItem key={course.id} value={course.id.toString()}>
                                        {course.title}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor (R$)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="0,00" 
                                  type="number"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Valor em centavos (ex: 10000 = R$ 100,00)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="installments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parcelas</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Número de parcelas" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                      {num}x {num > 1 ? 'parcelas' : 'parcela'}
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
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Método de Pagamento</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || "UNDEFINED"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o método de pagamento" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="UNDEFINED">Permitir que o aluno escolha</SelectItem>
                                  <SelectItem value="BOLETO">Somente Boleto Bancário</SelectItem>
                                  <SelectItem value="CREDIT_CARD">Somente Cartão de Crédito</SelectItem>
                                  <SelectItem value="PIX">Somente PIX</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Se selecionar "Permitir que o aluno escolha", o aluno poderá escolher entre Boleto, PIX ou Cartão
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Campos ocultos */}
                        <input type="hidden" {...form.register("consultantId")} />
                        <input type="hidden" {...form.register("tenantId")} />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto"
                        disabled={createEnrollmentMutation.isPending}
                      >
                        {createEnrollmentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Criar Matrícula
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Matrículas Pendentes</CardTitle>
                <CardDescription>
                  Matrículas que ainda aguardam pagamento ou processamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEnrollments ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableCaption>Lista de matrículas pendentes</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.filter((e: SimplifiedEnrollment) => 
                        ['pending', 'waiting_payment'].includes(e.status)
                      ).map((enrollment: SimplifiedEnrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">{enrollment.id}</TableCell>
                          <TableCell>{enrollment.studentName}</TableCell>
                          <TableCell>
                            {courses.find((c: any) => c.id === enrollment.courseId)?.title || 
                             `Curso #${enrollment.courseId}`}
                          </TableCell>
                          <TableCell>{formatCurrency(enrollment.amount)}</TableCell>
                          <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                          <TableCell>{getPaymentMethodBadge(enrollment.paymentMethod)}</TableCell>
                          <TableCell>{new Date(enrollment.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {enrollment.paymentUrl && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(enrollment.paymentUrl, '_blank')}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Link
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {enrollments.filter((e: SimplifiedEnrollment) => 
                        ['pending', 'waiting_payment'].includes(e.status)
                      ).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                            Nenhuma matrícula pendente encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Matrículas</CardTitle>
                <CardDescription>
                  Histórico completo de matrículas simplificadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEnrollments ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableCaption>Lista de todas as matrículas</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map((enrollment: SimplifiedEnrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">{enrollment.id}</TableCell>
                          <TableCell>{enrollment.studentName}</TableCell>
                          <TableCell>
                            {courses.find((c: any) => c.id === enrollment.courseId)?.title || 
                             `Curso #${enrollment.courseId}`}
                          </TableCell>
                          <TableCell>{formatCurrency(enrollment.amount)}</TableCell>
                          <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                          <TableCell>{getPaymentMethodBadge(enrollment.paymentMethod)}</TableCell>
                          <TableCell>{new Date(enrollment.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {enrollment.paymentUrl && enrollment.status === 'waiting_payment' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(enrollment.paymentUrl, '_blank')}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Link
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {enrollments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                            Nenhuma matrícula encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}