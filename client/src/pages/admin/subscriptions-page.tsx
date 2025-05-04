import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AppShell } from '@/components/layout/app-shell';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

// Icons
import {
  MoreHorizontal,
  Search,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  Clock,
  DownloadCloud,
  CalendarRange,
  Clock3,
  Repeat,
  User,
  CheckCircle,
  XCircle,
  Filter,
  BarChart4,
  FileText,
} from "lucide-react";

// Interface para assinaturas
interface Subscription {
  id: number;
  studentName: string;
  studentId: number;
  courseName: string;
  courseId: number;
  plan: string;
  value: number;
  frequency: 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual';
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  nextPayment: string;
  startDate: string;
  endDate?: string;
  totalPayments: number;
  paidPayments: number;
  gatewayId: string;
  paymentHistory: {
    id: number;
    date: string;
    value: number;
    status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  }[];
}

// Interface para resumo
interface SubscriptionSummary {
  activeSubscriptions: number;
  pausedSubscriptions: number;
  cancelledSubscriptions: number;
  completedSubscriptions: number;
  totalRecurringValue: number;
  subscriptionsByPlan: {
    name: string;
    count: number;
  }[];
  subscriptionsByFrequency: {
    name: string;
    count: number;
  }[];
}

// Componente de simulação de dados - seria substituído por uma chamada real à API
const mockSubscriptions: Subscription[] = [
  {
    id: 1,
    studentName: "João Silva",
    studentId: 101,
    courseName: "MBA em Gestão Empresarial",
    courseId: 1,
    plan: "Premium",
    value: 399.90,
    frequency: 'monthly',
    status: 'active',
    nextPayment: "2025-05-15",
    startDate: "2025-01-15",
    totalPayments: 12,
    paidPayments: 4,
    gatewayId: "sub_12345",
    paymentHistory: [
      { id: 1001, date: "2025-04-15", value: 399.90, status: 'paid' },
      { id: 1002, date: "2025-03-15", value: 399.90, status: 'paid' },
      { id: 1003, date: "2025-02-15", value: 399.90, status: 'paid' },
      { id: 1004, date: "2025-01-15", value: 399.90, status: 'paid' },
    ]
  },
  {
    id: 2,
    studentName: "Maria Oliveira",
    studentId: 102,
    courseName: "Pós-graduação em Marketing Digital",
    courseId: 2,
    plan: "Standard",
    value: 299.90,
    frequency: 'monthly',
    status: 'active',
    nextPayment: "2025-05-10",
    startDate: "2025-02-10",
    totalPayments: 18,
    paidPayments: 3,
    gatewayId: "sub_23456",
    paymentHistory: [
      { id: 2001, date: "2025-04-10", value: 299.90, status: 'paid' },
      { id: 2002, date: "2025-03-10", value: 299.90, status: 'paid' },
      { id: 2003, date: "2025-02-10", value: 299.90, status: 'paid' },
    ]
  },
  {
    id: 3,
    studentName: "Pedro Santos",
    studentId: 103,
    courseName: "Desenvolvimento Web Full Stack",
    courseId: 3,
    plan: "Premium",
    value: 349.90,
    frequency: 'monthly',
    status: 'paused',
    nextPayment: "2025-05-20",
    startDate: "2025-02-20",
    totalPayments: 12,
    paidPayments: 2,
    gatewayId: "sub_34567",
    paymentHistory: [
      { id: 3001, date: "2025-03-20", value: 349.90, status: 'paid' },
      { id: 3002, date: "2025-02-20", value: 349.90, status: 'paid' },
    ]
  },
  {
    id: 4,
    studentName: "Ana Souza",
    studentId: 104,
    courseName: "Pós-graduação em Data Science",
    courseId: 4,
    plan: "Standard",
    value: 449.90,
    frequency: 'quarterly',
    status: 'cancelled',
    nextPayment: "N/A",
    startDate: "2025-01-05",
    endDate: "2025-04-01",
    totalPayments: 4,
    paidPayments: 1,
    gatewayId: "sub_45678",
    paymentHistory: [
      { id: 4001, date: "2025-01-05", value: 449.90, status: 'paid' },
      { id: 4002, date: "2025-04-05", value: 449.90, status: 'cancelled' },
    ]
  }
];

// Resumo simulado
const mockSummary: SubscriptionSummary = {
  activeSubscriptions: 2,
  pausedSubscriptions: 1,
  cancelledSubscriptions: 1,
  completedSubscriptions: 0,
  totalRecurringValue: 699.80,
  subscriptionsByPlan: [
    { name: "Premium", count: 2 },
    { name: "Standard", count: 2 }
  ],
  subscriptionsByFrequency: [
    { name: "Mensal", count: 3 },
    { name: "Trimestral", count: 1 }
  ]
};

// Componente principal da página
export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Buscar assinaturas - simulação
  const { 
    data: subscriptions = mockSubscriptions, 
    isLoading: isLoadingSubscriptions,
    refetch: refetchSubscriptions
  } = useQuery<Subscription[]>({
    queryKey: ['/api/admin/subscriptions'],
    queryFn: async () => {
      // Simulação de API - seria substituída por fetch real
      return new Promise<Subscription[]>((resolve) => {
        setTimeout(() => {
          resolve(mockSubscriptions);
        }, 1000);
      });
    }
  });

  // Buscar resumo - simulação
  const { 
    data: summary = mockSummary, 
    isLoading: isLoadingSummary 
  } = useQuery<SubscriptionSummary>({
    queryKey: ['/api/admin/subscriptions/summary'],
    queryFn: async () => {
      // Simulação de API - seria substituída por fetch real
      return new Promise<SubscriptionSummary>((resolve) => {
        setTimeout(() => {
          resolve(mockSummary);
        }, 1000);
      });
    }
  });

  // Mutação para pausar assinatura
  const pauseSubscriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simulação de API - seria substituída por fetch real
      return new Promise<{ success: boolean }>((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Assinatura pausada",
        description: "A assinatura foi pausada com sucesso.",
      });
      refetchSubscriptions();
      setIsManageDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao pausar assinatura",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  });

  // Mutação para reativar assinatura
  const resumeSubscriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simulação de API - seria substituída por fetch real
      return new Promise<{ success: boolean }>((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Assinatura reativada",
        description: "A assinatura foi reativada com sucesso.",
      });
      refetchSubscriptions();
      setIsManageDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao reativar assinatura",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  });

  // Mutação para cancelar assinatura
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simulação de API - seria substituída por fetch real
      return new Promise<{ success: boolean }>((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Assinatura cancelada",
        description: "A assinatura foi cancelada com sucesso.",
      });
      refetchSubscriptions();
      setIsManageDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar assinatura",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  });

  // Filtrar assinaturas
  const filteredSubscriptions = subscriptions.filter(subscription => {
    // Filtro por busca
    const searchFilter = searchQuery ? 
      subscription.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      subscription.courseName.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    
    // Filtro por tab
    const tabFilter = selectedTab === 'all' ? 
      true : 
      subscription.status === selectedTab;
    
    // Filtro por status selecionado
    const statusFilter = selectedStatus ? 
      subscription.status === selectedStatus : 
      true;
    
    return searchFilter && tabFilter && statusFilter;
  });

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatador de data
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Obter badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'paused':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Pausada</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelada</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Concluída</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Traduzir frequência de pagamento
  const translateFrequency = (frequency: string) => {
    const frequencyMap: {[key: string]: string} = {
      'monthly': 'Mensal',
      'bimonthly': 'Bimestral',
      'quarterly': 'Trimestral',
      'semiannual': 'Semestral',
      'annual': 'Anual'
    };
    
    return frequencyMap[frequency] || frequency;
  };

  // Abrir diálogo de histórico
  const openHistoryDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsHistoryDialogOpen(true);
  };

  // Abrir diálogo de gerenciamento
  const openManageDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsManageDialogOpen(true);
  };

  // Funções para gerenciamento
  const handlePauseSubscription = () => {
    if (selectedSubscription) {
      pauseSubscriptionMutation.mutate(selectedSubscription.id);
    }
  };

  const handleResumeSubscription = () => {
    if (selectedSubscription) {
      resumeSubscriptionMutation.mutate(selectedSubscription.id);
    }
  };

  const handleCancelSubscription = () => {
    if (selectedSubscription) {
      cancelSubscriptionMutation.mutate(selectedSubscription.id);
    }
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Assinaturas</h1>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                refetchSubscriptions();
              }}
              variant="outline"
              className="gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Card de Assinaturas Ativas */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assinaturas Ativas</p>
                  {isLoadingSummary ? (
                    <Skeleton className="h-9 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">
                      {summary?.activeSubscriptions || 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Repeat className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card de Valor Recorrente */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Recorrente Mensal</p>
                  {isLoadingSummary ? (
                    <Skeleton className="h-9 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(summary?.totalRecurringValue || 0)}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <BarChart4 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card de Assinaturas Pausadas */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assinaturas Pausadas</p>
                  {isLoadingSummary ? (
                    <Skeleton className="h-9 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-amber-600">
                      {summary?.pausedSubscriptions || 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <PauseCircle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Distribuição por Plano e Frequência</CardTitle>
            <CardDescription>
              Visão geral das assinaturas ativas por plano e frequência de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Por Plano</h3>
                  <div className="space-y-3">
                    {summary?.subscriptionsByPlan.map((plan, index) => (
                      <div key={index} className="flex justify-between items-center pb-2 border-b">
                        <p>{plan.name}</p>
                        <p className="font-semibold">{plan.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Por Frequência</h3>
                  <div className="space-y-3">
                    {summary?.subscriptionsByFrequency.map((freq, index) => (
                      <div key={index} className="flex justify-between items-center pb-2 border-b">
                        <p>{freq.name}</p>
                        <p className="font-semibold">{freq.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assinaturas</CardTitle>
                <CardDescription>
                  Gerencie as assinaturas recorrentes dos alunos
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar assinaturas..."
                    className="pl-8 w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Filter className="h-4 w-4" />
                      Filtrar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedStatus(null)}>
                      Todos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('active')}>
                      Ativas
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('paused')}>
                      Pausadas
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('cancelled')}>
                      Canceladas
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('completed')}>
                      Concluídas
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="active">Ativas</TabsTrigger>
                <TabsTrigger value="paused">Pausadas</TabsTrigger>
                <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
              </TabsList>
              <TabsContent value={selectedTab}>
                {isLoadingSubscriptions ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : filteredSubscriptions.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">ID</TableHead>
                          <TableHead>Aluno / Curso</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Frequência</TableHead>
                          <TableHead>Próximo Pagamento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubscriptions.map((subscription) => (
                          <TableRow key={subscription.id}>
                            <TableCell className="font-medium">{subscription.id}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{subscription.studentName}</p>
                                <p className="text-sm text-muted-foreground">{subscription.courseName}</p>
                              </div>
                            </TableCell>
                            <TableCell>{subscription.plan}</TableCell>
                            <TableCell>{formatCurrency(subscription.value)}</TableCell>
                            <TableCell>{translateFrequency(subscription.frequency)}</TableCell>
                            <TableCell>{formatDate(subscription.nextPayment)}</TableCell>
                            <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => openHistoryDialog(subscription)}
                                  >
                                    <Clock3 className="mr-2 h-4 w-4" />
                                    Histórico de pagamentos
                                  </DropdownMenuItem>
                                  {subscription.status === 'active' && (
                                    <DropdownMenuItem 
                                      onClick={() => openManageDialog(subscription)}
                                    >
                                      <PauseCircle className="mr-2 h-4 w-4" />
                                      Pausar assinatura
                                    </DropdownMenuItem>
                                  )}
                                  {subscription.status === 'paused' && (
                                    <DropdownMenuItem 
                                      onClick={() => openManageDialog(subscription)}
                                    >
                                      <PlayCircle className="mr-2 h-4 w-4" />
                                      Reativar assinatura
                                    </DropdownMenuItem>
                                  )}
                                  {(subscription.status === 'active' || subscription.status === 'paused') && (
                                    <DropdownMenuItem 
                                      onClick={() => openManageDialog(subscription)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Cancelar assinatura
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    {searchQuery ? 
                      "Nenhuma assinatura encontrada para esta busca." : 
                      "Nenhuma assinatura encontrada nesta categoria."}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Diálogo de histórico de pagamentos */}
        {selectedSubscription && (
          <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Histórico de Pagamentos</DialogTitle>
                <DialogDescription>
                  Assinatura #{selectedSubscription.id} - {selectedSubscription.studentName}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium">Curso</p>
                    <p className="text-sm text-muted-foreground">{selectedSubscription.courseName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Plano</p>
                    <p className="text-sm text-muted-foreground">{selectedSubscription.plan}</p>
                  </div>
                </div>
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium">Valor</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(selectedSubscription.value)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Frequência</p>
                    <p className="text-sm text-muted-foreground">{translateFrequency(selectedSubscription.frequency)}</p>
                  </div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <p className="font-medium mb-2">Pagamentos</p>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto">
                    {selectedSubscription.paymentHistory.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="text-sm font-medium">{formatDate(payment.date)}</p>
                          <p className="text-xs text-muted-foreground">Parcela #{selectedSubscription.paymentHistory.length - selectedSubscription.paymentHistory.indexOf(payment)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(payment.value)}</p>
                          <p className="text-xs">{getStatusBadge(payment.status)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsHistoryDialogOpen(false)}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Diálogo de gerenciamento de assinatura */}
        {selectedSubscription && (
          <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerenciar Assinatura</DialogTitle>
                <DialogDescription>
                  Assinatura #{selectedSubscription.id} - {selectedSubscription.studentName}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex justify-between mb-4 border-b pb-4">
                  <div>
                    <p className="text-sm font-medium">Status Atual</p>
                    <p className="text-sm mt-1">{getStatusBadge(selectedSubscription.status)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Próximo Pagamento</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(selectedSubscription.nextPayment)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {selectedSubscription.status === 'active' && (
                    <div className="border rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Pausar Assinatura</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            A próxima cobrança será suspensa até a reativação
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={handlePauseSubscription}
                          disabled={pauseSubscriptionMutation.isPending}
                        >
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Pausar
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {selectedSubscription.status === 'paused' && (
                    <div className="border rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Reativar Assinatura</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            As cobranças serão retomadas no próximo ciclo
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={handleResumeSubscription}
                          disabled={resumeSubscriptionMutation.isPending}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Reativar
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {(selectedSubscription.status === 'active' || selectedSubscription.status === 'paused') && (
                    <div className="border rounded-md p-4 border-destructive/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Cancelar Assinatura</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Esta ação é irreversível. A assinatura será encerrada.
                          </p>
                        </div>
                        <Button 
                          variant="destructive" 
                          onClick={handleCancelSubscription}
                          disabled={cancelSubscriptionMutation.isPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsManageDialogOpen(false)}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppShell>
  );
}