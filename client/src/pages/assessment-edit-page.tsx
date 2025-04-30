import { AppShell } from "@/components/layout/app-shell";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AssessmentForm from "@/components/assessments/assessment-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function AssessmentEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const assessmentId = parseInt(id);
  const { user } = useAuth();
  
  // Consultar avaliação para edição
  const { 
    data: assessment, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}`],
    enabled: !isNaN(assessmentId),
  });

  if (error) {
    return (
      <AppShell>
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Erro</CardTitle>
              <CardDescription>
                Ocorreu um erro ao carregar os dados da avaliação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">{(error as Error).message}</p>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()} 
                className="mt-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Carregando...</CardTitle>
              <CardDescription>
                Aguarde enquanto carregamos os dados da avaliação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-full bg-muted animate-pulse rounded-md"></div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Verificar permissões - somente admin ou o professor que criou pode editar
  if (
    assessment && 
    user?.role !== 'admin' && 
    (user?.role !== 'teacher' || user?.id !== assessment.createdBy)
  ) {
    return (
      <AppShell>
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para editar esta avaliação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Apenas administradores ou o professor que criou a avaliação podem editá-la.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/admin/assessments/${assessmentId}`)} 
                className="mt-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Detalhes
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container py-6">
        {assessment && (
          <AssessmentForm 
            assessment={assessment} 
            classId={assessment.classId} 
            isEdit={true} 
          />
        )}
      </div>
    </AppShell>
  );
}