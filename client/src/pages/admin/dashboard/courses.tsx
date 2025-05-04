import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, exportToCSV } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, Search, Filter, Download, FilePlus, Star, Clock, Book, BookOpen, SlidersHorizontal } from "lucide-react";

// Interface para tipagem dos dados de cursos
interface Course {
  id: number;
  title: string;
  category: string;
  enrolledStudents: number;
  completionRate: number;
  status: "active" | "draft" | "archived" | "scheduled";
  price: number;
  rating: number;
  createdAt: string;
  lastUpdated: string;
  instructor: string;
}

// Cores para gráficos
const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#0d9488', '#0369a1'];

export default function DashboardCoursesPage() {
  const [tab, setTab] = useState<string>("ativos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isMounted, setIsMounted] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minRating, setMinRating] = useState<string>("");
  const [instructorFilter, setInstructorFilter] = useState<string>("");
  const [, navigate] = useLocation();

  // Consulta para obter dados de cursos
  const { data: coursesData, isLoading } = useQuery<{
    courses: Course[];
    stats: {
      activeCount: number;
      draftCount: number;
      archivedCount: number;
      scheduledCount: number;
      totalCount: number;
      activePercentage: number;
      averageCompletionRate: number;
      newCoursesThisMonth: number;
      totalRevenue: number;
      averageRating: number;
    };
    chartData: {
      monthly: { month: string; count: number }[];
      byCategory: { category: string; count: number }[];
      byRating: { rating: string; count: number }[];
      byEnrollment: { course: string; students: number }[];
    };
    categories: string[];
  }>({
    queryKey: ["/api/dashboard/courses"],
    // Fallback para dados simulados apenas durante o desenvolvimento
    placeholderData: {
      courses: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        title: `Curso ${i + 1}`,
        category: ["Desenvolvimento", "Design", "Marketing", "Negócios", "TI e Software", "Saúde", "Educação"][Math.floor(Math.random() * 7)],
        enrolledStudents: Math.floor(Math.random() * 150) + 10,
        completionRate: Math.floor(Math.random() * 100),
        status: ["active", "draft", "archived", "scheduled"][Math.floor(Math.random() * 4)] as any,
        price: (Math.floor(Math.random() * 200) + 50) * 100, // em centavos
        rating: Math.floor(Math.random() * 50) / 10 + 3, // entre 3.0 e 8.0
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
        lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString().split('T')[0],
        instructor: ["Ana Silva", "Carlos Oliveira", "Patricia Santos", "Roberto Lima", "Julia Costa"][Math.floor(Math.random() * 5)],
      })),
      stats: {
        activeCount: 145,
        draftCount: 27,
        archivedCount: 18,
        scheduledCount: 5,
        totalCount: 195,
        activePercentage: 74.4,
        averageCompletionRate: 65.8,
        newCoursesThisMonth: 12,
        totalRevenue: 25786500, // em centavos (R$ 257.865,00)
        averageRating: 4.7
      },
      chartData: {
        monthly: [
          { month: "Jan", count: 120 },
          { month: "Fev", count: 126 },
          { month: "Mar", count: 134 },
          { month: "Abr", count: 140 },
          { month: "Mai", count: 145 },
        ],
        byCategory: [
          { category: "Desenvolvimento", count: 52 },
          { category: "Design", count: 38 },
          { category: "Marketing", count: 25 },
          { category: "Negócios", count: 32 },
          { category: "TI e Software", count: 28 },
          { category: "Saúde", count: 10 },
          { category: "Educação", count: 10 },
        ],
        byRating: [
          { rating: "5.0", count: 42 },
          { rating: "4.5-4.9", count: 78 },
          { rating: "4.0-4.4", count: 48 },
          { rating: "3.0-3.9", count: 22 },
          { rating: "< 3.0", count: 5 },
        ],
        byEnrollment: [
          { course: "Desenvolvimento Web", students: 145 },
          { course: "Design UI/UX", students: 132 },
          { course: "Marketing Digital", students: 120 },
          { course: "Análise de Dados", students: 112 },
          { course: "Python para Iniciantes", students: 105 },
        ]
      },
      categories: ["Desenvolvimento", "Design", "Marketing", "Negócios", "TI e Software", "Saúde", "Educação"]
    }
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Filtrar cursos com base no termo de busca e filtros selecionados
  const filteredCourses = coursesData?.courses.filter(course => {
    // Filtro de pesquisa
    const matchesSearch = !searchTerm || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de categoria
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
    
    // Filtro de tab (Ativos, Rascunhos, etc.)
    const matchesTab = tab === "todos" || 
      (tab === "ativos" && course.status === "active") ||
      (tab === "rascunhos" && course.status === "draft") ||
      (tab === "arquivados" && course.status === "archived") ||
      (tab === "agendados" && course.status === "scheduled");
    
    // Filtros avançados
    const matchesInstructor = !instructorFilter || 
      course.instructor.toLowerCase().includes(instructorFilter.toLowerCase());
    
    const matchesMinPrice = !minPrice || course.price >= parseFloat(minPrice) * 100;
    const matchesMaxPrice = !maxPrice || course.price <= parseFloat(maxPrice) * 100;
    const matchesMinRating = !minRating || course.rating >= parseFloat(minRating);
    
    return matchesSearch && matchesCategory && matchesTab && 
           matchesInstructor && matchesMinPrice && matchesMaxPrice && matchesMinRating;
  }) || [];



  // Renderizar esqueletos de carregamento
  if (isLoading) {
    return (
      <AppShell>
        <Helmet>
          <title>Cursos Ativos | Dashboard | Edunéxia</title>
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

  // Função auxiliar para formatar o status do curso com uma badge
  const renderStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      active: "default",
      draft: "secondary",
      archived: "destructive",
      scheduled: "outline"
    };
    
    const labels: Record<string, string> = {
      active: "Ativo",
      draft: "Rascunho",
      archived: "Arquivado",
      scheduled: "Agendado"
    };
    
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <AppShell>
      <Helmet>
        <title>Cursos Ativos | Dashboard | Edunéxia</title>
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
              <h1 className="text-2xl font-semibold">Cursos Ativos</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Análise detalhada dos cursos disponíveis na plataforma
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (!filteredCourses.length) return;
                  
                  // Traduzir campos para português e formatar dados
                  const exportData = filteredCourses.map(course => ({
                    ID: course.id,
                    Título: course.title,
                    Categoria: course.category,
                    Alunos: course.enrolledStudents,
                    'Taxa de Conclusão': `${course.completionRate}%`,
                    Status: course.status === 'active' ? 'Ativo' : 
                            course.status === 'draft' ? 'Rascunho' : 
                            course.status === 'archived' ? 'Arquivado' : 'Agendado',
                    Preço: formatCurrency(course.price),
                    Avaliação: course.rating.toFixed(1),
                    'Data de Criação': course.createdAt,
                    'Última Atualização': course.lastUpdated,
                    Instrutor: course.instructor
                  }));
                  
                  // Nome do arquivo baseado na data atual
                  const today = new Date().toISOString().split('T')[0];
                  exportToCSV(exportData, `cursos-${today}`);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate("/admin/courses/create")}
              >
                <FilePlus className="h-4 w-4 mr-2" />
                Novo Curso
              </Button>
            </div>
          </div>
        </div>
        
        {/* Cards com métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Cursos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coursesData?.stats.totalCount}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span className="text-green-600">+{coursesData?.stats.newCoursesThisMonth}</span>
                <span className="ml-1">no último mês</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cursos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coursesData?.stats.activeCount}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({coursesData?.stats.activePercentage}%)
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600">{coursesData?.stats.averageRating}</span> avaliação média
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(coursesData?.stats.totalRevenue || 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Receita gerada por todos os cursos
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa Média de Conclusão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coursesData?.stats.averageCompletionRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                Média geral de conclusão dos cursos
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Gráficos de visão geral */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
          {/* Gráfico de tendência mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Cursos Ativos</CardTitle>
              <CardDescription>Evolução mensal do número de cursos ativos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={coursesData?.chartData.monthly}
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
          
          {/* Gráfico de distribuição por categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Categoria</CardTitle>
              <CardDescription>Distribuição dos cursos por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={coursesData?.chartData.byCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="category"
                    >
                      {coursesData?.chartData.byCategory.map((entry, index) => (
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
        
        {/* Lista de Cursos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Lista de Cursos</CardTitle>
            <CardDescription>
              Gerenciar e visualizar todos os cursos da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros e pesquisa */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou instrutor"
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="flex items-center gap-2">
                  <Label htmlFor="category-filter" className="whitespace-nowrap">Categoria:</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger id="category-filter" className="w-[160px]">
                      <SelectValue placeholder="Todas categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas categorias</SelectItem>
                      {coursesData?.categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <SlidersHorizontal className="h-4 w-4" />
                      Mais filtros
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Filtros Avançados</DialogTitle>
                      <DialogDescription>
                        Refine sua busca com filtros adicionais
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min-price">Preço Mínimo (R$)</Label>
                          <Input
                            id="min-price"
                            placeholder="0,00"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-price">Preço Máximo (R$)</Label>
                          <Input
                            id="max-price"
                            placeholder="1.000,00"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="instructor-filter">Instrutor</Label>
                        <Input
                          id="instructor-filter"
                          placeholder="Nome do instrutor"
                          value={instructorFilter}
                          onChange={(e) => setInstructorFilter(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="min-rating">Avaliação Mínima</Label>
                        <Select 
                          value={minRating} 
                          onValueChange={setMinRating}
                        >
                          <SelectTrigger id="min-rating">
                            <SelectValue placeholder="Qualquer avaliação" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Qualquer avaliação</SelectItem>
                            <SelectItem value="5">5 estrelas</SelectItem>
                            <SelectItem value="4">4+ estrelas</SelectItem>
                            <SelectItem value="3">3+ estrelas</SelectItem>
                            <SelectItem value="2">2+ estrelas</SelectItem>
                            <SelectItem value="1">1+ estrela</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setMinPrice("");
                          setMaxPrice("");
                          setMinRating("");
                          setInstructorFilter("");
                          setShowAdvancedFilters(false);
                        }}
                      >
                        Limpar Filtros
                      </Button>
                      <Button onClick={() => setShowAdvancedFilters(false)}>
                        Aplicar Filtros
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Tabs para diferentes visualizações de cursos */}
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="ativos" className="relative">
                  Ativos
                  <Badge className="ml-2 bg-primary/20 text-primary hover:bg-primary/20 absolute -right-3 -top-2">
                    {coursesData?.stats.activeCount || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="rascunhos" className="relative">
                  Rascunhos
                  <Badge className="ml-2 bg-muted text-muted-foreground hover:bg-muted absolute -right-3 -top-2">
                    {coursesData?.stats.draftCount || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="arquivados" className="relative">
                  Arquivados
                  <Badge className="ml-2 bg-destructive/20 text-destructive hover:bg-destructive/20 absolute -right-3 -top-2">
                    {coursesData?.stats.archivedCount || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="agendados">Agendados</TabsTrigger>
                <TabsTrigger value="todos">Todos</TabsTrigger>
              </TabsList>

              {/* Conteúdo da tab - sempre o mesmo, filtrado pelo estado */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título do Curso</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Alunos</TableHead>
                      <TableHead>Avaliação</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Última Atualização</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-32">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <BookOpen className="h-8 w-8 mb-2" />
                            <p className="text-sm">Nenhum curso encontrado</p>
                            <p className="text-xs mt-1">Tente ajustar os filtros de busca</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCourses.map(course => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{course.title}</div>
                              <div className="text-sm text-muted-foreground">Por: {course.instructor}</div>
                            </div>
                          </TableCell>
                          <TableCell>{course.category}</TableCell>
                          <TableCell>{renderStatusBadge(course.status)}</TableCell>
                          <TableCell>{course.enrolledStudents}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 mr-1" />
                              <span>{course.rating.toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(course.price)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                              <span>{course.lastUpdated}</span>
                            </div>
                          </TableCell>
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
              Mostrando <span className="font-medium">{filteredCourses.length}</span> de{" "}
              <span className="font-medium">{coursesData?.stats.totalCount}</span> cursos
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