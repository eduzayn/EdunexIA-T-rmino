import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, Search, Filter, Download, UserPlus, UserCheck, UserX, Users, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";

// Interface para tipagem dos dados de alunos
interface Student {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive" | "suspended" | "pending";
  enrollmentDate: string;
  coursesCount: number;
  completionRate: number;
  lastAccess: string;
}

// Cores para gráficos
const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669'];

export default function DashboardStudentsPage() {
  const [tab, setTab] = useState<string>("ativos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isMounted, setIsMounted] = useState(false);
  
  // Estados para o diálogo de filtros avançados
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [courseCountMin, setCourseCountMin] = useState<number>(0);
  const [courseCountMax, setCourseCountMax] = useState<number>(10);
  const [completionRateMin, setCompletionRateMin] = useState<number>(0);
  const [completionRateMax, setCompletionRateMax] = useState<number>(100);
  const [activityPeriod, setActivityPeriod] = useState<string>("all");
  
  // Função para aplicar filtros avançados
  const applyAdvancedFilters = () => {
    setShowFiltersDialog(false);
    // Os filtros são aplicados automaticamente através do estado
  };
  
  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("name");
    setSortOrder("asc");
    setCourseCountMin(0);
    setCourseCountMax(10);
    setCompletionRateMin(0);
    setCompletionRateMax(100);
    setActivityPeriod("all");
  };

  // Consulta para obter dados de alunos
  const { data: studentsData, isLoading } = useQuery<{
    students: Student[];
    stats: {
      activeCount: number;
      inactiveCount: number;
      suspendedCount: number;
      pendingCount: number;
      totalCount: number;
      activePercentage: number;
      averageCompletionRate: number;
      newStudentsThisMonth: number;
      monthlyGrowthRate: number;
    };
    chartData: {
      monthly: { month: string; count: number }[];
      byStatus: { status: string; count: number }[];
      byCompletion: { range: string; count: number }[];
    };
  }>({
    queryKey: ["/api/dashboard/students"],
    // Fallback para dados simulados apenas durante o desenvolvimento
    placeholderData: {
      students: Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        name: `Aluno ${i + 1}`,
        email: `aluno${i + 1}@example.com`,
        status: ["active", "inactive", "suspended", "pending"][Math.floor(Math.random() * 4)] as any,
        enrollmentDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
        coursesCount: Math.floor(Math.random() * 5) + 1,
        completionRate: Math.floor(Math.random() * 100),
        lastAccess: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().split('T')[0],
      })),
      stats: {
        activeCount: 280,
        inactiveCount: 48,
        suspendedCount: 12,
        pendingCount: 36,
        totalCount: 376,
        activePercentage: 74.5,
        averageCompletionRate: 68.2,
        newStudentsThisMonth: 32,
        monthlyGrowthRate: 8.2,
      },
      chartData: {
        monthly: [
          { month: "Jan", count: 245 },
          { month: "Fev", count: 252 },
          { month: "Mar", count: 260 },
          { month: "Abr", count: 268 },
          { month: "Mai", count: 280 },
        ],
        byStatus: [
          { status: "Ativos", count: 280 },
          { status: "Inativos", count: 48 },
          { status: "Suspensos", count: 12 },
          { status: "Pendentes", count: 36 },
        ],
        byCompletion: [
          { range: "0-25%", count: 42 },
          { range: "26-50%", count: 68 },
          { range: "51-75%", count: 124 },
          { range: "76-100%", count: 142 },
        ]
      }
    }
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Filtrar alunos com base no termo de busca e filtros selecionados
  const filteredStudents = studentsData?.students.filter(student => {
    // Filtro de pesquisa
    const matchesSearch = !searchTerm || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de status
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    
    // Filtro de tab (Ativos, Inativos, etc.)
    const matchesTab = tab === "todos" || 
      (tab === "ativos" && student.status === "active") ||
      (tab === "inativos" && student.status === "inactive") ||
      (tab === "suspensos" && student.status === "suspended") ||
      (tab === "pendentes" && student.status === "pending");
    
    return matchesSearch && matchesStatus && matchesTab;
  }) || [];

  // Renderizar esqueletos de carregamento
  if (isLoading) {
    return (
      <AppShell>
        <Helmet>
          <title>Alunos Ativos | Dashboard | Edunéxia</title>
        </Helmet>
        <div className="w-full px-2 sm:px-4 lg:px-6 max-w-[100rem] mx-auto">
          <div className="py-4">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          
          <div className="grid grid-cols-1 gap-5 md:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
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

  // Função auxiliar para formatar o status do aluno com uma badge
  const renderStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive",
      pending: "outline"
    };
    
    const labels: Record<string, string> = {
      active: "Ativo",
      inactive: "Inativo",
      suspended: "Suspenso",
      pending: "Pendente"
    };
    
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <AppShell>
      <Helmet>
        <title>Alunos Ativos | Dashboard | Edunéxia</title>
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
              <h1 className="text-2xl font-semibold">Alunos Ativos</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Análise detalhada dos alunos ativos na plataforma
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Aluno
              </Button>
            </div>
          </div>
        </div>
        
        {/* Cards com métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alunos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentsData?.stats.totalCount}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span className={studentsData?.stats.monthlyGrowthRate && studentsData.stats.monthlyGrowthRate > 0 ? "text-green-600" : "text-red-600"}>
                  {studentsData?.stats.monthlyGrowthRate && studentsData.stats.monthlyGrowthRate > 0 ? '+' : ''}
                  {studentsData?.stats.monthlyGrowthRate}%
                </span>
                <span className="ml-1">no último mês</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Alunos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentsData?.stats.activeCount}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({studentsData?.stats.activePercentage}%)
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600">
                  +{studentsData?.stats.newStudentsThisMonth}
                </span> novos este mês
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inativos/Suspensos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(studentsData?.stats.inactiveCount || 0) + (studentsData?.stats.suspendedCount || 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{studentsData?.stats.inactiveCount} inativos</Badge>
                <Badge variant="destructive" className="text-xs">{studentsData?.stats.suspendedCount} suspensos</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa Média de Conclusão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentsData?.stats.averageCompletionRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                Média de conclusão dos cursos
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Gráficos de visão geral */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
          {/* Gráfico de tendência mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Alunos Ativos</CardTitle>
              <CardDescription>Evolução mensal do número de alunos ativos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={studentsData?.chartData.monthly}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Gráfico de distribuição por status */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Proporção de alunos por status de conta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={studentsData?.chartData.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                    >
                      {studentsData?.chartData.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Lista de Alunos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Lista de Alunos</CardTitle>
            <CardDescription>
              Gerenciar e visualizar todos os alunos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros e pesquisa */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email"
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="flex items-center gap-2">
                  <Label htmlFor="status-filter" className="whitespace-nowrap">Status:</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger id="status-filter" className="w-[140px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                      <SelectItem value="suspended">Suspensos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={showFiltersDialog} onOpenChange={setShowFiltersDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Filter className="h-4 w-4" />
                      Mais filtros
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Filtros Avançados</DialogTitle>
                      <DialogDescription>
                        Configure filtros adicionais para refinar sua busca de alunos.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {/* Ordenação */}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sortBy" className="text-right">
                          Ordenar por
                        </Label>
                        <Select
                          value={sortBy}
                          onValueChange={setSortBy}
                        >
                          <SelectTrigger id="sortBy" className="col-span-3">
                            <SelectValue placeholder="Selecione o campo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Nome</SelectItem>
                            <SelectItem value="date">Data de matrícula</SelectItem>
                            <SelectItem value="progress">Progresso</SelectItem>
                            <SelectItem value="activity">Último acesso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Direção da ordenação */}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sortDir" className="text-right">
                          Direção
                        </Label>
                        <Select
                          value={sortOrder}
                          onValueChange={setSortOrder}
                        >
                          <SelectTrigger id="sortDir" className="col-span-3">
                            <SelectValue placeholder="Selecione a direção" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">Crescente (A-Z)</SelectItem>
                            <SelectItem value="desc">Decrescente (Z-A)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Período de atividade */}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="activity" className="text-right">
                          Atividade
                        </Label>
                        <Select
                          value={activityPeriod}
                          onValueChange={setActivityPeriod}
                        >
                          <SelectTrigger id="activity" className="col-span-3">
                            <SelectValue placeholder="Selecione o período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os períodos</SelectItem>
                            <SelectItem value="today">Hoje</SelectItem>
                            <SelectItem value="week">Esta semana</SelectItem>
                            <SelectItem value="month">Este mês</SelectItem>
                            <SelectItem value="inactive">Inativos (30+ dias)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Outros filtros */}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Cursos</Label>
                        <div className="col-span-3 flex items-center justify-between">
                          <span className="text-sm">Mínimo: {courseCountMin}</span>
                          <span className="text-sm">Máximo: {courseCountMax}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Conclusão</Label>
                        <div className="col-span-3 flex items-center justify-between">
                          <span className="text-sm">Mínimo: {completionRateMin}%</span>
                          <span className="text-sm">Máximo: {completionRateMax}%</span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={clearAllFilters}>
                        Limpar filtros
                      </Button>
                      <Button type="button" onClick={applyAdvancedFilters}>
                        Aplicar filtros
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Tabs para diferentes visualizações de alunos */}
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="ativos" className="relative">
                  Ativos
                  <Badge className="ml-2 bg-primary/20 text-primary hover:bg-primary/20 absolute -right-3 -top-2">
                    {studentsData?.stats.activeCount || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="inativos" className="relative">
                  Inativos
                  <Badge className="ml-2 bg-muted text-muted-foreground hover:bg-muted absolute -right-3 -top-2">
                    {studentsData?.stats.inactiveCount || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="suspensos" className="relative">
                  Suspensos
                  <Badge className="ml-2 bg-destructive/20 text-destructive hover:bg-destructive/20 absolute -right-3 -top-2">
                    {studentsData?.stats.suspendedCount || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                <TabsTrigger value="todos">Todos</TabsTrigger>
              </TabsList>

              {/* Conteúdo da tab - sempre o mesmo, filtrado pelo estado */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Aluno</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Matrícula</TableHead>
                      <TableHead>Cursos</TableHead>
                      <TableHead>Conclusão</TableHead>
                      <TableHead>Último Acesso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-32">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Users className="h-8 w-8 mb-2" />
                            <p className="text-sm">Nenhum aluno encontrado</p>
                            <p className="text-xs mt-1">Tente ajustar os filtros de busca</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map(student => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{renderStatusBadge(student.status)}</TableCell>
                          <TableCell>{student.enrollmentDate}</TableCell>
                          <TableCell>{student.coursesCount}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden mr-2">
                                <div 
                                  className="h-full bg-primary" 
                                  style={{ width: `${student.completionRate}%` }} 
                                />
                              </div>
                              <span>{student.completionRate}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{student.lastAccess}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium">{filteredStudents.length}</span> de{" "}
              <span className="font-medium">{studentsData?.stats.totalCount}</span> alunos
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