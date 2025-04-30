import { AppShell } from "@/components/layout/app-shell";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AssessmentForm from "@/components/assessments/assessment-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet";

export default function AssessmentNewPage() {
  const { classId } = useParams<{ classId: string }>();
  const [location, navigate] = useLocation();
  
  // Verificar se estamos na rota centralizada (sem classId) ou na rota específica de turma
  const isFromCentralView = !classId;
  const classIdNumber = classId ? parseInt(classId) : undefined;
  
  // Consultar classe para garantir que existe e obter metadados (apenas se tiver classId)
  const { 
    data: classData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: classIdNumber ? [`/api/classes/${classIdNumber}`] : null,
    enabled: classIdNumber !== undefined && !isNaN(classIdNumber as number),
  });

  if (classIdNumber && error) {
    return (
      <AppShell>
        <Helmet>
          <title>Erro ao Criar Avaliação | Edunéxia</title>
        </Helmet>
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Erro</CardTitle>
              <CardDescription>
                Ocorreu um erro ao carregar os dados da turma
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

  if (classIdNumber && isLoading) {
    return (
      <AppShell>
        <Helmet>
          <title>Criando Avaliação | Edunéxia</title>
        </Helmet>
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Carregando...</CardTitle>
              <CardDescription>
                Aguarde enquanto carregamos os dados da turma
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

  return (
    <AppShell>
      <Helmet>
        <title>Nova Avaliação | Edunéxia</title>
      </Helmet>
      <div className="container py-6">
        <AssessmentForm classId={classIdNumber} isFromCentralView={isFromCentralView} />
      </div>
    </AppShell>
  );
}