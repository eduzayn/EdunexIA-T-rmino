import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, ArrowLeft, BookOpen, Calendar, Check, Clock, Download, 
  FileText, GraduationCap, HeartPulse, Play, Users 
} from "lucide-react";
import { usePortal } from "@/hooks/use-portal";

// Interface para o curso enriquecido com dados do aluno
interface StudentCourse {
  id: number;
  title: string;
  description: string | null;
  shortDescription: string | null;
  code: number;
  area: string | null;
  courseCategory: string | null;
  price: number | null;
  status: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  tenantId: number;
  // Campos específicos para o aluno
  progress: number;
  isEnrolled: boolean;
  subjects: any[];
}

// Interface para o módulo de aprendizado
interface LearningModule {
  id: number;
  title: string;
  description: string | null;
  status: "available" | "locked" | "completed";
  type: "video" | "ebook" | "quiz" | "assignment";
  duration: string;
}

export default function StudentCourseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id);
  const { currentPortal } = usePortal();

  // Buscar detalhes do curso com a API específica para alunos
  const {
    data: course,
    isLoading,
    error
  } = useQuery<StudentCourse>({
    queryKey: ['/api/student/courses', courseId],
    queryFn: getQueryFn({ on401: 'throw' })
  });

  // Estado para simular módulos de aprendizado (em uma implementação real, viriam da API)
  const [modules] = useState<LearningModule[]>([
    {
      id: 1,
      title: "Introdução ao Curso",
      description: "Uma visão geral sobre o conteúdo e objetivos do curso.",
      status: "completed",
      type: "video",
      duration: "15min"
    },
    {
      id: 2,
      title: "Fundamentos Teóricos",
      description: "Conceitos básicos e fundamentação teórica necessária para o curso.",
      status: "available",
      type: "ebook",
      duration: "45min"
    },
    {
      id: 3,
      title: "Prática Guiada",
      description: "Exercícios práticos com orientação passo a passo.",
      status: "locked",
      type: "assignment",
      duration: "1h 30min"
    },
    {
      id: 4,
      title: "Avaliação de Conhecimentos",
      description: "Teste para verificar o aprendizado dos conceitos apresentados.",
      status: "locked",
      type: "quiz",
      duration: "30min"
    }
  ]);

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

  // Função para obter o nome da categoria do curso
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

  // Função para renderizar ícone do tipo de módulo
  const renderModuleTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-5 w-5 text-blue-500" />;
      case 'ebook':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'quiz':
        return <HeartPulse className="h-5 w-5 text-red-500" />;
      case 'assignment':
        return <FileText className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // Função para renderizar status do módulo
  const renderModuleStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-none"><Check className="h-3 w-3 mr-1" /> Concluído</Badge>;
      case 'available':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-none">Disponível</Badge>;
      case 'locked':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-none">Bloqueado</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="container py-4 space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`${currentPortal.baseRoute}/courses`}>
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
              <Link href={`${currentPortal.baseRoute}/courses`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Curso não encontrado</h1>
          </div>
          <div className="rounded-lg border border-destructive/50 p-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <p className="text-destructive mb-3">Não foi possível carregar os detalhes do curso. Por favor, tente novamente mais tarde.</p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`${currentPortal.baseRoute}/courses`}>Voltar para Cursos</Link>
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
              <Link href={`${currentPortal.baseRoute}/courses`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{course.title}</h1>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {/* Conteúdo principal */}
          <div className="col-span-2 space-y-6">
            {/* Imagem do curso e progresso */}
            <div className="space-y-3">
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
              
              {/* Barra de progresso */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Seu progresso</span>
                  <span className="text-sm font-medium">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>
            </div>
            
            {/* Tabs */}
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              </TabsList>
              
              {/* Aba de Conteúdo (principal para alunos) */}
              <TabsContent value="content" className="space-y-5 pt-4 px-1">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Módulos do Curso</h3>
                  
                  {modules.map((module) => (
                    <Card key={module.id} className={`overflow-hidden ${module.status === 'locked' ? 'opacity-70' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {renderModuleTypeIcon(module.type)}
                            </div>
                            <div>
                              <CardTitle className="text-base">{module.title}</CardTitle>
                              <CardDescription>{module.description}</CardDescription>
                            </div>
                          </div>
                          {renderModuleStatus(module.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex text-sm text-muted-foreground gap-3">
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            <span>{module.duration}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={module.status === 'locked'}
                          className="w-full"
                        >
                          {module.status === 'completed' ? 'Revisar' : 'Continuar'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              {/* Aba de Visão Geral */}
              <TabsContent value="overview" className="space-y-5 pt-4 px-1">
                <div>
                  <h3 className="text-lg font-medium mb-3">Descrição</h3>
                  <p className="text-muted-foreground">
                    {course.description || "Este curso ainda não possui uma descrição detalhada."}
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
                        <p className="font-medium">{course.code || "Não definido"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Início</p>
                        <p className="font-medium">{course.createdAt ? new Date(course.createdAt).toLocaleDateString('pt-BR') : "Data não disponível"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duração Total</p>
                        <p className="font-medium">8 semanas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Área</p>
                        <p className="font-medium">{getAreaName(course.area)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Categoria Educacional</p>
                        <p className="font-medium">{getCourseCategoryName(course.courseCategory)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Seu Progresso</CardTitle>
                <CardDescription>
                  Acompanhe sua evolução neste curso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Progresso geral:</span>
                  <span className="font-bold">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
                
                <div className="flex items-center justify-between mt-2">
                  <span className="font-medium">Módulos concluídos:</span>
                  <span className="font-bold">{modules.filter(m => m.status === 'completed').length}/{modules.length}</span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="font-medium">Tempo estimado restante:</span>
                  <span className="font-bold">2h 45min</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  Continuar Estudando
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Informações do Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Outros Alunos</p>
                    <p className="font-medium">42 matriculados</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Módulos</p>
                    <p className="font-medium">{modules.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Certificado</p>
                    <p className="font-medium">Disponível ao concluir</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}