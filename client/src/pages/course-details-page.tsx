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
import { ModulesList } from "@/components/modules/modules-list";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, ArrowLeft, BookOpen, Calendar, Clock, Edit, ExternalLink, 
  FileText, Globe, GraduationCap, LayoutDashboard, Play, Share, Users 
} from "lucide-react";

export default function CourseDetailsPage() {
  // Capturar o ID do curso da URL
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id);
  const { toast } = useToast();

  // Buscar detalhes do curso
  const {
    data: course,
    isLoading,
    error
  } = useQuery<Course>({
    queryKey: ['/api/courses', courseId],
    queryFn: getQueryFn({ on401: 'throw' }),
    onSuccess: (data) => {
      console.log("Dados do curso recebidos:", {
        id: data?.id,
        codigo: data?.code,
        createdAt: data?.createdAt,
        area: data?.area,
        categoria: data?.courseCategory,
        dataTypes: {
          code: typeof data?.code,
          createdAt: typeof data?.createdAt,
          area: typeof data?.area,
          courseCategory: typeof data?.courseCategory
        }
      });
    }
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
              <Link href="/admin/courses">
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
              <Link href="/admin/courses">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Curso não encontrado</h1>
          </div>
          <div className="rounded-lg border border-destructive/50 p-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <p className="text-destructive mb-3">Não foi possível carregar os detalhes do curso. Por favor, tente novamente mais tarde.</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/courses">Voltar para Cursos</Link>
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
              <Link href="/admin/courses">
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
              <Link href={`/admin/courses/${courseId}/edit`}>
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
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Código do Curso</p>
                        <p className="font-medium">
                          {typeof course.code === 'number' ? course.code : "Não definido"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Criação</p>
                        <p className="font-medium">
                          {course.createdAt ? 
                            new Date(course.createdAt).toLocaleDateString('pt-BR') : 
                            "Data não disponível"}
                        </p>
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
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Área</p>
                        <p className="font-medium">
                          {course.area ? getAreaName(course.area) : "Não definida"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Categoria Educacional</p>
                        <p className="font-medium">
                          {course.courseCategory ? getCourseCategoryName(course.courseCategory) : "Não definida"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Aba de Currículo */}
              <TabsContent value="curriculum" className="space-y-5 pt-4 px-1">
                {courseId && <ModulesList courseId={courseId} />}
              </TabsContent>
              
              {/* Aba de Materiais */}
              <TabsContent value="materials" className="pt-4 px-1">
                <div className="text-center py-8 border rounded-lg">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">Nenhum material disponível</h3>
                  <p className="text-muted-foreground mb-4">Adicione materiais complementares para este curso.</p>
                  <Button 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Função em desenvolvimento",
                        description: "A funcionalidade de adicionar materiais será disponibilizada em breve.",
                        variant: "default"
                      });
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                    Adicionar Material
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg border shadow-sm">
              <div className="p-5">
                <h3 className="font-medium mb-4">Informações de Matrícula</h3>
                <div className="space-y-3">
                  {course.price ? (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Valor:</span>
                      <span className="font-bold text-lg">{formatCurrency(course.price)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Valor:</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-none">Gratuito</Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Formato:</span>
                    <span>100% Online</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Método:</span>
                    <span>Autodidata</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t">
                <Button className="w-full" asChild>
                  <Link href={`/admin/courses/${courseId}/enrollments`}>
                    <Users className="h-4 w-4 mr-1.5" />
                    Ver Matrículas
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="rounded-lg border shadow-sm p-5 space-y-3">
              <h3 className="font-medium mb-1">Ações do Curso</h3>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/courses/${courseId}/edit`}>
                    <Edit className="h-4 w-4 mr-1.5" />
                    Editar Curso
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Share className="h-4 w-4 mr-1.5" />
                  Compartilhar Curso
                </Button>
                
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-1.5" />
                    Ir para Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}