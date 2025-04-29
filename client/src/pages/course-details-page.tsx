import React from "react";
import { Helmet } from "react-helmet";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getQueryFn } from "@/lib/queryClient";
import { Course } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, ArrowLeft, BookOpen, Calendar, Clock, Edit, ExternalLink, 
  FileText, Globe, GraduationCap, LayoutDashboard, Play, Users 
} from "lucide-react";

export default function CourseDetailsPage() {
  // Capturar o ID do curso da URL
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id);

  // Buscar detalhes do curso
  const {
    data: course,
    isLoading,
    error
  } = useQuery<Course>({
    queryKey: ['/api/courses', courseId],
    queryFn: getQueryFn({ on401: 'throw' })
  });

  // Buscar módulos do curso
  const {
    data: modules,
    isLoading: isLoadingModules
  } = useQuery<any[]>({
    queryKey: ['/api/courses', courseId, 'modules'],
    queryFn: getQueryFn({ on401: 'throw' }),
    // Não buscar se não tivermos o curso ainda
    enabled: !!course
  });

  // Estado dos tabs e acordeon
  const [activeAccordion, setActiveAccordion] = React.useState<string[]>([]);

  // Função para renderizar o status do curso
  const renderStatus = (status: string) => {
    const statusConfig: Record<string, { color: string, label: string }> = {
      draft: { color: "bg-yellow-100 text-yellow-800", label: "Rascunho" },
      published: { color: "bg-green-100 text-green-800", label: "Publicado" },
      archived: { color: "bg-gray-100 text-gray-800", label: "Arquivado" }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <Badge variant="outline" className={`${config.color} border-none`}>
        {config.label}
      </Badge>
    );
  };
  
  // Função para renderizar o nome amigável da área do curso
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
  
  // Função para renderizar o nome amigável da categoria educacional
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

  // Calcular estatísticas a partir dos dados reais
  const computeStats = () => {
    // Valores padrão
    const stats = {
      lessonsCount: 0,
      modulesCount: 0,
      studentsCount: 42, // Simulado: será substituído por API de matrículas
      totalDuration: "0min",
      isFree: true
    };

    // Se não temos dados do curso ainda, retornamos os valores padrão
    if (!course) return stats;
    
    // Atualizamos o status de curso gratuito/pago
    stats.isFree = !course.price;
    
    // Se temos módulos, calculamos as estatísticas relacionadas
    if (modules && modules.length > 0) {
      let totalLessons = 0;
      stats.modulesCount = modules.length;
      
      totalLessons = modules.reduce((count, module) => {
        return count + (module.lessons ? module.lessons.length : 0);
      }, 0);
      
      stats.lessonsCount = totalLessons;
      
      // Duração aproximada (10 minutos por aula por enquanto)
      const totalDuration = totalLessons * 10;
      stats.totalDuration = totalDuration > 60 
        ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}min` 
        : `${totalDuration}min`;
    }

    return stats;
  };

  const courseStats = computeStats();

  if (isLoading) {
    return (
      <AppShell>
        <div className="container py-4 space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/courses">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Skeleton className="h-7 w-52" />
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="col-span-2 space-y-4">
              <Skeleton className="h-64 w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
            
            <div className="space-y-3">
              <Skeleton className="h-[280px] w-full rounded-lg" />
              <Skeleton className="h-[140px] w-full rounded-lg" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !course) {
    return (
      <AppShell>
        <div className="container py-4 space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/courses">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Curso não encontrado</h1>
          </div>
          <div className="rounded-lg border border-destructive/50 p-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <p className="text-destructive mb-3">Não foi possível carregar os detalhes do curso. Por favor, tente novamente mais tarde.</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/courses">Voltar para Cursos</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Helmet>
        <title>{`${course.title || 'Detalhes do curso'} | Edunéxia`}</title>
      </Helmet>
      
      <div className="container py-4 space-y-4">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/courses">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            {renderStatus(course.status || 'draft')}
          </div>
          
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="h-8">
              <Globe className="h-4 w-4 mr-1.5" />
              Visualizar
            </Button>
            <Button size="sm" className="h-8" asChild>
              <Link href={`/courses/${courseId}/edit`}>
                <Edit className="h-4 w-4 mr-1.5" />
                Editar Curso
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {/* Conteúdo principal */}
          <div className="col-span-2 space-y-6">
            {/* Imagem do curso */}
            {course.imageUrl ? (
              <img 
                src={course.imageUrl} 
                alt={course.title} 
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-24 h-24 text-primary" />
              </div>
            )}
            
            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="curriculum">Currículo</TabsTrigger>
                <TabsTrigger value="materials">Materiais</TabsTrigger>
              </TabsList>
              
              {/* Aba de Visão Geral */}
              <TabsContent value="overview" className="space-y-5 pt-4 px-1">
                <div>
                  <h3 className="text-lg font-medium mb-3">Descrição</h3>
                  <p className="text-muted-foreground">
                    {course.description || "Este curso ainda não possui uma descrição."}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Detalhes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Criação</p>
                        <p className="font-medium">{course.createdAt ? new Date(course.createdAt).toLocaleDateString('pt-BR') : "Data não disponível"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Alunos Matriculados</p>
                        <p className="font-medium">{courseStats.studentsCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Aulas</p>
                        <p className="font-medium">{courseStats.lessonsCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duração Total</p>
                        <p className="font-medium">{courseStats.totalDuration}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Aba de Currículo */}
              <TabsContent value="curriculum" className="space-y-5 pt-4 px-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium mb-1">Módulos e Aulas</h3>
                  <Button size="sm" className="h-8">
                    <Edit className="h-4 w-4 mr-1.5" />
                    Editar Currículo
                  </Button>
                </div>
                
                {isLoadingModules ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-8 w-full ml-4" />
                        <Skeleton className="h-8 w-full ml-4" />
                      </div>
                    ))}
                  </div>
                ) : modules && modules.length > 0 ? (
                  <Accordion
                    type="multiple"
                    value={activeAccordion}
                    onValueChange={setActiveAccordion}
                    className="w-full"
                  >
                    {modules.map((module) => (
                      <AccordionItem key={module.id} value={`module-${module.id}`}>
                        <AccordionTrigger className="hover:bg-accent hover:text-accent-foreground px-4 rounded-md">
                          <div className="flex justify-between items-center w-full pr-4">
                            <span className="font-medium">{module.title}</span>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <FileText className="h-3.5 w-3.5 mr-1" />
                                {module.lessons ? module.lessons.length : 0} aulas
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                {/* Lógica de duração total a ser implementada */}
                                {module.lessons ? `Aprox. ${module.lessons.length * 10}min` : '0min'}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 py-2">
                            {module.lessons && module.lessons.length > 0 ? (
                              module.lessons.map((lesson: any) => (
                                <div 
                                  key={lesson.id} 
                                  className="flex items-center justify-between p-2 hover:bg-accent hover:text-accent-foreground rounded-md ml-4"
                                >
                                  <div className="flex items-center gap-2">
                                    <Play className="h-4 w-4 text-primary" />
                                    <span>{lesson.title}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {lesson.duration || "10min"}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-muted-foreground py-4 ml-4">
                                Nenhuma aula disponível neste módulo.
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center p-6 border rounded-lg">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-lg font-medium">Nenhum conteúdo disponível</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Este curso ainda não possui módulos ou aulas cadastrados.
                    </p>
                    <Button size="sm" className="h-8">
                      <Edit className="h-4 w-4 mr-1.5" />
                      Adicionar Módulos
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              {/* Aba de Materiais */}
              <TabsContent value="materials" className="space-y-5 pt-4 px-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium mb-1">Materiais Complementares</h3>
                  <Button size="sm" className="h-8">
                    <Edit className="h-4 w-4 mr-1.5" />
                    Adicionar Materiais
                  </Button>
                </div>
                
                <div className="text-center p-6 border rounded-lg">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Nenhum material disponível</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Este curso ainda não possui materiais complementares.
                  </p>
                  <Button size="sm" className="h-8">
                    <Edit className="h-4 w-4 mr-1.5" />
                    Adicionar Materiais
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Barra lateral */}
          <div className="space-y-3">
            {/* Cartão de Informações */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg mb-1">Informações do Curso</h3>
              
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <span className="text-muted-foreground text-sm">Preço:</span>
                  <span className="font-medium text-sm text-right">
                    {course.price ? formatCurrency(course.price) : "Grátis"}
                  </span>
                
                  <span className="text-muted-foreground text-sm">Status:</span>
                  <div className="text-right">{renderStatus(course.status || 'draft')}</div>
                </div>
                
                <Separator className="my-1.5" />
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <span className="text-muted-foreground text-sm">Área:</span>
                  <span className="text-sm text-right">{getAreaName(course.area)}</span>
                
                  <span className="text-muted-foreground text-sm">Categoria:</span>
                  <span className="text-sm text-right">{getCourseCategoryName(course.courseCategory)}</span>
                </div>
                
                <Separator className="my-1.5" />
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <span className="text-muted-foreground text-sm">Criado em:</span>
                  <span className="text-sm text-right">{course.createdAt ? new Date(course.createdAt).toLocaleDateString('pt-BR') : "N/D"}</span>
                
                  <span className="text-muted-foreground text-sm">Atualização:</span>
                  <span className="text-sm text-right">{course.updatedAt ? new Date(course.updatedAt).toLocaleDateString('pt-BR') : "N/D"}</span>
                </div>
                
                <Separator className="my-1.5" />
                
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">
                      {courseStats.studentsCount} alunos matriculados
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">
                      {courseStats.lessonsCount} aulas
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">
                      {courseStats.totalDuration} de duração
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-1 space-y-1.5">
                <Button size="sm" className="w-full h-8" asChild>
                  <Link href={`/courses/${courseId}/edit`}>
                    <Edit className="h-4 w-4 mr-1.5" />
                    Editar Curso
                  </Link>
                </Button>
                
                <Button size="sm" variant="outline" className="w-full h-8">
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Visualizar como Aluno
                </Button>
              </div>
            </div>
            
            {/* Acesso Rápido */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg mb-1">Acesso Rápido</h3>
              
              <div className="grid grid-cols-1 gap-1.5">
                <Button variant="outline" size="sm" className="w-full justify-start h-8">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard do Curso
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start h-8">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Alunos
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start h-8">
                  <FileText className="h-4 w-4 mr-2" />
                  Materiais de Apoio
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}