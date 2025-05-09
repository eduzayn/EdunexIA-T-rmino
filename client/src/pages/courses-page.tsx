import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Course } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { formatCurrency, truncateText } from "@/lib/utils";
import { BookOpen, Calendar, Clock, Filter, GraduationCap, Grid3X3, List, PlusCircle, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { usePortal } from "@/hooks/use-portal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CoursesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [openFilters, setOpenFilters] = useState(false);
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const { currentPortal } = usePortal();

  const {
    data: courses,
    isLoading,
    error
  } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    queryFn: getQueryFn({ on401: "throw" })
  });

  const filteredCourses = courses?.filter(course => {
    // Filtro de busca textual
    const matchesSearch = !searchTerm || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtro de área
    const matchesArea = areaFilter === "all" || course.area === areaFilter;
    
    // Filtro de categoria
    const matchesCategory = categoryFilter === "all" || course.courseCategory === categoryFilter;
    
    // Filtro de status
    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    
    // Filtro de preço mínimo
    const matchesPriceMin = !priceMin || (course.price || 0) >= parseFloat(priceMin) * 100;
    
    // Filtro de preço máximo
    const matchesPriceMax = !priceMax || (course.price || 0) <= parseFloat(priceMax) * 100;
    
    return matchesSearch && matchesArea && matchesCategory && matchesStatus && matchesPriceMin && matchesPriceMax;
  });

  // Função para renderizar o status do curso
  const renderStatus = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-yellow-100 text-yellow-800", label: "Rascunho" },
      published: { color: "bg-green-100 text-green-800", label: "Publicado" },
      archived: { color: "bg-gray-100 text-gray-800", label: "Arquivado" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant="outline" className={`${config.color} border-none`}>
        {config.label}
      </Badge>
    );
  };

  // Função para renderizar placeholder de imagem quando não há imagem do curso
  const renderPlaceholderImage = (courseTitle: string) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-purple-100 text-purple-800",
      "bg-pink-100 text-pink-800",
      "bg-green-100 text-green-800",
      "bg-yellow-100 text-yellow-800"
    ];
    const color = colors[courseTitle.length % colors.length];
    const initials = courseTitle
      .split(" ")
      .slice(0, 2)
      .map(word => word[0])
      .join("")
      .toUpperCase();

    return (
      <div className={`flex items-center justify-center w-full h-40 ${color} rounded-t-lg`}>
        <span className="text-3xl font-bold">{initials}</span>
      </div>
    );
  };
  
  // Função para obter o nome amigável da área do curso
  const getAreaName = (area?: string | null) => {
    const areaNames: Record<string, string> = {
      development: "Desenvolvimento",
      business: "Negócios",
      marketing: "Marketing",
      design: "Design",
      technology: "Tecnologia",
      education: "Educação",
      health: "Saúde",
      language: "Idiomas",
      other: "Outros"
    };
    
    return area ? areaNames[area] || "Não definida" : "Não definida";
  };
  
  // Função para obter o nome amigável da categoria educacional
  const getCourseCategoryName = (category?: string | null) => {
    const categoryNames: Record<string, string> = {
      segunda_graduacao: "Segunda Graduação",
      segunda_licenciatura: "Segunda Licenciatura",
      formacao_pedagogica: "Formação Pedagógica",
      formacao_livre: "Formação Livre",
      profissionalizante: "Profissionalizante",
      sequencial: "Sequencial",
      graduacao: "Graduação",
      pos_graduacao: "Pós-Graduação"
    };
    
    return category ? categoryNames[category] || "Não definida" : "Não definida";
  };

  return (
    <AppShell>
      <Helmet>
        <title>Cursos | Edunéxia</title>
      </Helmet>

      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cursos</h1>
            <p className="text-muted-foreground">
              Gerencie todos os cursos disponíveis na sua plataforma
            </p>
          </div>
          
          <Button className="w-full md:w-auto" asChild>
            <Link href={`${currentPortal.baseRoute}/courses/new`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Curso
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar cursos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={openFilters} onOpenChange={setOpenFilters}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Filtros</DialogTitle>
                <DialogDescription>
                  Refine os resultados utilizando os filtros abaixo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-3">
                  <Label htmlFor="area">Área</Label>
                  <Select value={areaFilter} onValueChange={setAreaFilter}>
                    <SelectTrigger id="area">
                      <SelectValue placeholder="Todas as áreas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as áreas</SelectItem>
                      <SelectItem value="development">Desenvolvimento</SelectItem>
                      <SelectItem value="business">Negócios</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="technology">Tecnologia</SelectItem>
                      <SelectItem value="education">Educação</SelectItem>
                      <SelectItem value="health">Saúde</SelectItem>
                      <SelectItem value="language">Idiomas</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      <SelectItem value="segunda_graduacao">Segunda Graduação</SelectItem>
                      <SelectItem value="segunda_licenciatura">Segunda Licenciatura</SelectItem>
                      <SelectItem value="formacao_pedagogica">Formação Pedagógica</SelectItem>
                      <SelectItem value="formacao_livre">Formação Livre</SelectItem>
                      <SelectItem value="profissionalizante">Profissionalizante</SelectItem>
                      <SelectItem value="sequencial">Sequencial</SelectItem>
                      <SelectItem value="graduacao">Graduação</SelectItem>
                      <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priceMin">Preço Mínimo (R$)</Label>
                    <Input
                      id="priceMin"
                      placeholder="0,00"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceMax">Preço Máximo (R$)</Label>
                    <Input
                      id="priceMax"
                      placeholder="1.000,00"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAreaFilter("all");
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setPriceMin("");
                    setPriceMax("");
                  }}
                >
                  Limpar
                </Button>
                <Button onClick={() => setOpenFilters(false)}>Aplicar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <div className="flex items-center space-x-1 rounded-md border p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
              aria-label="Visualização em grade"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('list')}
              aria-label="Visualização em lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="published">Publicados</TabsTrigger>
            <TabsTrigger value="draft">Rascunhos</TabsTrigger>
            <TabsTrigger value="archived">Arquivados</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              // Skeletons para carregamento
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-40 w-full rounded-t-lg rounded-b-none" />
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="pb-2">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-9 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/50 p-6 text-center">
                <p className="text-destructive">Erro ao carregar cursos. Por favor, tente novamente mais tarde.</p>
              </div>
            ) : filteredCourses?.length === 0 ? (
              <div className="rounded-lg border p-6 text-center">
                <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">Nenhum curso encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {searchTerm ? 'Nenhum curso corresponde à sua busca.' : 'Você ainda não possui nenhum curso. Crie seu primeiro curso agora!'}
                </p>
                <Button asChild>
                  <Link href={`${currentPortal.baseRoute}/courses/new`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Criar Novo Curso
                  </Link>
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses!.map((course) => (
                  <Link key={course.id} href={`${currentPortal.baseRoute}/courses/${course.id}`}>
                    <Card className="overflow-hidden h-full cursor-pointer hover:shadow-md transition-shadow">
                      {course.imageUrl ? (
                        <img 
                          src={course.imageUrl} 
                          alt={course.title} 
                          className="h-40 w-full object-cover rounded-t-lg"
                        />
                      ) : renderPlaceholderImage(course.title)}
                      
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{course.title}</CardTitle>
                            <div className="text-xs font-medium text-muted-foreground">
                              Código: {course.code}
                            </div>
                          </div>
                          {renderStatus(course.status || 'draft')}
                        </div>
                        <CardDescription className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          <span className="text-xs">
                            Criado em {new Date(course.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        {course.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {truncateText(course.description, 100)}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center border px-2 py-0.5 rounded-md bg-slate-50">
                            <span>{getAreaName(course.area)}</span>
                          </div>
                          {course.courseCategory && (
                            <div className="flex items-center border px-2 py-0.5 rounded-md bg-slate-50">
                              <span>{getCourseCategoryName(course.courseCategory)}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <BookOpen className="h-3.5 w-3.5 mr-1" /> 
                            <span>12 módulos</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1" /> 
                            <span>42 alunos</span>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter>
                        <div className="w-full flex justify-between items-center">
                          {course.price ? (
                            <span className="font-semibold text-lg">
                              {formatCurrency(course.price)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Grátis</span>
                          )}
                          <Button variant="outline" size="sm">Ver Detalhes</Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCourses!.map((course) => (
                  <Link key={course.id} href={`${currentPortal.baseRoute}/courses/${course.id}`}>
                    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        {course.imageUrl ? (
                          <img 
                            src={course.imageUrl} 
                            alt={course.title} 
                            className="h-40 md:h-auto md:w-48 object-cover md:rounded-l-lg md:rounded-t-none rounded-t-lg"
                          />
                        ) : (
                          <div className={`h-40 md:h-auto md:w-48 flex items-center justify-center bg-blue-100 text-blue-800 md:rounded-l-lg md:rounded-t-none rounded-t-lg`}>
                            <span className="text-3xl font-bold">
                              {course.title.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex-grow p-4">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{course.title}</h3>
                              <div className="text-xs font-medium text-muted-foreground">
                                Código: {course.code}
                              </div>
                            </div>
                            {renderStatus(course.status || 'draft')}
                          </div>
                          
                          {course.description && (
                            <p className="text-sm text-muted-foreground my-2">
                              {truncateText(course.description, 150)}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1" /> 
                              <span>Criado em {new Date(course.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center border px-2 py-0.5 rounded-md bg-slate-50">
                              <span className="text-xs">Área: {getAreaName(course.area)}</span>
                            </div>
                            {course.courseCategory && (
                              <div className="flex items-center border px-2 py-0.5 rounded-md bg-slate-50">
                                <span className="text-xs">Categoria: {getCourseCategoryName(course.courseCategory)}</span>
                              </div>
                            )}
                            <div className="flex items-center">
                              <BookOpen className="h-3.5 w-3.5 mr-1" /> 
                              <span>12 módulos</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="h-3.5 w-3.5 mr-1" /> 
                              <span>42 alunos</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 flex flex-col justify-between items-end">
                          {course.price ? (
                            <span className="font-semibold text-lg">
                              {formatCurrency(course.price)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Grátis</span>
                          )}
                          <Button variant="outline" size="sm" className="mt-4">Ver Detalhes</Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Os outros TabsContent teriam lógica similar, mas com filtros aplicados */}
          <TabsContent value="published" className="space-y-4">
            {/* Conteúdo filtrado para cursos publicados */}
          </TabsContent>
          
          <TabsContent value="draft" className="space-y-4">
            {/* Conteúdo filtrado para rascunhos */}
          </TabsContent>
          
          <TabsContent value="archived" className="space-y-4">
            {/* Conteúdo filtrado para arquivados */}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}