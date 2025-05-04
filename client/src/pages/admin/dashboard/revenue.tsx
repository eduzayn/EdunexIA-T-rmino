import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  ArrowLeft, Download, Printer, ArrowUpRight, ArrowDownRight, 
  DollarSign, CreditCard, Receipt, BarChart4, Calendar, FileText
} from "lucide-react";

// Interface para tipagem dos dados de receita
interface Revenue {
  id: number;
  description: string;
  category: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "refunded";
  paymentMethod: string;
  student?: {
    id: number;
    name: string;
  };
  course?: {
    id: number;
    title: string;
  };
}

// Cores para gráficos
const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#0d9488', '#0369a1'];

export default function DashboardRevenuePage() {
  const [period, setPeriod] = useState<string>("month");
  const [tab, setTab] = useState<string>("todos");
  const [isMounted, setIsMounted] = useState(false);

  // Consulta para obter dados financeiros
  const { data: revenueData, isLoading } = useQuery<{
    transactions: Revenue[];
    stats: {
      currentPeriodRevenue: number;
      previousPeriodRevenue: number;
      growthPercentage: number;
      pendingRevenue: number;
      overdueRevenue: number;
      refundedAmount: number;
      totalTransactions: number;
      paidTransactions: number;
      averageTicket: number;
    };
    chartData: {
      monthly: { month: string; revenue: number; transactions: number }[];
      byCategory: { category: string; amount: number }[];
      byPaymentMethod: { method: string; amount: number }[];
      byDay: { day: string; amount: number }[];
    };
  }>({
    queryKey: ["/api/dashboard/revenue", period],
    // Dados simulados apenas durante o desenvolvimento
    placeholderData: {
      transactions: Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        description: `Pagamento de Curso ${i + 1}`,
        category: ["Matrícula", "Mensalidade", "Material", "Certificado", "Taxa"][Math.floor(Math.random() * 5)],
        date: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        amount: (Math.floor(Math.random() * 100) + 1) * 10000, // em centavos
        status: ["paid", "pending", "overdue", "refunded"][Math.floor(Math.random() * 4)] as any,
        paymentMethod: ["Cartão de Crédito", "Boleto", "PIX", "Transferência"][Math.floor(Math.random() * 4)],
        student: {
          id: Math.floor(Math.random() * 100) + 1,
          name: `Aluno ${Math.floor(Math.random() * 100) + 1}`
        },
        course: {
          id: Math.floor(Math.random() * 20) + 1,
          title: `Curso de ${["Programação", "Design", "Marketing", "Negócios", "Saúde"][Math.floor(Math.random() * 5)]}`
        }
      })),
      stats: {
        currentPeriodRevenue: 28750000, // em centavos (R$ 287.500,00)
        previousPeriodRevenue: 25500000, // em centavos (R$ 255.000,00)
        growthPercentage: 12.5,
        pendingRevenue: 4200000, // em centavos (R$ 42.000,00)
        overdueRevenue: 1850000, // em centavos (R$ 18.500,00)
        refundedAmount: 850000, // em centavos (R$ 8.500,00)
        totalTransactions: 325,
        paidTransactions: 287,
        averageTicket: 880000 // em centavos (R$ 8.800,00)
      },
      chartData: {
        monthly: [
          { month: "Jan", revenue: 18500000, transactions: 210 },
          { month: "Fev", revenue: 20750000, transactions: 235 },
          { month: "Mar", revenue: 22800000, transactions: 258 },
          { month: "Abr", revenue: 25500000, transactions: 290 },
          { month: "Mai", revenue: 28750000, transactions: 325 },
        ],
        byCategory: [
          { category: "Matrícula", amount: 12500000 },
          { category: "Mensalidade", amount: 10250000 },
          { category: "Material", amount: 3500000 },
          { category: "Certificado", amount: 1750000 },
          { category: "Taxa", amount: 750000 },
        ],
        byPaymentMethod: [
          { method: "Cartão de Crédito", amount: 18500000 },
          { method: "Boleto", amount: 4250000 },
          { method: "PIX", amount: 5000000 },
          { method: "Transferência", amount: 1000000 },
        ],
        byDay: Array.from({ length: 30 }, (_, i) => ({
          day: `${i + 1}`,
          amount: Math.floor(Math.random() * 1000000) + 500000,
        })),
      }
    }
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Filtrar transações com base na tab selecionada
  const filteredTransactions = revenueData?.transactions.filter(transaction => {
    if (tab === "todos") return true;
    return transaction.status === tab;
  }) || [];

  // Renderizar esqueletos de carregamento
  if (isLoading) {
    return (
      <AppShell>
        <Helmet>
          <title>Receita Mensal | Dashboard | Edunéxia</title>
        </Helmet>
        <div className="w-full px-2 sm:px-4 lg:px-6 max-w-[100rem] mx-auto">
          <div className="py-4">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
          
          <Skeleton className="h-96 w-full mb-6" />
        </div>
      </AppShell>
    );
  }

  // Função auxiliar para formatar o status de pagamento com badge
  const renderStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
      refunded: "outline"
    };
    
    const labels: Record<string, string> = {
      paid: "Pago",
      pending: "Pendente",
      overdue: "Atrasado",
      refunded: "Reembolsado"
    };
    
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <AppShell>
      <Helmet>
        <title>Receita Mensal | Dashboard | Edunéxia</title>
      </Helmet>
      <div className="w-full px-2 sm:px-4 lg:px-6 max-w-[100rem] mx-auto">
        {/* Cabeçalho da página */}
        <div className="pt-2 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Button variant="ghost" className="mb-2 pl-0" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o Dashboard
              </Button>
              <h1 className="text-2xl font-semibold">Receita Mensal</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Análise detalhada da receita da plataforma
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Hoje</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="quarter">Este trimestre</SelectItem>
                  <SelectItem value="year">Este ano</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
        
        {/* Cards com métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Card de Receita Total */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Receita Total no Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="bg-primary/10 rounded-full p-3 mr-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{formatCurrency(revenueData?.stats.currentPeriodRevenue || 0)}</div>
                  <div className="flex items-center text-sm mt-1">
                    <div className={revenueData?.stats.growthPercentage && revenueData.stats.growthPercentage > 0 
                      ? "text-green-600 flex items-center" 
                      : "text-red-600 flex items-center"
                    }>
                      {revenueData?.stats.growthPercentage && revenueData.stats.growthPercentage > 0 
                        ? <ArrowUpRight className="h-4 w-4 mr-1" /> 
                        : <ArrowDownRight className="h-4 w-4 mr-1" />
                      }
                      {Math.abs(revenueData?.stats.growthPercentage || 0)}%
                    </div>
                    <span className="text-muted-foreground ml-1">vs. período anterior</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Período anterior</span>
                  <span className="font-medium">{formatCurrency(revenueData?.stats.previousPeriodRevenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ticket médio</span>
                  <span className="font-medium">{formatCurrency(revenueData?.stats.averageTicket || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Transações concluídas</span>
                  <span className="font-medium">{revenueData?.stats.paidTransactions}/{revenueData?.stats.totalTransactions}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Gráfico de Evolução Mensal de Receita */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Evolução da Receita</CardTitle>
              <CardDescription>Receita mensal ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueData?.chartData.monthly}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$${value / 1000000}k`} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#4f46e5" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Gráficos de análise */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de distribuição por categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Receita por Categoria</CardTitle>
              <CardDescription>Distribuição da receita por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueData?.chartData.byCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      nameKey="category"
                    >
                      {revenueData?.chartData.byCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Gráfico de distribuição por método de pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Receita por Método de Pagamento</CardTitle>
              <CardDescription>Distribuição da receita por método de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData?.chartData.byPaymentMethod}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tickFormatter={(value) => `R$${value / 1000000}k`} />
                    <YAxis type="category" dataKey="method" width={70} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="amount" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Lista de Transações */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transações</CardTitle>
            <CardDescription>
              Histórico de transações financeiras
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Tabs para filtragem por status */}
            <Tabs value={tab} onValueChange={setTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="todos">
                  Todas
                  <Badge className="ml-2" variant="outline">{revenueData?.transactions.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="paid">
                  Pagas
                  <Badge className="ml-2" variant="default">
                    {revenueData?.transactions.filter(t => t.status === 'paid').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pendentes
                  <Badge className="ml-2" variant="secondary">
                    {revenueData?.transactions.filter(t => t.status === 'pending').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="overdue">
                  Atrasadas
                  <Badge className="ml-2" variant="destructive">
                    {revenueData?.transactions.filter(t => t.status === 'overdue').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="refunded">
                  Reembolsadas
                  <Badge className="ml-2" variant="outline">
                    {revenueData?.transactions.filter(t => t.status === 'refunded').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Tabela de transações */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Aluno/Curso</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-32">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Receipt className="h-8 w-8 mb-2" />
                          <p className="text-sm">Nenhuma transação encontrada</p>
                          <p className="text-xs mt-1">Tente ajustar os filtros de busca</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="font-medium">{transaction.description}</div>
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{transaction.student?.name}</div>
                            <div className="text-xs text-muted-foreground">{transaction.course?.title}</div>
                          </div>
                        </TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{renderStatusBadge(transaction.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{transaction.paymentMethod}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium">{filteredTransactions.length}</span> de{" "}
              <span className="font-medium">{revenueData?.transactions.length}</span> transações
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Anterior</Button>
              <Button variant="outline" size="sm" disabled>Próximo</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}