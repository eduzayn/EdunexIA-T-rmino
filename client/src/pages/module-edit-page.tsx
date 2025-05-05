import React from "react";
import { Helmet } from "react-helmet";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getQueryFn } from "@/lib/queryClient";
import { Course, Module } from "@shared/schema";
import { ModuleForm } from "@/components/modules/module-form";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AlertTriangle, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";

export default function ModuleEditPage() {
  // Capturar IDs da URL
  // A rota no App.tsx é "/admin/courses/:courseId/modules/:moduleId/edit"
  const params = useParams();
  console.log("Parâmetros da URL:", params);
  
  // Extrair os IDs dos parâmetros
  const courseId = params.courseId;
  const moduleId = params.moduleId;
  
  if (!courseId || !moduleId) {
    console.error("IDs de curso ou módulo ausentes na URL");
  }
  
  const parsedCourseId = parseInt(courseId || "0");
  const parsedModuleId = parseInt(moduleId || "0");

  // Buscar detalhes do curso
  const { 
    data: course, 
    isLoading: isLoadingCourse, 
    error: courseError 
  } = useQuery<Course>({
    queryKey: ['/api/courses', parsedCourseId],
    queryFn: getQueryFn({ on401: 'throw' })
  });

  // Buscar detalhes do módulo
  const { 
    data: module, 
    isLoading: isLoadingModule, 
    error: moduleError 
  } = useQuery<Module>({
    queryKey: ['/api/modules', parsedModuleId],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!parsedModuleId
  });

  const isLoading = isLoadingCourse || isLoadingModule;
  const error = courseError || moduleError;

  if (isLoading) {
    return (
      <AppShell>
        <div className="container py-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando informações...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !course || !module) {
    return (
      <AppShell>
        <div className="container py-6">
          <div className="max-w-lg mx-auto border border-destructive/50 rounded-lg p-6 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Erro ao carregar dados</h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível encontrar o curso ou módulo solicitado. Verifique se você tem acesso a este recurso.
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
        <title>{`Editar Módulo | ${course.title} | Edunéxia`}</title>
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
                <Link href={`/admin/courses/${parsedCourseId}`}>{course.title}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink>Editar Módulo</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Editar Módulo: {module.title}</h1>
          <ModuleForm 
            courseId={parsedCourseId} 
            moduleId={parsedModuleId} 
            initialData={module} 
          />
        </div>
      </div>
    </AppShell>
  );
}