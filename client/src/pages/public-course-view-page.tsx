import React from "react";
import { Helmet } from "react-helmet";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, ArrowLeft, BookOpen, Calendar, FileText, 
  GraduationCap, Clock, Users, Share
} from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

// Layout simples para páginas públicas
function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container py-3 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-xl font-bold text-primary">Edunéxia</h1>
          </Link>
          <nav className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth">Acessar Plataforma</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-6 border-t">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Edunéxia - Plataforma Educacional
        </div>
      </footer>
    </div>
  );
}

// Interface para o curso
interface Course {
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
}

export default function PublicCourseViewPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id);

  // Buscar detalhes do curso
  const {
    data: course,
    isLoading,
    error
  } = useQuery<Course>({
    queryKey: ['/api/public/courses', courseId],
    queryFn: async ({ queryKey }) => {
      const url = `${queryKey[0]}/${queryKey[1]}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar curso: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    }
  });

  // Função para formatar preço em reais
  const formatCurrency = (value?: number | null) => {
    if (value === undefined || value === null) return "Gratuito";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
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

  if (isLoading) {
    return (
      <PublicShell>
        <div className="container py-4 space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
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
      </PublicShell>
    );
  }

  if (error || !course) {
    return (
      <PublicShell>
        <div className="container py-4 space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Curso não encontrado</h1>
          </div>
          <div className="rounded-lg border border-destructive/50 p-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <p className="text-destructive mb-3">Não foi possível carregar os detalhes do curso. Por favor, tente novamente mais tarde.</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Voltar para Página Inicial</Link>
            </Button>
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <Helmet>
        <title>{`${course.title || 'Detalhes do curso'} | Edunéxia`}</title>
      </Helmet>
      
      <div className="container py-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{course.title}</h1>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              const url = `${window.location.origin}/courses/${courseId}`;
              navigator.clipboard.writeText(url);
              toast({
                title: "Link copiado!",
                description: "URL do curso copiada para a área de transferência.",
              });
            }}>
              <Share className="h-4 w-4 mr-1.5" />
              Compartilhar
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth">Acessar Plataforma</Link>
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
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
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
                        <p className="font-medium">{course.code || "Não definido"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Criação</p>
                        <p className="font-medium">{course.createdAt ? new Date(course.createdAt).toLocaleDateString('pt-BR') : "Data não disponível"}</p>
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
                <CardTitle className="text-lg">Informações de Matrícula</CardTitle>
                <CardDescription>
                  Conheça os detalhes deste curso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/auth">
                    Acessar Plataforma
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}