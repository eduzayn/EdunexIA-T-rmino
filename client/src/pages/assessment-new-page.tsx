import { AppShell } from "@/components/layout/app-shell";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AssessmentForm from "@/components/assessments/assessment-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function AssessmentNewPage() {
  const { classId } = useParams<{ classId: string }>();
  const [, navigate] = useLocation();
  const classIdNumber = parseInt(classId);
  
  // Consultar classe para garantir que existe e obter metadados
  const { 
    data: classData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: [`/api/classes/${classIdNumber}`],
    enabled: !isNaN(classIdNumber),
  });

  if (error) {
    return (
      <AppShell>
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

  if (isLoading) {
    return (
      <AppShell>
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
      <div className="container py-6">
        <AssessmentForm classId={classIdNumber} />
      </div>
    </AppShell>
  );
}