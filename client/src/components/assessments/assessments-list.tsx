import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Assessment } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Pencil, Plus, Trash } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Tradução dos tipos de avaliação
const assessmentTypeLabels: Record<string, string> = {
  'exam': 'Prova',
  'assignment': 'Trabalho',
  'project': 'Projeto',
  'quiz': 'Questionário',
  'presentation': 'Apresentação',
  'participation': 'Participação'
};

// Props para o componente de lista de avaliações
interface AssessmentsListProps {
  assessments: Assessment[];
  classId: number;
  userRole?: string;
}

export default function AssessmentsList({ assessments, classId, userRole }: AssessmentsListProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutação para excluir uma avaliação
  const deleteMutation = useMutation({
    mutationFn: async (assessmentId: number) => {
      const res = await apiRequest(
        "DELETE", 
        `/api/assessments/${assessmentId}`
      );
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Avaliação excluída",
        description: "A avaliação foi excluída com sucesso",
        variant: "default",
      });
      // Invalidar a consulta para atualizar a lista
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${classId}/assessments`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir avaliação",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Função para formatar data
  const formatDate = (dateString: Date | string | null | undefined) => {
    if (!dateString) return "Não definido";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const canManageAssessments = userRole === 'admin' || userRole === 'teacher';

  if (assessments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
          <CardDescription>Nenhuma avaliação cadastrada para esta turma</CardDescription>
        </CardHeader>
        <CardContent>
          {canManageAssessments && (
            <Button 
              variant="outline" 
              onClick={() => navigate(`/admin/classes/${classId}/assessments/new`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Avaliação
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Avaliações</CardTitle>
          <CardDescription>Gerencie as avaliações da turma</CardDescription>
        </div>
        {canManageAssessments && (
          <Button 
            onClick={() => navigate(`/admin/classes/${classId}/assessments/new`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Avaliação
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Total Pontos</TableHead>
              <TableHead>Data de Entrega</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.map((assessment) => (
              <TableRow key={assessment.id}>
                <TableCell className="font-medium">{assessment.title}</TableCell>
                <TableCell>{assessmentTypeLabels[assessment.type] || assessment.type}</TableCell>
                <TableCell>{assessment.totalPoints}</TableCell>
                <TableCell>{formatDate(assessment.dueDate)}</TableCell>
                <TableCell>
                  <Badge variant={assessment.isActive ? "default" : "secondary"}>
                    {assessment.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/admin/assessments/${assessment.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {canManageAssessments && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/assessments/${assessment.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Avaliação</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente a avaliação
                              e todos os dados relacionados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(assessment.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}