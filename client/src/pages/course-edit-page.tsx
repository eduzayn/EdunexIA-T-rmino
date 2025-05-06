import React from "react";
import { Helmet } from "react-helmet";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { CourseForm } from "@/components/courses/course-form";
import { getQueryFn } from "@/lib/queryClient";
import { Course } from "@shared/schema";

export default function CourseEditPage() {
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

  // Estado de carregamento
  if (isLoading) {
    return (
      <AppShell>
        <div className="container py-4 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando informações do curso...</p>
        </div>
      </AppShell>
    );
  }

  // Estado de erro
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
            <h1 className="text-xl font-bold">Editar Curso</h1>
          </div>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível carregar as informações do curso. Por favor, tente novamente mais tarde.
            </AlertDescription>
          </Alert>
          <Button variant="outline" asChild>
            <Link href="/admin/courses">Voltar para Cursos</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Helmet>
        <title>{`Editar ${course.title} | Edunéxia`}</title>
      </Helmet>
      
      <div className="container py-4 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Editar Curso</h1>
        </div>
        
        {/* Formulário */}
        <CourseForm initialData={course} courseId={courseId} />
      </div>
    </AppShell>
  );
}