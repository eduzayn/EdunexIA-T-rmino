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
  Megaphone, 
  RefreshCw, 
  PlusCircle, 
  FileBarChart, 
  Users, 
  LineChart, 
  Mail,
  MessageSquare,
  Calendar,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  BarChart4,
  CircleDollarSign
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Schema para validação do formulário de campanha
const formSchema = z.object({
  name: z.string().min(3, { message: "Nome é obrigatório" }),
  description: z.string().optional(),
  type: z.string().min(1, { message: "Tipo é obrigatório" }),
  courseId: z.string().optional(),
  budget: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']),
  audience: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tenantId: z.string(),
});

// Schema para edição de campanha
const editFormSchema = z.object({
  id: z.number(),
  name: z.string().min(3, { message: "Nome é obrigatório" }),
  description: z.string().optional(),
  type: z.string().min(1, { message: "Tipo é obrigatório" }),
  courseId: z.string().optional(),
  budget: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']),
  audience: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Tipo de Campanha
type Campaign = {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  type: string;
  courseId?: number;
  courseName?: string;
  budget?: number;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  audience?: any;
  startDate?: string;
  endDate?: string;
  createdBy?: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

// Função para calcular estatísticas das campanhas
const calculateStats = (campaigns: Campaign[]) => {
  // Campanhas por tipo
  const emailCampaigns = campaigns.filter(camp => 
    camp.type === 'email' && camp.status === 'active'
  ).length;
  
  const smsCampaigns = campaigns.filter(camp => 
    (camp.type === 'sms' || camp.type === 'whatsapp') && camp.status === 'active'
  ).length;
  
  const eventCampaigns = campaigns.filter(camp => 
    camp.type === 'event' && camp.status === 'active'
  ).length;
  
  // Total de campanhas ativas
  const activeCampaigns = campaigns.filter(camp => camp.status === 'active').length;
  
  // Orçamento total
  const totalBudget = campaigns
    .filter(camp => camp.status === 'active')
    .reduce((sum, camp) => sum + (camp.budget || 0), 0);
  
  return {
    emailCampaigns,
    smsCampaigns,
    eventCampaigns,
    activeCampaigns,
    totalBudget
  };
};

// Componente principal da página de Campanhas
export default function CampaignsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("active");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Consultas
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<any[]>({
    queryKey: ['/api/courses'],
    retry: 1,
  });
  
  const { 
    data: campaigns = [], 
    isLoading: isLoadingCampaigns, 
    refetch: refetchCampaigns 
  } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns', user?.tenantId],
    enabled: !!user?.tenantId,
    queryFn: async () => {
      try {
        const response = await fetch(`/api/campaigns?tenantId=${user?.tenantId}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar campanhas');
        }
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar campanhas:', error);
        throw error;
      }
    }
  });

  // Calcular estatísticas
  const stats = calculateStats(campaigns || []);
  
  // Filtrar campanhas por status
  const filteredCampaigns = campaigns.filter(camp => {
    if (selectedTab === 'all') return true;
    return camp.status === selectedTab;
  });
  
  // Mutação para criar campanha
  const createCampaignMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao cadastrar campanha");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campanha cadastrada com sucesso!",
        description: "A campanha foi adicionada ao sistema.",
        variant: "default",
      });
      
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar campanha",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para atualizar campanha
  const updateCampaignMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch(`/api/campaigns/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar campanha");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campanha atualizada com sucesso!",
        description: "As informações foram atualizadas.",
        variant: "default",
      });
      
      setIsDialogOpen(false);
      setSelectedCampaign(null);
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar campanha",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para excluir campanha
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir campanha");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campanha excluída com sucesso!",
        description: "A campanha foi removida do sistema.",
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir campanha",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });
  
  // Formulário de criação de campanha
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "email",
      courseId: "",
      budget: "",
      status: "draft",
      audience: "",
      startDate: "",
      endDate: "",
      tenantId: user?.tenantId?.toString() || "",
    },
  });
  
  // Formulário de edição de campanha
  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      id: 0,
      name: "",
      description: "",
      type: "email",
      courseId: "",
      budget: "",
      status: "draft",
      audience: "",
      startDate: "",
      endDate: "",
    },
  });
  
  // Função para abrir o diálogo de edição de campanha
  const openEditDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsEditMode(true);
    setIsDialogOpen(true);
    
    editForm.reset({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description || "",
      type: campaign.type,
      courseId: campaign.courseId?.toString() || "",
      budget: campaign.budget?.toString() || "",
      status: campaign.status,
      audience: JSON.stringify(campaign.audience) || "",
      startDate: campaign.startDate 
        ? new Date(campaign.startDate).toISOString().split('T')[0] 
        : "",
      endDate: campaign.endDate 
        ? new Date(campaign.endDate).toISOString().split('T')[0] 
        : "",
    });
  };
  
  // Manipulador de envio do formulário de criação
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formattedData = {
      ...values,
      tenantId: parseInt(values.tenantId),
      courseId: values.courseId ? parseInt(values.courseId) : undefined,
      budget: values.budget ? parseInt(values.budget) : undefined,
      audience: values.audience ? JSON.parse(values.audience) : undefined,
      createdBy: user?.id
    };
    
    createCampaignMutation.mutate(formattedData);
  };
  
  // Manipulador de envio do formulário de edição
  const onEditSubmit = async (values: z.infer<typeof editFormSchema>) => {
    const formattedData = {
      ...values,
      courseId: values.courseId ? parseInt(values.courseId) : undefined,
      budget: values.budget ? parseInt(values.budget) : undefined,
      audience: values.audience ? JSON.parse(values.audience) : undefined,
    };
    
    updateCampaignMutation.mutate(formattedData);
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
      case 'draft':
        return <Badge variant="outline" className="bg-slate-100">Rascunho</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Agendada</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'paused':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Pausada</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Concluída</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Tradução de status para português
  const translateStatus = (status: string) => {
    const statusMap: {[key: string]: string} = {
      'draft': 'Rascunho',
      'scheduled': 'Agendada',
      'active': 'Ativa',
      'paused': 'Pausada',
      'completed': 'Concluída',
      'cancelled': 'Cancelada',
      'all': 'Todas'
    };
    
    return statusMap[status] || status;
  };
  
  // Tradução de tipo para português
  const translateType = (type: string) => {
    const typeMap: {[key: string]: string} = {
      'email': 'E-mail',
      'sms': 'SMS',
      'whatsapp': 'WhatsApp',
      'event': 'Evento',
      'social': 'Mídia Social',
      'other': 'Outro'
    };
    
    return typeMap[type] || type;
  };
  
  return (
    <AppShell>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Campanhas</h1>
            <p className="text-muted-foreground">
              Crie e gerencie campanhas de marketing para seus cursos
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetchCampaigns()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                setIsEditMode(false);
                setSelectedCampaign(null);
                form.reset({
                  name: "",
                  description: "",
                  type: "email",
                  courseId: "",
                  budget: "",
                  status: "draft",
                  audience: "",
                  startDate: "",
                  endDate: "",
                  tenantId: user?.tenantId?.toString() || "",
                });
                setIsDialogOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </div>
        </div>
        
        {/* Tabs para filtrar campanhas por status */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">Ativas</TabsTrigger>
            <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
            <TabsTrigger value="paused">Pausadas</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
            <TabsTrigger value="draft">Rascunhos</TabsTrigger>
          </TabsList>
          
          {/* Grid de estatísticas visível apenas na tab active */}
          {selectedTab === 'active' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {/* Card de Email Campaigns */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">E-mail</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.emailCampaigns}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Campanhas ativas
                  </p>
                </CardContent>
              </Card>
              
              {/* Card de SMS/WhatsApp Campaigns */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">SMS/WhatsApp</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.smsCampaigns}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Campanhas ativas
                  </p>
                </CardContent>
              </Card>
              
              {/* Card de Eventos */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Eventos</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.eventCampaigns}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Eventos ativos
                  </p>
                </CardContent>
              </Card>
              
              {/* Card de Orçamento Total */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Investimento total
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Tabela de campanhas */}
          <Card>
            <CardHeader>
              <CardTitle>Campanhas - {translateStatus(selectedTab)}</CardTitle>
              <CardDescription>
                {selectedTab === 'all' 
                  ? 'Todas as campanhas de marketing' 
                  : `Campanhas com status: ${translateStatus(selectedTab)}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingCampaigns ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma campanha encontrada com o status selecionado.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Orçamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Fim</TableHead>
                      <TableHead>Criado por</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{translateType(campaign.type)}</TableCell>
                        <TableCell>{campaign.courseName || "Não específico"}</TableCell>
                        <TableCell>{formatCurrency(campaign.budget)}</TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>
                          {campaign.startDate 
                            ? new Date(campaign.startDate).toLocaleDateString('pt-BR') 
                            : "Não definida"}
                        </TableCell>
                        <TableCell>
                          {campaign.endDate 
                            ? new Date(campaign.endDate).toLocaleDateString('pt-BR') 
                            : "Não definida"}
                        </TableCell>
                        <TableCell>{campaign.createdByName || "Sistema"}</TableCell>
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
                              <DropdownMenuItem onClick={() => openEditDialog(campaign)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  if (window.confirm("Tem certeza que deseja excluir esta campanha?")) {
                                    deleteCampaignMutation.mutate(campaign.id);
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
        
        {/* Seção de Recursos Destacados */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recursos de Marketing</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Integração com WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Envie mensagens automáticas e personalizadas para leads e alunos potenciais.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    toast({
                      title: "Recurso em desenvolvimento",
                      description: "A integração com WhatsApp estará disponível em breve.",
                      variant: "default",
                    });
                  }}
                >
                  Em breve
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Automação de E-mail</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Crie fluxos automatizados de e-mails para nutrir leads durante o funil de vendas.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    toast({
                      title: "Recurso em desenvolvimento",
                      description: "A automação de e-mail estará disponível em breve.",
                      variant: "default",
                    });
                  }}
                >
                  Em breve
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análise de Desempenho</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Acompanhe métricas como taxas de abertura, conversão e ROI das suas campanhas.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    toast({
                      title: "Recurso em desenvolvimento",
                      description: "As análises de desempenho estarão disponíveis em breve.",
                      variant: "default",
                    });
                  }}
                >
                  Em breve
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        {/* Diálogo para adicionar/editar campanha */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Editar Campanha" : "Nova Campanha"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "Atualize as informações da campanha de marketing" 
                  : "Preencha os dados para criar uma nova campanha de marketing"}
              </DialogDescription>
            </DialogHeader>
            
            {isEditMode ? (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome*</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da campanha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição da campanha"
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo*</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="email">E-mail</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="event">Evento</SelectItem>
                              <SelectItem value="social">Mídia Social</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
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
                              <SelectItem value="">Nenhum</SelectItem>
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
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orçamento (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Orçamento da campanha" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                              <SelectItem value="draft">Rascunho</SelectItem>
                              <SelectItem value="scheduled">Agendada</SelectItem>
                              <SelectItem value="active">Ativa</SelectItem>
                              <SelectItem value="paused">Pausada</SelectItem>
                              <SelectItem value="completed">Concluída</SelectItem>
                              <SelectItem value="cancelled">Cancelada</SelectItem>
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
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              placeholder="Data de início" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Término</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              placeholder="Data de término" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="audience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audiência (JSON)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder='{"target": "estudantes", "age": "18-25", "interests": ["tecnologia", "educação"]}'
                            className="resize-none font-mono text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Descreva a audiência-alvo em formato JSON.
                        </FormDescription>
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
                      disabled={updateCampaignMutation.isPending}
                    >
                      {updateCampaignMutation.isPending && (
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome*</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da campanha" {...field} />
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
                            placeholder="Descrição da campanha"
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo*</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="email">E-mail</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="event">Evento</SelectItem>
                              <SelectItem value="social">Mídia Social</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
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
                              <SelectItem value="">Nenhum</SelectItem>
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
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orçamento (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Orçamento da campanha" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                              <SelectItem value="draft">Rascunho</SelectItem>
                              <SelectItem value="scheduled">Agendada</SelectItem>
                              <SelectItem value="active">Ativa</SelectItem>
                              <SelectItem value="paused">Pausada</SelectItem>
                              <SelectItem value="completed">Concluída</SelectItem>
                              <SelectItem value="cancelled">Cancelada</SelectItem>
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
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              placeholder="Data de início" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Término</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              placeholder="Data de término" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="audience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audiência (JSON)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder='{"target": "estudantes", "age": "18-25", "interests": ["tecnologia", "educação"]}'
                            className="resize-none font-mono text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Descreva a audiência-alvo em formato JSON.
                        </FormDescription>
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
                      disabled={createCampaignMutation.isPending}
                    >
                      {createCampaignMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Criar Campanha
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