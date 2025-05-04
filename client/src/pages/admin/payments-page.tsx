import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/query-client';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Icons
import {
  MoreHorizontal,
  Download,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Search,
  CalendarRange,
  DollarSign,
  BarChart4,
  FileText,
  DownloadCloud,
  Eye,
} from "lucide-react";

// Interface para pagamentos
interface Payment {
  id: number;
  partnerName: string;
  partnerId: number;
  studentName: string;
  studentId: number;
  courseName: string;
  courseId: number;
  certificationId: number;
  description: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentUrl?: string;
  receiptUrl?: string;
  transactionId?: string;
}

// Interface para resumo financeiro
interface PaymentSummary {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  totalCertifications: number;
  partnerDistribution: {
    name: string;
    count: number;
    amount: number;
  }[];
  monthlySummary: {
    month: string;
    amount: number;
  }[];
}

// Componente principal da página de Pagamentos
export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isConfirmPaymentDialogOpen, setIsConfirmPaymentDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

  // Obter todos os pagamentos
  const { 
    data: payments = [], 
    isLoading: isLoadingPayments,
    refetch: refetchPayments
  } = useQuery<Payment[]>({
    queryKey: ['/api/admin/partner-payments'],
    queryFn: async () => {
      const response = await fetch('/api/admin/partner-payments');
      if (!response.ok) {
        throw new Error('Erro ao carregar pagamentos');
      }
      return await response.json();
    }
  });

  // Obter resumo financeiro
  const { 
    data: summary, 
    isLoading: isLoadingSummary 
  } = useQuery<PaymentSummary>({
    queryKey: ['/api/admin/partner-payments/summary'],
    queryFn: async () => {
      const response = await fetch('/api/admin/partner-payments/summary');
      if (!response.ok) {
        throw new Error('Erro ao carregar resumo financeiro');
      }
      return await response.json();
    }
  });

  // Mutação para marcar pagamento como pago
  const markAsPaidMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const response = await fetch(`/api/admin/partner-payments/${paymentId}/mark-as-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao processar pagamento');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pagamento processado",
        description: "O pagamento foi marcado como pago com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/partner-payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/partner-payments/summary'] });
      setIsConfirmPaymentDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  });

  // Função para exportar relatório
  const exportReport = async () => {
    try {
      setIsExportingData(true);
      
      const response = await fetch('/api/admin/partner-payments/export');
      const data = await response.json();
      
      if (data.success && data.downloadUrl) {
        // Redirecionar para o URL de download
        window.location.href = data.downloadUrl;
        
        toast({
          title: "Relatório gerado",
          description: "O relatório financeiro foi gerado com sucesso.",
        });
      } else {
        throw new Error(data.message || 'Erro ao gerar relatório');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao exportar dados",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsExportingData(false);
    }
  };

  // Filtrar pagamentos com base na busca e status
  const filteredPayments = payments.filter(payment => {
    // Filtro por texto de busca
    const searchFilter = searchQuery ? 
      payment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    
    // Filtro por status na aba
    const tabFilter = selectedTab === 'all' ? 
      true : 
      payment.status === selectedTab;
    
    // Filtro adicional por status (dropdown)
    const statusFilter = selectedStatus ? 
      payment.status === selectedStatus : 
      true;
    
    return searchFilter && tabFilter && statusFilter;
  });

  // Obter badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Vencido</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatador de data
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para abrir o diálogo de confirmação de pagamento
  const openConfirmPaymentDialog = (paymentId: number) => {
    setSelectedPaymentId(paymentId);
    setIsConfirmPaymentDialogOpen(true);
  };

  // Função para confirmar o pagamento manualmente
  const confirmPayment = () => {
    if (selectedPaymentId) {
      markAsPaidMutation.mutate(selectedPaymentId);
    }
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => refetchPayments()}
              variant="outline"
              className="gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button
              size="sm"
              onClick={exportReport}
              disabled={isExportingData}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              {isExportingData ? "Exportando..." : "Exportar"}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Card de Total Recebido */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Recebido</p>
                  {isLoadingSummary ? (
                    <Skeleton className="h-9 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(summary?.totalReceived || 0)}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card de Pendente */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pendente</p>
                  {isLoadingSummary ? (
                    <Skeleton className="h-9 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-amber-600">
                      {formatCurrency(summary?.totalPending || 0)}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <CalendarRange className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card de Vencido */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Vencido</p>
                  {isLoadingSummary ? (
                    <Skeleton className="h-9 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(summary?.totalOverdue || 0)}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Distribuição por Parceiro</CardTitle>
            <CardDescription>
              Valores recebidos e pendentes por parceiro de certificação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {summary?.partnerDistribution.map((partner, index) => (
                  <div key={index} className="flex justify-between items-center pb-3 border-b">
                    <div>
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-sm text-muted-foreground">{partner.count} pagamentos</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(partner.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pagamentos</CardTitle>
                <CardDescription>
                  Gerencie os pagamentos de certificações de parceiros
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar pagamentos..."
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
                    <DropdownMenuItem onClick={() => setSelectedStatus('paid')}>
                      Pagos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('pending')}>
                      Pendentes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('overdue')}>
                      Vencidos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('cancelled')}>
                      Cancelados
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="paid">Pagos</TabsTrigger>
                <TabsTrigger value="overdue">Vencidos</TabsTrigger>
              </TabsList>
              <TabsContent value={selectedTab}>
                {isLoadingPayments ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : filteredPayments.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">ID</TableHead>
                          <TableHead>Aluno / Parceiro</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.id}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{payment.studentName}</p>
                                <p className="text-sm text-muted-foreground">{payment.partnerName}</p>
                              </div>
                            </TableCell>
                            <TableCell>{payment.courseName}</TableCell>
                            <TableCell>{formatDate(payment.date)}</TableCell>
                            <TableCell>{formatDate(payment.dueDate)}</TableCell>
                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
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
                                  {payment.status === 'pending' || payment.status === 'overdue' ? (
                                    <DropdownMenuItem 
                                      onClick={() => openConfirmPaymentDialog(payment.id)}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Marcar como pago
                                    </DropdownMenuItem>
                                  ) : null}
                                  {payment.paymentUrl && (
                                    <DropdownMenuItem 
                                      onClick={() => window.open(payment.paymentUrl, '_blank')}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver boleto/link
                                    </DropdownMenuItem>
                                  )}
                                  {payment.receiptUrl && (
                                    <DropdownMenuItem 
                                      onClick={() => window.open(payment.receiptUrl, '_blank')}
                                    >
                                      <DownloadCloud className="mr-2 h-4 w-4" />
                                      Baixar comprovante
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Ver detalhes
                                  </DropdownMenuItem>
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
                      "Nenhum pagamento encontrado para esta busca." : 
                      "Nenhum pagamento encontrado nesta categoria."}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Diálogo de confirmação de pagamento manual */}
        <Dialog open={isConfirmPaymentDialogOpen} onOpenChange={setIsConfirmPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar pagamento</DialogTitle>
              <DialogDescription>
                Você está prestes a marcar este pagamento como pago manualmente. 
                Esta ação será registrada no histórico de transações.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-2">
                O pagamento será considerado como recebido na data de hoje. 
                Esta operação não pode ser desfeita automaticamente.
              </p>
              <p className="text-sm font-medium">
                ID do pagamento: {selectedPaymentId}
              </p>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsConfirmPaymentDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmPayment}
                disabled={markAsPaidMutation.isPending}
              >
                {markAsPaidMutation.isPending ? "Processando..." : "Confirmar pagamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}