import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import { Assessment } from "@shared/schema";
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
import { useToast } from "@/hooks/use-toast";

// Tradução dos tipos de avaliação
const assessmentTypeLabels: Record<string, string> = {
  'exam': 'Prova',
  'assignment': 'Trabalho',
  'project': 'Projeto',
  'quiz': 'Questionário',
  'presentation': 'Apresentação',
  'participation': 'Participação'
};

// Props para o componente de tabela de avaliações
interface AssessmentsTableProps {
  assessments: Assessment[];
  baseUrl: string;
  classes: any[];
}

export default function AssessmentsTable({ assessments, baseUrl, classes }: AssessmentsTableProps) {
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
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      // Também invalidar a consulta para turmas específicas
      assessments.forEach((assessment) => {
        if (assessment.classId) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/classes/${assessment.classId}/assessments`] 
          });
        }
      });
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

  // Função para obter o nome da turma pelo ID
  const getClassName = (classId: number | undefined) => {
    if (!classId) return "Não vinculada";
    const classItem = classes.find(c => c.id === classId);
    return classItem ? classItem.name : `Turma #${classId}`;
  };

  // Determinar status da avaliação (Programada, Em andamento, Encerrada)
  const getAssessmentStatus = (assessment: Assessment) => {
    if (!assessment.isActive) return "inactive";
    
    const now = new Date();
    const availableFrom = assessment.availableFrom ? new Date(assessment.availableFrom) : null;
    const availableTo = assessment.availableTo ? new Date(assessment.availableTo) : null;
    const dueDate = assessment.dueDate ? new Date(assessment.dueDate) : null;
    
    if (availableFrom && now < availableFrom) return "scheduled";
    if (dueDate && now > dueDate) return "completed";
    if ((availableFrom && now >= availableFrom) || 
        (availableTo && now <= availableTo)) return "in_progress";
    
    return "scheduled";
  };

  // Renderizar badge de status
  const renderStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let label = "Em Andamento";
    
    switch (status) {
      case "scheduled":
        variant = "outline";
        label = "Programada";
        break;
      case "in_progress":
        variant = "default";
        label = "Em Andamento";
        break;
      case "completed":
        variant = "secondary";
        label = "Encerrada";
        break;
      case "inactive":
        variant = "destructive";
        label = "Inativa";
        break;
    }
    
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (assessments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhuma avaliação encontrada com os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead>Data de Entrega</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessments.map((assessment) => (
            <TableRow key={assessment.id}>
              <TableCell className="font-medium">{assessment.title}</TableCell>
              <TableCell>{assessmentTypeLabels[assessment.type] || assessment.type}</TableCell>
              <TableCell>{getClassName(assessment.classId)}</TableCell>
              <TableCell>{formatDate(assessment.dueDate)}</TableCell>
              <TableCell>
                {renderStatusBadge(getAssessmentStatus(assessment))}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link to={`${baseUrl}/assessments/${assessment.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link to={`${baseUrl}/assessments/${assessment.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
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
                          "{assessment.title}" e todos os dados relacionados.
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}