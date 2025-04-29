import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, BookOpen, AreaChart } from 'lucide-react';
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
import { Subject } from '@shared/schema';
import { usePortal } from '@/hooks/use-portal';

export function SubjectsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentPortal } = usePortal();
  
  // Buscar disciplinas
  const { data: subjects, isLoading, error } = useQuery({
    queryKey: ['/api/subjects'],
    refetchOnWindowFocus: false,
  });

  // Excluir disciplina
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/subjects/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Disciplina excluída',
        description: 'A disciplina foi excluída com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir disciplina',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-36">
        <p className="text-gray-500">Carregando disciplinas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
        <p>Erro ao carregar disciplinas: {(error as Error).message}</p>
      </div>
    );
  }

  if (!subjects || subjects.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium mb-2">Nenhuma disciplina encontrada</h3>
        <p className="text-gray-500 mb-4">Não há disciplinas cadastradas para este tenant.</p>
        <Button asChild>
          <Link to={`${currentPortal.baseRoute}/subjects/new`}>
            Criar primeira disciplina
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Disciplinas</h2>
        <Button asChild>
          <Link to={`${currentPortal.baseRoute}/subjects/new`}>
            Nova Disciplina
          </Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Carga Horária</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.map((subject: Subject) => (
            <TableRow key={subject.id}>
              <TableCell className="font-medium">{subject.title}</TableCell>
              <TableCell>{subject.area || '—'}</TableCell>
              <TableCell>
                {subject.workload 
                  ? `${subject.workload} horas` 
                  : '—'}
              </TableCell>
              <TableCell>
                <Badge variant={subject.isActive ? "default" : "secondary"}>
                  {subject.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`${currentPortal.baseRoute}/subjects/${subject.id}`}>
                      <AreaChart className="h-4 w-4" />
                      <span className="sr-only">Ver detalhes</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`${currentPortal.baseRoute}/subjects/${subject.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir disciplina</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a disciplina "{subject.title}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteMutation.mutate(subject.id)}
                          className="bg-red-600 hover:bg-red-700"
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