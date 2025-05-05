import React from "react";
import { Helmet } from "react-helmet";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getQueryFn } from "@/lib/queryClient";
import { Course } from "@shared/schema";
import { ModuleForm } from "@/components/modules/module-form";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AlertTriangle, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";

export default function ModuleCreatePage() {
  // Capturar ID do curso da URL
  // A rota definida no App.tsx é "/admin/courses/:id/modules/new"
  const params = useParams();
  console.log("Parâmetros da URL (ModuleCreatePage):", params);
  
  const id = params.id;
  
  if (!id) {
    console.error("ID do curso ausente na URL");
  }
  
  const courseId = parseInt(id || "0");

  // Buscar detalhes do curso
  const { 
    data: course, 
    isLoading: isLoadingCourse, 
    error: courseError 
  } = useQuery<Course>({
    queryKey: ['/api/courses', courseId],
    queryFn: getQueryFn({ on401: 'throw' })
  });

  if (isLoadingCourse) {
    return (
      <AppShell>
        <div className="container py-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando informações do curso...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (courseError || !course) {
    return (
      <AppShell>
        <div className="container py-6">
          <div className="max-w-lg mx-auto border border-destructive/50 rounded-lg p-6 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Erro ao carregar dados</h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível encontrar o curso solicitado. Verifique se você tem acesso a este recurso.
            </p>
            <Button asChild>
              <Link href="/admin/courses">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para lista de cursos
              </Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Helmet>
        <title>{`Novo Módulo | ${course.title} | Edunéxia`}</title>
      </Helmet>

      <div className="container py-6 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/courses">Cursos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/admin/courses/${courseId}`}>{course.title}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink>Novo Módulo</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Adicionar Novo Módulo</h1>
          <ModuleForm courseId={courseId} />
        </div>
      </div>
    </AppShell>
  );
}