import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, truncateText } from "@/lib/utils";
import { BookOpen, Grid3X3, List, Search, GraduationCap } from "lucide-react";
import { usePortal } from "@/hooks/use-portal";

// Interface para os cursos com progresso do aluno
interface StudentCourse {
  id: number;
  name: string;  // Mudado de 'title' para 'name' para corresponder à API
  description?: string;
  shortDescription?: string | null;
  area?: string | null;
  progress?: number;
  subjectsCount?: number;
  price?: number | null;
  imageUrl?: string | null;
  status?: string;
  code?: string;
  tenantId?: number;
  createdAt?: string;
}

export default function StudentCoursesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const { currentPortal } = usePortal();

  // Buscar cursos do aluno usando a API específica
  const {
    data: courses = [],
    isLoading,
    error
  } = useQuery<StudentCourse[]>({
    queryKey: ['/api/student/courses'],
    gcTime: 1000 * 60 * 5, // 5 minutos
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Filtrar cursos baseado na busca
  const filteredCourses = courses.filter(course => {
    const courseName = course.name || '';
    const courseDesc = course.shortDescription || course.description || '';
    
    return courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           courseDesc.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Função para renderizar placeholder de imagem
  const renderPlaceholderImage = (courseName: string) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-purple-100 text-purple-800",
      "bg-pink-100 text-pink-800",
      "bg-green-100 text-green-800",
      "bg-yellow-100 text-yellow-800"
    ];
    const color = colors[courseName.length % colors.length];
    const initials = courseName
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
  
  // Função para obter o nome da área do curso
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

  return (
    <AppShell>
      <Helmet>
        <title>Meus Cursos | Edunéxia</title>
      </Helmet>

      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meus Cursos</h1>
            <p className="text-muted-foreground">
              Visualize e acesse todos os seus cursos
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar em meus cursos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
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

        {/* Conteúdo principal - Listagem de cursos */}
        <div className="space-y-4">
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
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-lg border p-6 text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">Nenhum curso encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {searchTerm ? 'Nenhum curso corresponde à sua busca.' : 'Você ainda não está matriculado em nenhum curso.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Link key={course.id} href={`${currentPortal.baseRoute}/courses/${course.id}`}>
                  <Card className="overflow-hidden h-full cursor-pointer hover:shadow-md transition-shadow">
                    {course.imageUrl ? (
                      <img 
                        src={course.imageUrl} 
                        alt={course.name} 
                        className="h-40 w-full object-cover rounded-t-lg"
                      />
                    ) : renderPlaceholderImage(course.name)}
                    
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                        <Badge className="bg-blue-100 text-blue-800 border-none">
                          {getAreaName(course.area)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-2">
                      {course.shortDescription && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {truncateText(course.shortDescription, 80)}
                        </p>
                      )}
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                      
                      <div className="flex mt-3 text-sm text-muted-foreground gap-x-3">
                        <div className="flex items-center">
                          <BookOpen className="h-3.5 w-3.5 mr-1" /> 
                          <span>{course.subjectsCount} disciplinas</span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        Continuar Estudando
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCourses.map((course) => (
                <Link key={course.id} href={`${currentPortal.baseRoute}/courses/${course.id}`}>
                  <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      {course.imageUrl ? (
                        <img 
                          src={course.imageUrl} 
                          alt={course.name} 
                          className="h-40 md:h-auto md:w-48 object-cover md:rounded-l-lg md:rounded-t-none rounded-t-lg"
                        />
                      ) : (
                        <div className={`h-40 md:h-auto md:w-48 flex items-center justify-center bg-blue-100 text-blue-800 md:rounded-l-lg md:rounded-t-none rounded-t-lg`}>
                          <span className="text-3xl font-bold">
                            {course.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex-grow p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{course.name}</h3>
                            <Badge className="mt-1 bg-blue-100 text-blue-800 border-none">
                              {getAreaName(course.area)}
                            </Badge>
                          </div>
                        </div>
                        
                        {course.shortDescription && (
                          <p className="text-sm text-muted-foreground my-2">
                            {truncateText(course.shortDescription, 150)}
                          </p>
                        )}
                        
                        <div className="space-y-1 mt-3 mb-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                        
                        <div className="flex items-center gap-x-3 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <BookOpen className="h-3.5 w-3.5 mr-1" /> 
                            <span>{course.subjectsCount} disciplinas</span>
                          </div>
                          
                          <Button variant="outline" size="sm" className="ml-auto">
                            Continuar Estudando
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}