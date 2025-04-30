import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, AreaChart, ArrowLeft, Users, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
} from '@/components/ui/alert-dialog';
import type { Class } from '@shared/schema';
import { usePortal } from '@/hooks/use-portal';

export function ClassesList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentPortal } = usePortal();
  const [, navigate] = useLocation();
  
  // Buscar turmas
  const { data: classes = [], isLoading, error } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
    refetchOnWindowFocus: false,
  });

  // Excluir turma
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/classes/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Turma excluída',
        description: 'A turma foi excluída com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir turma',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-36">
        <p className="text-gray-500">Carregando turmas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
        <p>Erro ao carregar turmas: {(error as Error).message}</p>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium mb-2">Nenhuma turma encontrada</h3>
        <p className="text-gray-500 mb-4">Não há turmas cadastradas para este tenant.</p>
        <Button asChild>
          <Link to={`${currentPortal.baseRoute}/classes/new`}>
            Criar primeira turma
          </Link>
        </Button>
      </div>
    );
  }

  // Função para renderizar o badge de status da turma
  const renderStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let label = "Programada";
    
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
        label = "Concluída";
        break;
      case "cancelled":
        variant = "destructive";
        label = "Cancelada";
        break;
    }
    
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Button 
        variant="ghost" 
        className="mb-2 -ml-2 flex items-center text-gray-600 hover:text-gray-900"
        onClick={() => navigate(`${currentPortal.baseRoute}`)}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar ao dashboard
      </Button>
        
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Turmas</h2>
        <Button asChild>
          <Link to={`${currentPortal.baseRoute}/classes/new`}>
            Nova Turma
          </Link>
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Professor</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((classItem) => (
            <TableRow key={classItem.id}>
              <TableCell className="font-medium">{classItem.code}</TableCell>
              <TableCell>{classItem.name}</TableCell>
              <TableCell>{classItem.teacherId ? `Professor ${classItem.teacherId}` : '—'}</TableCell>
              <TableCell>
                {classItem.startDate && classItem.endDate 
                  ? `${new Date(classItem.startDate).toLocaleDateString('pt-BR')} a ${new Date(classItem.endDate).toLocaleDateString('pt-BR')}` 
                  : (classItem.startDate 
                    ? `Início: ${new Date(classItem.startDate).toLocaleDateString('pt-BR')}` 
                    : '—')}
              </TableCell>
              <TableCell>
                {renderStatusBadge(classItem.status)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`${currentPortal.baseRoute}/classes/${classItem.id}`}>
                      <AreaChart className="h-4 w-4" />
                      <span className="sr-only">Ver detalhes</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`${currentPortal.baseRoute}/classes/${classItem.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir turma</AlertDialogTitle>
                        <AlertDialogDescription>
                          Você tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita e todas as matrículas associadas também serão excluídas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteMutation.mutate(classItem.id)}
                          className="bg-red-500 hover:bg-red-600"
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