import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

// Recharts para gráficos
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Icons
import {
  Calendar,
  Download,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  BarChart3,
  RefreshCw,
} from "lucide-react";

// Interface para relatório financeiro
interface FinancialReport {
  summary: {
    totalRevenue: number;
    totalPendingPayments: number;
    totalInvoiced: number;
    totalCancellations: number;
    averageTicket: number;
    paymentConversionRate: number;
    monthlyGrowthRate: number;
  };
  revenueByType: {
    certifications: number;
    courses: number;
    subscriptions: number;
    events: number;
    other: number;
  };
  revenueByMonth: {
    month: string;
    revenue: number;
    pendingPayments: number;
  }[];
  revenueByPartner: {
    partnerName: string;
    amount: number;
    percentage: number;
  }[];
  paymentsByMethod: {
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }[];
  invoices: {
    id: number;
    number: string;
    date: string;
    dueDate: string;
    total: number;
    status: string;
    customerName: string;
    type: string;
  }[];
}

// Cores para gráficos
const CHART_COLORS = ['#34d399', '#fcd34d', '#f87171', '#60a5fa', '#a855f7', '#ec4899'];

// Componente principal da página
export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("last30days");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExportingData, setIsExportingData] = useState(false);

  // Buscar dados financeiros - simulação
  const { 
    data: financialReport, 
    isLoading, 
    refetch 
  } = useQuery<FinancialReport>({
    queryKey: ['/api/admin/financial-report', selectedPeriod],
    queryFn: async () => {
      // Simulação de API - seria substituída por fetch real
      return new Promise<FinancialReport>((resolve) => {
        setTimeout(() => {
          resolve({
            summary: {
              totalRevenue: 85990.50,
              totalPendingPayments: 12450.00,
              totalInvoiced: 98440.50,
              totalCancellations: 4300.00,
              averageTicket: 349.90,
              paymentConversionRate: 87.35,
              monthlyGrowthRate: 12.5
            },
            revenueByType: {
              certifications: 32450.50,
              courses: 28750.00,
              subscriptions: 18990.00,
              events: 3500.00,
              other: 2300.00
            },
            revenueByMonth: [
              { month: 'Jan', revenue: 12500.00, pendingPayments: 2200.00 },
              { month: 'Fev', revenue: 13800.00, pendingPayments: 1850.00 },
              { month: 'Mar', revenue: 14250.00, pendingPayments: 2100.00 },
              { month: 'Abr', revenue: 15200.00, pendingPayments: 2500.00 },
              { month: 'Mai', revenue: 17500.00, pendingPayments: 2350.00 },
              { month: 'Jun', revenue: 12740.50, pendingPayments: 1450.00 }
            ],
            revenueByPartner: [
              { partnerName: 'Parceiro A', amount: 32450.50, percentage: 37.7 },
              { partnerName: 'Parceiro B', amount: 25300.00, percentage: 29.4 },
              { partnerName: 'Parceiro C', amount: 18240.00, percentage: 21.2 },
              { partnerName: 'Parceiro D', amount: 10000.00, percentage: 11.7 }
            ],
            paymentsByMethod: [
              { method: 'Cartão de Crédito', count: 158, amount: 55243.50, percentage: 64.2 },
              { method: 'Boleto', count: 45, amount: 15747.00, percentage: 18.3 },
              { method: 'PIX', count: 42, amount: 15000.00, percentage: 17.5 }
            ],
            invoices: [
              { 
                id: 1, 
                number: 'INV-2025-001', 
                date: '2025-04-01', 
                dueDate: '2025-04-15', 
                total: 2500.00, 
                status: 'paid', 
                customerName: 'João Silva',
                type: 'certification'
              },
              { 
                id: 2, 
                number: 'INV-2025-002', 
                date: '2025-04-02', 
                dueDate: '2025-04-16', 
                total: 1800.00, 
                status: 'paid', 
                customerName: 'Maria Oliveira',
                type: 'course'
              },
              { 
                id: 3, 
                number: 'INV-2025-003', 
                date: '2025-04-03', 
                dueDate: '2025-04-17', 
                total: 2100.00, 
                status: 'pending', 
                customerName: 'Pedro Santos',
                type: 'subscription'
              },
              { 
                id: 4, 
                number: 'INV-2025-004', 
                date: '2025-04-04', 
                dueDate: '2025-04-18', 
                total: 3500.00, 
                status: 'overdue', 
                customerName: 'Ana Souza',
                type: 'certification'
              },
              { 
                id: 5, 
                number: 'INV-2025-005', 
                date: '2025-04-05', 
                dueDate: '2025-04-19', 
                total: 1200.00, 
                status: 'paid', 
                customerName: 'Carlos Mendes',
                type: 'course'
              }
            ]
          });
        }, 1000);
      });
    }
  });

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatador de porcentagem
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  // Formatador de data
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

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

  // Traduzir tipo de fatura
  const translateInvoiceType = (type: string) => {
    const typeMap: {[key: string]: string} = {
      'certification': 'Certificação',
      'course': 'Curso',
      'subscription': 'Assinatura',
      'event': 'Evento',
      'other': 'Outro'
    };
    
    return typeMap[type] || type;
  };

  // Exportar dados
  const handleExportData = async () => {
    try {
      setIsExportingData(true);
      
      // Simulação de API - seria substituída por fetch real
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1500);
      });
      
      toast({
        title: "Relatório exportado",
        description: "O relatório financeiro foi exportado com sucesso.",
      });
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

  // Filtrar faturas
  const filteredInvoices = financialReport?.invoices.filter(invoice => {
    if (!searchQuery) return true;
    return (
      invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  // Preparar dados para gráfico de pizza
  const pieChartData = financialReport ? Object.entries(financialReport.revenueByType).map(([key, value], index) => ({
    name: key === 'certifications' ? 'Certificações' :
          key === 'courses' ? 'Cursos' :
          key === 'subscriptions' ? 'Assinaturas' :
          key === 'events' ? 'Eventos' : 'Outros',
    value
  })) : [];

  // Renderização condicional dos dados financeiros
  const renderFinancialData = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-10 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!financialReport) {
      return (
        <div className="text-center p-8 text-muted-foreground">
          Não foi possível carregar os dados financeiros. Tente novamente mais tarde.
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          {/* Card de Receita Total */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(financialReport.summary.totalRevenue)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
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
                  <p className="text-2xl font-bold text-amber-600">
                    {formatCurrency(financialReport.summary.totalPendingPayments)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card de Taxa de Crescimento */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Crescimento Mensal</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {financialReport.summary.monthlyGrowthRate}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card de Ticket Médio */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(financialReport.summary.averageTicket)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Faturamento</h1>
          <div className="flex items-center gap-2">
            <Select
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                <SelectItem value="last90days">Últimos 90 dias</SelectItem>
                <SelectItem value="thisMonth">Este mês</SelectItem>
                <SelectItem value="lastMonth">Mês passado</SelectItem>
                <SelectItem value="thisYear">Este ano</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => {
                refetch();
              }}
              variant="outline"
              className="gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button
              size="sm"
              onClick={handleExportData}
              disabled={isExportingData}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              {isExportingData ? "Exportando..." : "Exportar"}
            </Button>
          </div>
        </div>
        
        {renderFinancialData()}
        
        <Tabs defaultValue="overview" onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="revenue">Receita</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
            <TabsTrigger value="partners">Parceiros</TabsTrigger>
          </TabsList>
          
          {/* Aba de Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gráfico de Receita Mensal */}
              <Card>
                <CardHeader>
                  <CardTitle>Receita Mensal</CardTitle>
                  <CardDescription>
                    Receita recebida e valores pendentes por mês
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={financialReport?.revenueByMonth}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis 
                          tickFormatter={(value) => 
                            new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              notation: 'compact',
                              maximumFractionDigits: 1
                            }).format(value)
                          } 
                        />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value as number), "Valor"]}
                          labelFormatter={(label) => `Mês: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="revenue" name="Recebido" fill="#34d399" />
                        <Bar dataKey="pendingPayments" name="Pendente" fill="#fcd34d" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              {/* Gráfico de Distribuição por Tipo */}
              <Card>
                <CardHeader>
                  <CardTitle>Receita por Tipo</CardTitle>
                  <CardDescription>
                    Distribuição da receita por tipo de serviço
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value as number), "Valor"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Métodos de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pagamento</CardTitle>
                <CardDescription>
                  Distribuição de receita por método de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Método</TableHead>
                          <TableHead>Transações</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Percentual</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialReport?.paymentsByMethod.map((method, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{method.method}</TableCell>
                            <TableCell>{method.count}</TableCell>
                            <TableCell>{formatCurrency(method.amount)}</TableCell>
                            <TableCell>{formatPercentage(method.percentage)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Aba de Receita */}
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Receita</CardTitle>
                <CardDescription>
                  Detalhamento da receita recebida e pendente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[400px] w-full" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Resumo</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Total Faturado</span>
                            <span className="font-medium">{formatCurrency(financialReport?.summary.totalInvoiced || 0)}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Total Recebido</span>
                            <span className="font-medium">{formatCurrency(financialReport?.summary.totalRevenue || 0)}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Total Pendente</span>
                            <span className="font-medium">{formatCurrency(financialReport?.summary.totalPendingPayments || 0)}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Cancelamentos</span>
                            <span className="font-medium">{formatCurrency(financialReport?.summary.totalCancellations || 0)}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Taxa de Conversão</span>
                            <span className="font-medium">{financialReport?.summary.paymentConversionRate || 0}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-medium mb-3">Tendência de Receita</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart
                            data={financialReport?.revenueByMonth}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis 
                              tickFormatter={(value) => 
                                new Intl.NumberFormat('pt-BR', {
                                  notation: 'compact',
                                  maximumFractionDigits: 1
                                }).format(value)
                              } 
                            />
                            <Tooltip 
                              formatter={(value) => [formatCurrency(value as number), "Valor"]}
                              labelFormatter={(label) => `Mês: ${label}`}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="revenue"
                              name="Receita"
                              stroke="#34d399"
                              activeDot={{ r: 8 }}
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Receita por Tipo de Serviço</h3>
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              <TableHead className="text-right">Percentual</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {financialReport && Object.entries(financialReport.revenueByType).map(([key, value], index) => {
                              const percentage = value / financialReport.summary.totalRevenue * 100;
                              return (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">
                                    {key === 'certifications' ? 'Certificações' :
                                      key === 'courses' ? 'Cursos' :
                                      key === 'subscriptions' ? 'Assinaturas' :
                                      key === 'events' ? 'Eventos' : 'Outros'}
                                  </TableCell>
                                  <TableCell className="text-right">{formatCurrency(value)}</TableCell>
                                  <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Aba de Faturas */}
          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Faturas</CardTitle>
                    <CardDescription>
                      Histórico de faturas geradas
                    </CardDescription>
                  </div>
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="Buscar faturas..."
                      className="w-[250px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : filteredInvoices.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Nº Fatura</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.number}</TableCell>
                            <TableCell>{invoice.customerName}</TableCell>
                            <TableCell>{translateInvoiceType(invoice.type)}</TableCell>
                            <TableCell>{formatDate(invoice.date)}</TableCell>
                            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                            <TableCell>{formatCurrency(invoice.total)}</TableCell>
                            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    {searchQuery ? 
                      "Nenhuma fatura encontrada para esta busca." : 
                      "Nenhuma fatura encontrada."}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Aba de Parceiros */}
          <TabsContent value="partners" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Faturamento por Parceiro</CardTitle>
                <CardDescription>
                  Distribuição de receita por parceiro de certificação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Parceiro</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Percentual</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {financialReport?.revenueByPartner.map((partner, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{partner.partnerName}</TableCell>
                              <TableCell>{formatCurrency(partner.amount)}</TableCell>
                              <TableCell>{formatPercentage(partner.percentage)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Distribuição Visual</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={financialReport?.revenueByPartner}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="partnerName" />
                          <YAxis 
                            tickFormatter={(value) => 
                              new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                notation: 'compact',
                                maximumFractionDigits: 1
                              }).format(value)
                            } 
                          />
                          <Tooltip 
                            formatter={(value) => [formatCurrency(value as number), "Valor"]}
                          />
                          <Bar dataKey="amount" name="Valor" fill="#60a5fa" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}