import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, UserRound, ArrowLeft, GraduationCap, School } from 'lucide-react';
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
import type { User } from '@shared/schema';
import { usePortal } from '@/hooks/use-portal';

export function StudentsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentPortal } = usePortal();
  const [, navigate] = useLocation();
  
  // Buscar alunos
  const { data: students = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/students'],
    refetchOnWindowFocus: false,
  });

  // Excluir aluno
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/students/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Aluno excluído',
        description: 'O aluno foi excluído com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir aluno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-36">
        <p className="text-gray-500">Carregando alunos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-300 bg-red-50 p-4 rounded-lg">
        <p className="text-red-800">Erro ao carregar alunos: {error.toString()}</p>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/students'] })}
          className="mt-2"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div>
        <Button 
          variant="ghost" 
          className="mb-4 -ml-2 flex items-center text-gray-600 hover:text-gray-900"
          onClick={() => navigate(`${currentPortal.baseRoute}/dashboard`)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar para Dashboard
        </Button>
        
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <GraduationCap className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-2">Nenhum aluno encontrado</h3>
          <p className="text-gray-500 mb-4">Não há alunos cadastrados para esta instituição.</p>
          <Button asChild>
            <Link to={`${currentPortal.baseRoute}/students/new`}>
              Cadastrar primeiro aluno
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button 
        variant="ghost" 
        className="mb-2 -ml-2 flex items-center text-gray-600 hover:text-gray-900"
        onClick={() => navigate(`${currentPortal.baseRoute}/dashboard`)}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar ao dashboard
      </Button>
        
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Alunos</h2>
        <Button asChild>
          <Link to={`${currentPortal.baseRoute}/students/new`}>
            Novo Aluno
          </Link>
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.fullName}</TableCell>
              <TableCell>{student.username}</TableCell>
              <TableCell>{student.email}</TableCell>
              <TableCell>
                <Badge variant={student.isActive ? 'default' : 'secondary'}>
                  {student.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`${currentPortal.baseRoute}/students/${student.id}`}>
                      <UserRound className="h-4 w-4" />
                      <span className="sr-only">Ver detalhes</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`${currentPortal.baseRoute}/students/${student.id}/edit`}>
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
                        <AlertDialogTitle>Excluir aluno</AlertDialogTitle>
                        <AlertDialogDescription>
                          Você tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita e todas as matrículas associadas também serão excluídas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteMutation.mutate(student.id)}
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