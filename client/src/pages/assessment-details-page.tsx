import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Save } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import AssessmentResults from "@/components/assessments/assessment-results";
import { Skeleton } from "@/components/ui/skeleton";

// Tradução dos tipos de avaliação
const assessmentTypeLabels: Record<string, string> = {
  'exam': 'Prova',
  'assignment': 'Trabalho',
  'project': 'Projeto',
  'quiz': 'Questionário',
  'presentation': 'Apresentação',
  'participation': 'Participação'
};

export default function AssessmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const assessmentId = parseInt(id);
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Consulta para obter os detalhes da avaliação
  const {
    data: assessment,
    isLoading: isLoadingAssessment,
    error: assessmentError
  } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}`],
    enabled: !isNaN(assessmentId),
  });

  // Consulta para obter os resultados da avaliação
  const {
    data: results = [],
    isLoading: isLoadingResults,
    error: resultsError
  } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}/results`],
    enabled: !isNaN(assessmentId) && !!assessment,
  });

  // Consulta para obter os estudantes da turma
  const {
    data: classEnrollments = [],
    isLoading: isLoadingEnrollments,
    error: enrollmentsError
  } = useQuery({
    queryKey: [`/api/classes/${assessment?.classId}/enrollments`],
    enabled: !!assessment?.classId,
  });

  // Extrair array de estudantes dos enrollments
  const students = classEnrollments.map((enrollment: any) => enrollment.student);

  const isLoading = isLoadingAssessment || isLoadingResults || isLoadingEnrollments;
  const error = assessmentError || resultsError || enrollmentsError;

  // Função para formatar data
  const formatDate = (dateString: Date | string | null | undefined) => {
    if (!dateString) return "Não definido";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  if (error) {
    return (
      <AppShell>
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Erro</CardTitle>
              <CardDescription>Ocorreu um erro ao carregar os dados da avaliação</CardDescription>
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

  return (
    <AppShell>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/admin/classes/${assessment?.classId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Turma
          </Button>

          {(user?.role === 'admin' || (user?.role === 'teacher' && user?.id === assessment?.createdBy)) && (
            <Button 
              onClick={() => navigate(`/admin/assessments/${assessmentId}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar Avaliação
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                {isLoadingAssessment ? (
                  <Skeleton className="h-8 w-64" />
                ) : (
                  <CardTitle className="text-2xl">{assessment?.title}</CardTitle>
                )}
                
                {isLoadingAssessment ? (
                  <Skeleton className="h-5 w-32 mt-2" />
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {assessmentTypeLabels[assessment?.type] || assessment?.type}
                    </Badge>
                    <Badge variant={assessment?.isActive ? "default" : "secondary"}>
                      {assessment?.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações da Avaliação</h3>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoadingAssessment ? (
                  <>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </>
                ) : (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Descrição</h4>
                      <p className="mt-1">
                        {assessment?.description || "Sem descrição"}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Pontuação Total</h4>
                      <p className="mt-1 text-xl font-semibold">
                        {assessment?.totalPoints || 0} pontos
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Peso</h4>
                      <p className="mt-1">
                        {assessment?.weight || 1}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Disponível A Partir De</h4>
                      <p className="mt-1">
                        {assessment?.availableFrom 
                          ? formatDate(assessment.availableFrom)
                          : "Não definido"}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Disponível Até</h4>
                      <p className="mt-1">
                        {assessment?.availableTo 
                          ? formatDate(assessment.availableTo)
                          : "Não definido"}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Data de Entrega</h4>
                      <p className="mt-1">
                        {assessment?.dueDate 
                          ? formatDate(assessment.dueDate)
                          : "Não definido"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Instruções */}
            {assessment?.instructions && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Instruções</h3>
                <Separator />
                <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                  {assessment.instructions}
                </div>
              </div>
            )}

            {/* Resultados dos Alunos */}
            {!isLoading && assessment && (
              <AssessmentResults
                assessmentId={assessmentId}
                assessment={assessment}
                results={results}
                students={students}
                userRole={user?.role || ''}
                currentUserId={user?.id || 0}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}