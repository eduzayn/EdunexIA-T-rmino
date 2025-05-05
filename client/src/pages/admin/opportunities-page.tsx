import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { 
  Lightbulb, 
  RefreshCw, 
  Wallet, 
  PlusCircle, 
  Users, 
  FileBarChart, 
  CheckCircle2, 
  Loader2,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// Schema para validação do formulário de oportunidade
const formSchema = z.object({
  title: z.string().min(3, { message: "Título é obrigatório" }),
  leadId: z.string().optional(),
  courseId: z.string().optional(),
  value: z.string().optional(),
  predictedClosingDate: z.string().optional(),
  status: z.enum(['open', 'negotiation', 'won', 'lost', 'cancelled']),
  assignedTo: z.string().optional(),
  probability: z.string().optional(),
  notes: z.string().optional(),
  tenantId: z.string(),
});

// Schema para edição de oportunidade
const editFormSchema = z.object({
  id: z.number(),
  title: z.string().min(3, { message: "Título é obrigatório" }),
  leadId: z.string().optional(),
  courseId: z.string().optional(),
  value: z.string().optional(),
  predictedClosingDate: z.string().optional(),
  status: z.enum(['open', 'negotiation', 'won', 'lost', 'cancelled']),
  assignedTo: z.string().optional(),
  probability: z.string().optional(),
  notes: z.string().optional(),
});

// Tipo de Oportunidade
type Opportunity = {
  id: number;
  tenantId: number;
  title: string;
  leadId?: number;
  leadName?: string;
  courseId?: number;
  courseName?: string;
  value?: number;
  predictedClosingDate?: string;
  status: 'open' | 'negotiation' | 'won' | 'lost' | 'cancelled';
  assignedTo?: number;
  assignedToName?: string;
  probability?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
};

// Função para calcular estatísticas das oportunidades
const calculateStats = (opportunities: Opportunity[]) => {
  // Quantidade de oportunidades abertas (open ou negotiation)
  const openOpportunities = opportunities.filter(opp => 
    opp.status === 'open' || opp.status === 'negotiation'
  ).length;
  
  // Valor total das oportunidades abertas
  const totalValue = opportunities
    .filter(opp => opp.status === 'open' || opp.status === 'negotiation')
    .reduce((sum, opp) => sum + (opp.value || 0), 0);
  
  // Taxa de conversão (won / total completados)
  const completedOpportunities = opportunities.filter(opp => 
    opp.status === 'won' || opp.status === 'lost' || opp.status === 'cancelled'
  );
  
  const wonOpportunities = opportunities.filter(opp => opp.status === 'won').length;
  
  const conversionRate = completedOpportunities.length > 0
    ? Math.round((wonOpportunities / completedOpportunities.length) * 100)
    : 0;
  
  return {
    openOpportunities,
    totalValue,
    conversionRate,
    wonOpportunities
  };
};

// Componente principal da página de Oportunidades
export default function OpportunitiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [pipelineTab, setPipelineTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Consultas
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery<any[]>({
    queryKey: ['/api/leads'],
    retry: 1,
  });
  
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<any[]>({
    queryKey: ['/api/courses'],
    retry: 1,
  });
  
  const { data: consultants = [], isLoading: isLoadingConsultants } = useQuery<any[]>({
    queryKey: ['/api/users/consultants'],
    retry: 1,
  });
  
  const { 
    data: opportunities = [], 
    isLoading: isLoadingOpportunities, 
    refetch: refetchOpportunities 
  } = useQuery<Opportunity[]>({
    queryKey: ['/api/opportunities', user?.tenantId],
    enabled: !!user?.tenantId,
    queryFn: async () => {
      try {
        const response = await fetch(`/api/opportunities?tenantId=${user?.tenantId}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar oportunidades');
        }
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar oportunidades:', error);
        throw error;
      }
    }
  });

  // Calcular estatísticas
  const stats = calculateStats(opportunities || []);
  
  // Filtrar oportunidades para a tab pipeline
  const filteredOpportunities = pipelineTab === 'all' 
    ? opportunities 
    : opportunities.filter(opp => opp.status === pipelineTab);
  
  // Mutação para criar oportunidade
  const createOpportunityMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao cadastrar oportunidade");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Oportunidade cadastrada com sucesso!",
        description: "A oportunidade foi adicionada ao sistema.",
        variant: "default",
      });
      
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar oportunidade",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para atualizar oportunidade
  const updateOpportunityMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch(`/api/opportunities/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar oportunidade");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Oportunidade atualizada com sucesso!",
        description: "As informações foram atualizadas.",
        variant: "default",
      });
      
      setIsDialogOpen(false);
      setSelectedOpportunity(null);
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar oportunidade",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para excluir oportunidade
  const deleteOpportunityMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir oportunidade");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Oportunidade excluída com sucesso!",
        description: "A oportunidade foi removida do sistema.",
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir oportunidade",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });
  
  // Formulário de criação de oportunidade
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      leadId: "",
      courseId: "",
      value: "",
      predictedClosingDate: "",
      status: "open",
      assignedTo: "",
      probability: "50",
      notes: "",
      tenantId: user?.tenantId?.toString() || "",
    },
  });
  
  // Formulário de edição de oportunidade
  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      id: 0,
      title: "",
      leadId: "",
      courseId: "",
      value: "",
      predictedClosingDate: "",
      status: "open",
      assignedTo: "",
      probability: "50",
      notes: "",
    },
  });
  
  // Função para abrir o diálogo de edição de oportunidade
  const openEditDialog = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsEditMode(true);
    setIsDialogOpen(true);
    
    editForm.reset({
      id: opportunity.id,
      title: opportunity.title,
      leadId: opportunity.leadId?.toString() || "",
      courseId: opportunity.courseId?.toString() || "",
      value: opportunity.value?.toString() || "",
      predictedClosingDate: opportunity.predictedClosingDate 
        ? new Date(opportunity.predictedClosingDate).toISOString().split('T')[0] 
        : "",
      status: opportunity.status,
      assignedTo: opportunity.assignedTo?.toString() || "",
      probability: opportunity.probability?.toString() || "50",
      notes: opportunity.notes || "",
    });
  };
  
  // Manipulador de envio do formulário de criação
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formattedData = {
      ...values,
      tenantId: parseInt(values.tenantId),
      leadId: values.leadId ? parseInt(values.leadId) : undefined,
      courseId: values.courseId ? parseInt(values.courseId) : undefined,
      value: values.value ? parseInt(values.value) : undefined,
      assignedTo: values.assignedTo ? parseInt(values.assignedTo) : undefined,
      probability: values.probability ? parseInt(values.probability) : 50,
    };
    
    createOpportunityMutation.mutate(formattedData);
  };
  
  // Manipulador de envio do formulário de edição
  const onEditSubmit = async (values: z.infer<typeof editFormSchema>) => {
    const formattedData = {
      ...values,
      leadId: values.leadId ? parseInt(values.leadId) : undefined,
      courseId: values.courseId ? parseInt(values.courseId) : undefined,
      value: values.value ? parseInt(values.value) : undefined,
      assignedTo: values.assignedTo ? parseInt(values.assignedTo) : undefined,
      probability: values.probability ? parseInt(values.probability) : 50,
    };
    
    updateOpportunityMutation.mutate(formattedData);
  };
  
  // Função para formatar valores monetários
  const formatCurrency = (value?: number) => {
    if (value === undefined) return "Não definido";
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };
  
  // Função para mapear status para badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Aberta</Badge>;
      case 'negotiation':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Em Negociação</Badge>;
      case 'won':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Ganha</Badge>;
      case 'lost':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Perdida</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-slate-100">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Tradução de status para português
  const translateStatus = (status: string) => {
    const statusMap: {[key: string]: string} = {
      'open': 'Aberta',
      'negotiation': 'Em Negociação',
      'won': 'Ganha',
      'lost': 'Perdida',
      'cancelled': 'Cancelada',
      'all': 'Todas'
    };
    
    return statusMap[status] || status;
  };
  
  return (
    <AppShell>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Oportunidades</h1>
            <p className="text-muted-foreground">
              Acompanhe e gerencie o funil de vendas para seus cursos
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetchOpportunities()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                setIsEditMode(false);
                setSelectedOpportunity(null);
                form.reset({
                  title: "",
                  leadId: "",
                  courseId: "",
                  value: "",
                  predictedClosingDate: "",
                  status: "open",
                  assignedTo: "",
                  probability: "50",
                  notes: "",
                  tenantId: user?.tenantId?.toString() || "",
                });
                setIsDialogOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova Oportunidade
            </Button>
          </div>
        </div>
        
        {/* Tabs para navegação na página */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="forecasting">Previsões</TabsTrigger>
          </TabsList>
          
          {/* Conteúdo da Tab Visão Geral */}
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Card de Oportunidades Abertas */}
              <Card className="bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Oportunidades Abertas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.openOpportunities}</div>
                    <Lightbulb className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total de oportunidades ativas
                  </p>
                </CardContent>
              </Card>
              
              {/* Card de Valor Total */}
              <Card className="bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Valor Total (R$)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
                    <Wallet className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor potencial de vendas
                  </p>
                </CardContent>
              </Card>
              
              {/* Card de Taxa de Conversão */}
              <Card className="bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Taxa de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Oportunidades ganhas/total
                  </p>
                </CardContent>
              </Card>
              
              {/* Card de Oportunidades Ganhas */}
              <Card className="bg-gradient-to-br from-emerald-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Oportunidades Ganhas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.wonOpportunities}</div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total de vendas realizadas
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Oportunidades Recentes</CardTitle>
                <CardDescription>
                  Últimas oportunidades registradas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingOpportunities ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : opportunities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma oportunidade encontrada. Adicione novas oportunidades para começar.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Lead</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Data Prevista</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {opportunities.slice(0, 5).map((opportunity) => (
                        <TableRow key={opportunity.id}>
                          <TableCell className="font-medium">{opportunity.title}</TableCell>
                          <TableCell>{opportunity.leadName || "Não vinculado"}</TableCell>
                          <TableCell>{opportunity.courseName || "Não especificado"}</TableCell>
                          <TableCell>{formatCurrency(opportunity.value)}</TableCell>
                          <TableCell>{getStatusBadge(opportunity.status)}</TableCell>
                          <TableCell>{opportunity.assignedToName || "Não atribuído"}</TableCell>
                          <TableCell>
                            {opportunity.predictedClosingDate 
                              ? new Date(opportunity.predictedClosingDate).toLocaleDateString('pt-BR') 
                              : "Não definida"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditDialog(opportunity)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    if (window.confirm("Tem certeza que deseja excluir esta oportunidade?")) {
                                      deleteOpportunityMutation.mutate(opportunity.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
              {opportunities.length > 5 && (
                <CardFooter className="justify-center border-t py-4">
                  <Button variant="outline" onClick={() => setSelectedTab("pipeline")}>
                    Ver todas as oportunidades
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          {/* Conteúdo da Tab Pipeline */}
          <TabsContent value="pipeline">
            <Tabs value={pipelineTab} onValueChange={setPipelineTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="open">Abertas</TabsTrigger>
                <TabsTrigger value="negotiation">Em Negociação</TabsTrigger>
                <TabsTrigger value="won">Ganhas</TabsTrigger>
                <TabsTrigger value="lost">Perdidas</TabsTrigger>
                <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
              </TabsList>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline de Vendas - {translateStatus(pipelineTab)}</CardTitle>
                  <CardDescription>
                    {pipelineTab === 'all' 
                      ? 'Todas as oportunidades do sistema' 
                      : `Oportunidades com status: ${translateStatus(pipelineTab)}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingOpportunities ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredOpportunities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhuma oportunidade encontrada com o status selecionado.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Lead</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Probabilidade</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Data Criação</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOpportunities.map((opportunity) => (
                          <TableRow key={opportunity.id}>
                            <TableCell className="font-medium">{opportunity.title}</TableCell>
                            <TableCell>{opportunity.leadName || "Não vinculado"}</TableCell>
                            <TableCell>{opportunity.courseName || "Não especificado"}</TableCell>
                            <TableCell>{formatCurrency(opportunity.value)}</TableCell>
                            <TableCell>{getStatusBadge(opportunity.status)}</TableCell>
                            <TableCell>{opportunity.probability || 50}%</TableCell>
                            <TableCell>{opportunity.assignedToName || "Não atribuído"}</TableCell>
                            <TableCell>{new Date(opportunity.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openEditDialog(opportunity)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => {
                                      if (window.confirm("Tem certeza que deseja excluir esta oportunidade?")) {
                                        deleteOpportunityMutation.mutate(opportunity.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Tabs>
          </TabsContent>
          
          {/* Conteúdo da Tab Previsões */}
          <TabsContent value="forecasting">
            <Card>
              <CardHeader>
                <CardTitle>Previsão de Vendas</CardTitle>
                <CardDescription>
                  Analise tendências e estimativas de receita futura baseadas no pipeline atual
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 border-t">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Previsão Mensal</CardTitle>
                        <CardDescription>
                          Estimativa baseada nas oportunidades atuais
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span>Valor total ponderado:</span>
                            <span className="font-semibold">
                              {formatCurrency(
                                opportunities
                                  .filter(opp => opp.status === 'open' || opp.status === 'negotiation')
                                  .reduce((sum, opp) => sum + ((opp.value || 0) * (opp.probability || 50) / 100), 0)
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Oportunidades prováveis ({'>'}70%):</span>
                            <span className="font-semibold">
                              {opportunities.filter(opp => 
                                (opp.status === 'open' || opp.status === 'negotiation') && 
                                (opp.probability || 0) > 70
                              ).length}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Valor provável:</span>
                            <span className="font-semibold">
                              {formatCurrency(
                                opportunities
                                  .filter(opp => 
                                    (opp.status === 'open' || opp.status === 'negotiation') && 
                                    (opp.probability || 0) > 70
                                  )
                                  .reduce((sum, opp) => sum + (opp.value || 0), 0)
                              )}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Próximos Fechamentos</CardTitle>
                        <CardDescription>
                          Oportunidades com data de fechamento nos próximos 30 dias
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {opportunities.filter(opp => {
                          if (!opp.predictedClosingDate) return false;
                          const closingDate = new Date(opp.predictedClosingDate);
                          const today = new Date();
                          const thirtyDaysFromNow = new Date();
                          thirtyDaysFromNow.setDate(today.getDate() + 30);
                          return closingDate >= today && closingDate <= thirtyDaysFromNow;
                        }).length === 0 ? (
                          <p className="text-muted-foreground">Nenhuma oportunidade com fechamento previsto nos próximos 30 dias.</p>
                        ) : (
                          <div className="space-y-4">
                            {opportunities
                              .filter(opp => {
                                if (!opp.predictedClosingDate) return false;
                                const closingDate = new Date(opp.predictedClosingDate);
                                const today = new Date();
                                const thirtyDaysFromNow = new Date();
                                thirtyDaysFromNow.setDate(today.getDate() + 30);
                                return closingDate >= today && closingDate <= thirtyDaysFromNow;
                              })
                              .slice(0, 3)
                              .map(opp => (
                                <div key={opp.id} className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{opp.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {opp.predictedClosingDate && new Date(opp.predictedClosingDate).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{formatCurrency(opp.value)}</p>
                                    <p className="text-sm text-muted-foreground">{opp.probability || 50}% prob.</p>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Diálogo para adicionar/editar oportunidade */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Editar Oportunidade" : "Nova Oportunidade"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "Atualize as informações da oportunidade de venda" 
                  : "Preencha os dados para criar uma nova oportunidade de venda"}
              </DialogDescription>
            </DialogHeader>
            
            {isEditMode ? (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                  <FormField
                    control={editForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título*</FormLabel>
                        <FormControl>
                          <Input placeholder="Título da oportunidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="leadId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um lead" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Nenhum</SelectItem>
                              {leads.map((lead) => (
                                <SelectItem key={lead.id} value={lead.id.toString()}>
                                  {lead.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="courseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Curso</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um curso" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Nenhum</SelectItem>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id.toString()}>
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Valor da oportunidade" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="predictedClosingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Prevista de Fechamento</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              placeholder="Data prevista" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status*</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="open">Aberta</SelectItem>
                              <SelectItem value="negotiation">Em Negociação</SelectItem>
                              <SelectItem value="won">Ganha</SelectItem>
                              <SelectItem value="lost">Perdida</SelectItem>
                              <SelectItem value="cancelled">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsável</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um responsável" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Nenhum</SelectItem>
                              {consultants.map((consultant) => (
                                <SelectItem key={consultant.id} value={consultant.id.toString()}>
                                  {consultant.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="probability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probabilidade de Fechamento (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Probabilidade (%)" 
                            min="0"
                            max="100"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações adicionais sobre a oportunidade"
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateOpportunityMutation.isPending}
                    >
                      {updateOpportunityMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Salvar Alterações
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título*</FormLabel>
                        <FormControl>
                          <Input placeholder="Título da oportunidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="leadId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um lead" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Nenhum</SelectItem>
                              {leads.map((lead) => (
                                <SelectItem key={lead.id} value={lead.id.toString()}>
                                  {lead.name}
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
                      name="courseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Curso</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um curso" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Nenhum</SelectItem>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id.toString()}>
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Valor da oportunidade" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="predictedClosingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Prevista de Fechamento</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              placeholder="Data prevista" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status*</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="open">Aberta</SelectItem>
                              <SelectItem value="negotiation">Em Negociação</SelectItem>
                              <SelectItem value="won">Ganha</SelectItem>
                              <SelectItem value="lost">Perdida</SelectItem>
                              <SelectItem value="cancelled">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsável</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um responsável" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Nenhum</SelectItem>
                              {consultants.map((consultant) => (
                                <SelectItem key={consultant.id} value={consultant.id.toString()}>
                                  {consultant.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="probability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probabilidade de Fechamento (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Probabilidade (%)" 
                            min="0"
                            max="100"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações adicionais sobre a oportunidade"
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tenantId"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createOpportunityMutation.isPending}
                    >
                      {createOpportunityMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Criar Oportunidade
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}